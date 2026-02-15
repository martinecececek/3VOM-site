// Cloudflare Worker - PDF Replacement
// - Replaces existing program.pdf file
// - Uploads to GitHub repository
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

      const PDF_PATH = "docs/assets/pdf/program.pdf";

      /* ---------------------------
       GitHub helpers
    ---------------------------- */
      const ghFetch = (url, options = {}) =>
         fetch(url, {
            ...options,
            headers: {
               Authorization: `Bearer ${env.GITHUB_TOKEN}`,
               Accept: "application/vnd.github+json",
               "User-Agent": "cf-worker-pdf-uploader",
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
       Parse form
    ---------------------------- */
      const form = await request.formData();
      const file = form.get("file");

      if (!file || typeof file === "string") {
         return new Response("Missing file", {
            status: 400,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Validate type + size
    ---------------------------- */
      if (file.type !== "application/pdf") {
         return new Response(
            `Unsupported file format: ${file.type || "unknown"}. Only PDF files are allowed.`,
            {
               status: 400,
               headers: corsHeaders,
            },
         );
      }

      // Max 10MB for PDFs
      const MAX_BYTES = 10 * 1024 * 1024;
      if (typeof file.size === "number" && file.size > MAX_BYTES) {
         return new Response(
            `File too large. Max 10MB. Got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
            {
               status: 413,
               headers: corsHeaders,
            },
         );
      }

      /* ---------------------------
       Convert PDF -> base64
    ---------------------------- */
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
         binary += String.fromCharCode(bytes[i]);
      const pdfB64 = btoa(binary);

      /* ---------------------------
       Get existing file SHA (if exists)
    ---------------------------- */
      const existing = await getFile(PDF_PATH);
      if (existing.error) {
         return new Response(`Failed to check existing file: ${existing.error}`, {
            status: existing.status || 500,
            headers: corsHeaders,
         });
      }

      const sha = existing.exists ? existing.sha : undefined;

      /* ---------------------------
       Upload/Replace PDF
    ---------------------------- */
      const uploadRes = await putFile(
         PDF_PATH,
         pdfB64,
         `Update program.pdf - ${new Date().toISOString()}`,
         sha,
      );

      if (!uploadRes.ok) {
         return new Response(`PDF upload failed: ${uploadRes.error}`, {
            status: uploadRes.status || 500,
            headers: corsHeaders,
         });
      }

      // Success response
      const publicUrl = `https://martinecececek.github.io/3VOM-site/${PDF_PATH}`;

      return new Response(
         JSON.stringify({
            ok: true,
            file: "program.pdf",
            path: PDF_PATH,
            publicUrl,
            size: file.size,
            uploaded: new Date().toISOString(),
            action: existing.exists ? "replaced" : "created",
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
   },
};
