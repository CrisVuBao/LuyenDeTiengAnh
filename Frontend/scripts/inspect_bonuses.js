import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectBonuses() {
  const epubPath = path.resolve(__dirname, '../../TiengAnhBi.epub');
  const buf = fs.readFileSync(epubPath);
  const zip = await JSZip.loadAsync(buf);

  const bonusPages = [22, 27, 39, 44, 55, 58, 69, 73, 84, 89];
  for (const p of bonusPages) {
    const f = zip.file(`OEBPS/Text/Page${p}.xhtml`);
    if (f) {
      const html = await f.async('text');
      console.log(`\n================== PAGE ${p} ==================`);
      const clean = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(clean.substring(0, 400));
    }
  }
}

inspectBonuses().catch(console.error);
