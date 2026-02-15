// Cloudflare Worker - Remove Borrowed Item
// - Reads items.json from GitHub
// - Removes borrowed item from a person's borrowed_items array
// - Writes updated items.json back to GitHub
//
// Required Worker variables:
// - GITHUB_TOKEN (Secret): fine-grained PAT with Repository permissions -> Contents: Read & write for martinecececek/3VOM-site
// - ADMIN_KEY (Secret preferred): your admin password checked via header x-admin-key

export default {
   async fetch(request, env) {
      /* ---------------------------
       CORS (relaxed & reliable)
    ---------------------------- */
      const origin = request.headers.get("Origin") || "*";
      const corsHeaders = {
         "Access-Control-Allow-Origin": origin,
         "Access-Control-Allow-Methods": "DELETE, OPTIONS",
         "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      };

      if (request.method === "OPTIONS")
         return new Response(null, { headers: corsHeaders });
      if (request.method !== "DELETE")
         return new Response("Method not allowed", {
            status: 405,
            headers: corsHeaders,
         });

      /* ---------------------------
       Auth
    ---------------------------- */
      const adminKey = request.headers.get("x-admin-key");
      if (!adminKey || adminKey !== env.ADMIN_KEY) {
         return new Response("Unauthorized", {
            status: 401,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Repo config
    ---------------------------- */
      const OWNER = "martinecececek";
      const REPO = "3VOM-site";
      const BRANCH = "main";
      const ITEMS_JSON_PATH = "src/data/items.json";

      /* ---------------------------
       GitHub helpers
    ---------------------------- */
      const ghFetch = (url, options = {}) =>
         fetch(url, {
            ...options,
            headers: {
               Authorization: `Bearer ${env.GITHUB_TOKEN}`,
               Accept: "application/vnd.github+json",
               "User-Agent": "cf-worker-item-manager",
               ...(options.headers || {}),
            },
         });

      const contentsUrl = (path) =>
         `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

      async function getFile(path) {
         const res = await ghFetch(
            `${contentsUrl(path)}?ref=${encodeURIComponent(BRANCH)}`,
         );
         if (res.status === 404) return { exists: false };

         const text = await res.text();
         if (!res.ok) return { exists: false, status: res.status, error: text };

         const j = JSON.parse(text);
         const b64 = (j.content || "").replace(/\n/g, "");
         return {
            exists: true,
            sha: j.sha,
            text: b64 ? atob(b64) : "",
            raw: j,
         };
      }

      async function putFile(path, b64Content, message, sha) {
         const res = await ghFetch(contentsUrl(path), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               message,
               content: b64Content,
               branch: BRANCH,
               ...(sha ? { sha } : {}),
            }),
         });

         const text = await res.text();
         if (!res.ok) return { ok: false, status: res.status, error: text };
         return { ok: true, json: JSON.parse(text) };
      }

      /* ---------------------------
       Parse request body
    ---------------------------- */
      let payload;
      try {
         payload = await request.json();
      } catch (e) {
         return new Response("Invalid JSON", {
            status: 400,
            headers: corsHeaders,
         });
      }

      const { userId, borrowId } = payload;

      if (!userId || !borrowId) {
         return new Response("Missing userId or borrowId", {
            status: 400,
            headers: corsHeaders,
         });
      }

      // Convert userId to number to match items.json format
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
         return new Response("Invalid userId", {
            status: 400,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Read items.json
    ---------------------------- */
      const itemsFile = await getFile(ITEMS_JSON_PATH);

      if (itemsFile.error) {
         return new Response(`Failed to read items.json: ${itemsFile.error}`, {
            status: itemsFile.status || 500,
            headers: corsHeaders,
         });
      }

      if (!itemsFile.exists) {
         return new Response("items.json not found", {
            status: 404,
            headers: corsHeaders,
         });
      }

      let itemsData;
      try {
         itemsData = JSON.parse(itemsFile.text || "{}");
      } catch (e) {
         return new Response(`Invalid items.json: ${e.message}`, {
            status: 500,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Remove item from person's borrowed_items
    ---------------------------- */
      if (!Array.isArray(itemsData.people)) {
         return new Response("No people found in items.json", {
            status: 404,
            headers: corsHeaders,
         });
      }

      const person = itemsData.people.find((p) => p.id === userIdNum);
      if (!person) {
         return new Response(`User not found: ${userIdNum}`, {
            status: 404,
            headers: corsHeaders,
         });
      }

      if (!Array.isArray(person.borrowed_items)) {
         return new Response(`User has no borrowed items`, {
            status: 404,
            headers: corsHeaders,
         });
      }

      const initialLength = person.borrowed_items.length;
      person.borrowed_items = person.borrowed_items.filter(
         (item) => item.id !== borrowId
      );

      if (person.borrowed_items.length === initialLength) {
         return new Response(`Borrowed item not found: ${borrowId}`, {
            status: 404,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Write updated items.json back to GitHub
    ---------------------------- */
      const updatedText = JSON.stringify(itemsData, null, 2) + "\n";
      const updatedB64 = btoa(updatedText);

      const writeResult = await putFile(
         ITEMS_JSON_PATH,
         updatedB64,
         `Remove borrowed item: ${borrowId} (User: ${userIdNum})`,
         itemsFile.sha,
      );

      if (!writeResult.ok) {
         return new Response(`Failed to update items.json: ${writeResult.error}`, {
            status: writeResult.status || 500,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Success response
    ---------------------------- */
      return new Response(
         JSON.stringify({
            ok: true,
            message: "Item removed successfully",
            borrowId: borrowId,
         }),
         {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
         },
      );
   },
};
