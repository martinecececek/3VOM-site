// Cloudflare Worker - Change User Password
// - Reads user.json from GitHub
// - Updates the password for the specified personId
// - Pushes updated user.json back to GitHub
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
       Parse body
    ---------------------------- */
      let body;
      try {
         body = await request.json();
      } catch {
         return new Response("Invalid JSON body", {
            status: 400,
            headers: corsHeaders,
         });
      }

      const { personId, newPassword } = body;

      if (typeof personId !== "number" || !Number.isInteger(personId)) {
         return new Response("personId must be an integer", {
            status: 400,
            headers: corsHeaders,
         });
      }
      if (!newPassword || typeof newPassword !== "string" || !newPassword.trim()) {
         return new Response("newPassword must be a non-empty string", {
            status: 400,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Repo config
    ---------------------------- */
      const OWNER = "martinecececek";
      const REPO = "3VOM-site";
      const BRANCH = "main";
      const USER_JSON_PATH = "src/data/user.json";

      /* ---------------------------
       GitHub helpers
    ---------------------------- */
      const ghFetch = (url, options = {}) =>
         fetch(url, {
            ...options,
            headers: {
               Authorization: `Bearer ${env.GITHUB_TOKEN}`,
               Accept: "application/vnd.github+json",
               "User-Agent": "cf-worker-change-password",
               ...(options.headers || {}),
            },
         });

      const contentsUrl = (path) =>
         `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

      /* ---------------------------
       Read user.json
    ---------------------------- */
      const fileRes = await ghFetch(
         `${contentsUrl(USER_JSON_PATH)}?ref=${encodeURIComponent(BRANCH)}`,
      );

      if (!fileRes.ok) {
         const text = await fileRes.text();
         return new Response(`Failed to read user.json: ${text}`, {
            status: fileRes.status,
            headers: corsHeaders,
         });
      }

      const fileData = await fileRes.json();
      const sha = fileData.sha;
      const content = atob((fileData.content || "").replace(/\n/g, ""));

      let usersData;
      try {
         usersData = JSON.parse(content);
      } catch {
         return new Response("user.json is not valid JSON", {
            status: 500,
            headers: corsHeaders,
         });
      }

      if (!usersData || !Array.isArray(usersData.users)) {
         return new Response("user.json has invalid format", {
            status: 500,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Find and update user
    ---------------------------- */
      const user = usersData.users.find((u) => u.personId === personId);
      if (!user) {
         return new Response(`User with personId ${personId} not found`, {
            status: 404,
            headers: corsHeaders,
         });
      }

      user.password = newPassword.trim();

      /* ---------------------------
       Write updated user.json
    ---------------------------- */
      const updatedJson = JSON.stringify(usersData, null, 3) + "\n";
      const updatedB64 = btoa(unescape(encodeURIComponent(updatedJson)));

      const writeRes = await ghFetch(contentsUrl(USER_JSON_PATH), {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            message: `Change password for user ${user.username} (ID: ${personId})`,
            content: updatedB64,
            branch: BRANCH,
            sha,
         }),
      });

      if (!writeRes.ok) {
         const text = await writeRes.text();
         return new Response(`Failed to update user.json: ${text}`, {
            status: writeRes.status,
            headers: corsHeaders,
         });
      }

      return new Response(
         JSON.stringify({
            ok: true,
            personId,
            username: user.username,
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
   },
};
