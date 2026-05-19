// Run: npm install sharp   then   node compress-images.js
// Converts all images to WebP, deletes originals, updates all references.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const IMAGE_DIR = path.join(ROOT, 'assets', 'image');
const MAX_SIZE = 1500;

function getImages(dir) {
   const results = [];
   for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...getImages(full));
      else if (/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/.test(entry.name)) results.push(full);
   }
   return results;
}

function getRefFiles(dir) {
   if (!fs.existsSync(dir)) return [];
   const results = [];
   for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'admin', 'pdf'].includes(entry.name)) {
         results.push(...getRefFiles(full));
      } else if (/\.(html|js|json)$/.test(entry.name)) {
         results.push(full);
      }
   }
   return results;
}

async function main() {
   const images = getImages(IMAGE_DIR);
   console.log(`Found ${images.length} images\n`);

   const renames = [];

   for (const imgPath of images) {
      const ext = path.extname(imgPath);
      const webpPath = imgPath.slice(0, -ext.length) + '.webp';
      const oldName = path.basename(imgPath);
      const newName = path.basename(webpPath);

      const sizeBefore = Math.round(fs.statSync(imgPath).size / 1024);

      try {
         await sharp(imgPath)
            .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(webpPath);

         fs.unlinkSync(imgPath);

         const sizeAfter = Math.round(fs.statSync(webpPath).size / 1024);
         const savedMB = (((sizeBefore - sizeAfter) / 1024)).toFixed(1);
         console.log(`OK   ${oldName.padEnd(45)} ${String(sizeBefore).padStart(6)}KB -> ${String(sizeAfter).padStart(5)}KB  (saved ${savedMB}MB)`);

         if (oldName !== newName) renames.push({ oldName, newName });
      } catch (err) {
         console.error(`FAIL ${oldName}: ${err.message}`);
      }
   }

   if (renames.length === 0) {
      console.log('\nNo renames needed.');
      return;
   }

   console.log(`\nUpdating references in ${renames.length} files...\n`);
   const refFiles = getRefFiles(ROOT);

   for (const refFile of refFiles) {
      let content = fs.readFileSync(refFile, 'utf8');
      let changed = false;

      for (const { oldName, newName } of renames) {
         if (content.includes(oldName)) {
            content = content.split(oldName).join(newName);
            changed = true;
         }
      }

      if (changed) {
         fs.writeFileSync(refFile, content, 'utf8');
         console.log(`  Updated: ${path.relative(ROOT, refFile)}`);
      }
   }

   console.log('\nDone. Verify the site looks correct before committing.');
}

main().catch(console.error);
