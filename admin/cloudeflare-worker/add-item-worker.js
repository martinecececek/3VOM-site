// Cloudflare Worker - Add Borrowed Item
// - Reads items.json from GitHub
// - Adds new borrowed item to a person's borrowed_items array
// - Writes updated items.json back to GitHub
//
// Required Worker variables:
// - GITHUB_TOKEN (Secret): fine-grained PAT with Repository permissions -> Contents: Read & write for martinecececek/3VOM-site
// - ADMIN_KEY (Secret preferred): your admin password checked via header x-admin-key

export default {
   async fetch(request, env) {
      /* ---------------------------
       CORS (restricted to allowed origins)
    ---------------------------- */
      const ALLOWED_ORIGINS = [
         "https://martinecececek.github.io",
         "http://127.0.0.1:5500",
         "http://localhost:5500",
      ];
      const origin = request.headers.get("Origin");
      const corsHeaders = {
         "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
         "Access-Control-Allow-Methods": "POST, OPTIONS",
         "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      };

      if (request.method === "OPTIONS")
         return new Response(null, { headers: corsHeaders });
      if (request.method !== "POST")
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

      const { userId, item } = payload;

      if (!userId || !item) {
         return new Response("Missing userId or item", {
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

      if (!item.category || !item.description) {
         return new Response("Missing required fields: category, description", {
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
       Add item to person's borrowed_items
    ---------------------------- */
      if (!Array.isArray(itemsData.people)) {
         itemsData.people = [];
      }

      const person = itemsData.people.find((p) => p.id === userIdNum);
      if (!person) {
         return new Response(`User not found: ${userIdNum}`, {
            status: 404,
            headers: corsHeaders,
         });
      }

      if (!Array.isArray(person.borrowed_items)) {
         person.borrowed_items = [];
      }

      // Generate unique ID for the borrowed item
      const borrowId = `borrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newItem = {
         id: borrowId,
         category: item.category,
         description: item.description,
         itemNumber: item.itemNumber || "",
         date: item.date || new Date().toISOString().split('T')[0],
      };

      person.borrowed_items.push(newItem);

      /* ---------------------------
       Write updated items.json back to GitHub
    ---------------------------- */
      const updatedText = JSON.stringify(itemsData, null, 2) + "\n";
      const updatedB64 = btoa(updatedText);

      const writeResult = await putFile(
         ITEMS_JSON_PATH,
         updatedB64,
         `Add borrowed item: ${item.category} - ${item.description} (User: ${userIdNum})`,
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
            message: "Item added successfully",
            borrowId: borrowId,
            item: newItem,
         }),
         {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
         },
      );
   },
};
