import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyze() {
  const epubPath = path.resolve(__dirname, '../../TiengAnhBi.epub');
  const buf = fs.readFileSync(epubPath);
  const zip = await JSZip.loadAsync(buf);

  const pages = Object.keys(zip.files)
    .filter(f => f.startsWith('OEBPS/Text/Page'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  const summary = [];

  for (const p of pages) {
    const raw = await zip.file(p).async('text');
    const clean = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    summary.push({
      file: p,
      len: clean.length,
      preview: clean.substring(0, 300),
      raw: raw
    });
  }

  // Write summary to a JSON file for deep inspection
  fs.writeFileSync(path.resolve(__dirname, 'epub_analysis.json'), JSON.stringify(summary, null, 2));

  console.log(`Analyzed ${pages.length} pages.`);
  pages.forEach((p, i) => {
    console.log(`[${p}] -> ${summary[i].preview.substring(0, 100)}...`);
  });
}

analyze().catch(console.error);
