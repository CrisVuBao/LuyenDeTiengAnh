import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkPositions() {
  const epubPath = path.resolve(__dirname, '../../TiengAnhBi.epub');
  const buf = fs.readFileSync(epubPath);
  const zip = await JSZip.loadAsync(buf);
  const files = Object.keys(zip.files)
    .filter(f => f.startsWith('OEBPS/Text/Page'))
    .sort((a,b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

  for (const f of files) {
    const html = await zip.file(f).async('text');
    const pageNum = parseInt(f.match(/\d+/)[0]);
    const dIdx = html.indexOf('class="dialogue-title"');
    const cutTopIdx = html.indexOf('cut-top');
    const speechIdx = html.indexOf('class="speech"');
    if (cutTopIdx !== -1 && dIdx !== -1 && cutTopIdx < dIdx) {
      console.log(`Page ${pageNum}: has cut-top (index ${cutTopIdx}) BEFORE dialogue-title (index ${dIdx})`);
    } else if (speechIdx !== -1 && dIdx !== -1 && speechIdx < dIdx) {
      console.log(`Page ${pageNum}: has speech (index ${speechIdx}) BEFORE dialogue-title (index ${dIdx})`);
    }
  }
}

checkPositions().catch(console.error);
