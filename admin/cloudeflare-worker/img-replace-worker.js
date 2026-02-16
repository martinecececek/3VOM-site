// Cloudflare Worker (FULL CODE)
// - Uploads image to: images/gallery-12-pics/<filename>
// - Appends entry to: images/gallery.json
// - Keeps only newest 12 entries; deletes oldest images ONLY AFTER:
//   1) new image upload succeeded AND
//   2) gallery.json update succeeded
// - If image upload succeeds but gallery.json update fails, it ROLLS BACK by deleting the new image
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

      const IMAGE_DIR = "docs/assets/image/gallery-12-pics";
      const GALLERY_JSON_PATH = "src/data/gallery.json";
      const MAX_ITEMS = 12;

      /* ---------------------------
       GitHub helpers
    ---------------------------- */
      const ghFetch = (url, options = {}) =>
         fetch(url, {
            ...options,
            headers: {
               Authorization: `Bearer ${env.GITHUB_TOKEN}`,
               Accept: "application/vnd.github+json",
               "User-Agent": "cf-worker-gallery-uploader",
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

      async function deleteFile(path, sha, message) {
         const res = await ghFetch(contentsUrl(path), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               message,
               sha,
               branch: BRANCH,
            }),
         });

         if (res.status === 404) return { ok: true, skipped: true };
         const text = await res.text();
         if (!res.ok) return { ok: false, status: res.status, error: text };
         return { ok: true };
      }

      /* ---------------------------
       Parse form
    ---------------------------- */
      const form = await request.formData();
      const file = form.get("file");
      const caption = (form.get("caption") || "").toString().trim();

      if (!file || typeof file === "string") {
         return new Response("Missing file", {
            status: 400,
            headers: corsHeaders,
         });
      }

      /* ---------------------------
       Validate type + size
       (keeps uploads reliable)
    ---------------------------- */
      const allowedTypes = [
         "image/jpeg",
         "image/png",
         "image/webp",
         "image/gif",
         "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
         return new Response(
            `Unsupported image format: ${file.type || "unknown"}`,
            {
               status: 400,
               headers: corsHeaders,
            },
         );
      }

      // Keep this to avoid random failures for big photos
      const MAX_BYTES = 6 * 1024 * 1024; // 6MB
      if (typeof file.size === "number" && file.size > MAX_BYTES) {
         return new Response(
            `File too large. Max 6MB. Got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
            {
               status: 413,
               headers: corsHeaders,
            },
         );
      }

      /* ---------------------------
       Safe filename
    ---------------------------- */
      const rawName = file.name || `upload-${Date.now()}.jpg`;
      const extMatch = rawName.match(/\.[a-zA-Z0-9]{1,8}$/);
      const ext = (extMatch ? extMatch[0] : ".jpg").toLowerCase();

      const base = rawName
         .replace(ext, "")
         .normalize("NFKD")
         .replace(/[\u0300-\u036f]/g, "")
         .replace(/[^a-zA-Z0-9_-]+/g, "-")
         .replace(/^-+|-+$/g, "");

      const filename = `${base || "upload"}-${Date.now()}${ext}`;

      // Repo-root relative
      const imagePath = `${IMAGE_DIR}/${filename}`;

      /* ---------------------------
       Convert image -> base64
       (no quality loss)
    ---------------------------- */
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
         binary += String.fromCharCode(bytes[i]);
      const imageB64 = btoa(binary);

      /* =========================================================
       SAFEST FLOW
       1) Upload image
       2) Update gallery.json (append + trim)
       3) ONLY THEN delete old images
       If step 2 fails => rollback by deleting the new image
    ========================================================== */

      // 1) Upload image (unique name => no overwrite). Encode ONLY filename.
      const uploadPathForApi = `${IMAGE_DIR}/${encodeURIComponent(filename)}`;
      const uploadRes = await putFile(
         uploadPathForApi,
         imageB64,
         `Upload ${filename}`,
      );

      if (!uploadRes.ok) {
         return new Response(`Image upload failed: ${uploadRes.error}`, {
            status: uploadRes.status || 500,
            headers: corsHeaders,
         });
      }

      // SHA for rollback if needed
      const uploadedImageSha = uploadRes.json?.content?.sha;

      // 2) Read + update gallery.json (retry once to avoid rare conflicts)
      let gallerySha = undefined;
      let galleryArr = [];
      let removedEntries = [];
      let finalEntry = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
         const g = await getFile(GALLERY_JSON_PATH);

         if (g.error) {
            // rollback new image (best-effort)
            if (uploadedImageSha)
               await deleteFile(
                  uploadPathForApi,
                  uploadedImageSha,
                  `Rollback upload ${filename}`,
               );
            return new Response(`gallery.json read failed: ${g.error}`, {
               status: g.status || 500,
               headers: corsHeaders,
            });
         }

         if (!g.exists) {
            gallerySha = undefined;
            galleryArr = [];
         } else {
            gallerySha = g.sha;
            try {
               const parsed = JSON.parse(g.text || "[]");
               if (!Array.isArray(parsed))
                  throw new Error("gallery.json must be an array");
               galleryArr = parsed;
            } catch (e) {
               if (uploadedImageSha)
                  await deleteFile(
                     uploadPathForApi,
                     uploadedImageSha,
                     `Rollback upload ${filename}`,
                  );
               return new Response(`gallery.json invalid JSON array: ${e}`, {
                  status: 500,
                  headers: corsHeaders,
               });
            }
         }

         finalEntry = {
            file: filename,
            caption,
            date: new Date().toISOString(),
         };
         galleryArr.push(finalEntry);

         // Keep newest MAX_ITEMS (oldest are at beginning)
         removedEntries = [];
         while (galleryArr.length > MAX_ITEMS)
            removedEntries.push(galleryArr.shift());

         const updatedText = JSON.stringify(galleryArr, null, 2) + "\n";
         const updatedB64 = btoa(updatedText);

         const write = await putFile(
            GALLERY_JSON_PATH,
            updatedB64,
            `Update gallery.json (+${filename}${removedEntries.length ? `, -${removedEntries.length} old` : ""})`,
            gallerySha,
         );

         if (write.ok) break;

         if (attempt === 2) {
            // rollback new image (keep repo consistent)
            if (uploadedImageSha)
               await deleteFile(
                  uploadPathForApi,
                  uploadedImageSha,
                  `Rollback upload ${filename}`,
               );
            return new Response(`gallery.json write failed: ${write.error}`, {
               status: write.status || 500,
               headers: corsHeaders,
            });
         }
      }

      // 3) Delete old images ONLY AFTER upload + JSON update succeeded
      const deleted = [];
      const deleteFailures = [];

      for (const r of removedEntries) {
         const oldFile = r?.file;
         if (!oldFile) continue;

         const oldPathForApi = `${IMAGE_DIR}/${encodeURIComponent(oldFile)}`;

         // Need SHA to delete
         const oldInfo = await getFile(oldPathForApi);
         if (!oldInfo.exists) continue;

         if (oldInfo.error) {
            deleteFailures.push({ file: oldFile, error: oldInfo.error });
            continue;
         }

         const del = await deleteFile(
            oldPathForApi,
            oldInfo.sha,
            `Delete old image ${oldFile}`,
         );
         if (del.ok) deleted.push(oldFile);
         else deleteFailures.push({ file: oldFile, error: del.error });
      }

      // Success response
      const publicUrl = `https://martinecececek.github.io/3VOM-site/${imagePath}`;

      return new Response(
         JSON.stringify({
            ok: true,
            uploaded: { ...finalEntry, publicUrl },
            removed: removedEntries.map((x) => x.file).filter(Boolean),
            deleted,
            deleteFailures,
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
   },
};
