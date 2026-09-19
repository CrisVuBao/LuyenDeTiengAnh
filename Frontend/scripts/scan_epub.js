import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scan() {
  const epubPath = path.resolve(__dirname, '../../TiengAnhBi.epub');
  const buf = fs.readFileSync(epubPath);
  const zip = await JSZip.loadAsync(buf);
  const files = Object.keys(zip.files)
    .filter(f => f.startsWith('OEBPS/Text/Page'))
    .sort((a,b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

  console.log(`Found ${files.length} pages total: ${files[0]} to ${files[files.length-1]}`);

  for (const f of files) {
    const html = await zip.file(f).async('text');
    const pageNum = parseInt(f.match(/\d+/)[0]);

    // Check chapter
    const chMatch = html.match(/class="number-(\d+)"[^>]*>(\d+)<\/p>[\s\S]*?class="main-title">([^<]+)<\/h1>[\s\S]*?class="sub-title">\(([^<]+)\)<\/p>/i);
    if (chMatch) {
      console.log(`\n======================================================`);
      console.log(`PAGE ${pageNum}: CHAPTER ${chMatch[2]} - ${chMatch[3].trim()} (${chMatch[4].trim()})`);
      console.log(`======================================================`);
    }

    // Check alternative chapter pattern
    const altChMatch = html.match(/CHƯƠNG\s*(\d+)[\s\S]*?class="main-title">([^<]+)<\/h1>/i);
    if (altChMatch && !chMatch) {
      console.log(`\n>>> PAGE ${pageNum}: ALT CHAPTER ${altChMatch[1]} - ${altChMatch[2].trim()}`);
    }

    // Check dialogue
    const dMatches = [...html.matchAll(/class="dialogue-title"[^>]*>\s*Hội thoại\s*(\d+):\s*([^<]+)<\/div>/gi)];
    for (const d of dMatches) {
      console.log(`  Page ${pageNum}: Hội thoại ${d[1]}: ${d[2].trim()}`);
    }

    // Check vocab
    const vMatches = [...html.matchAll(/class="vocab-list"[^>]*>([\s\S]*?)<\/ul>/gi)];
    if (vMatches.length > 0) {
      let count = 0;
      for (const vm of vMatches) {
        count += [...vm[1].matchAll(/<li>/gi)].length;
      }
      console.log(`     [Vocab] Page ${pageNum}: ${count} từ vựng`);
    }

    // Check speech
    const sMatches = [...html.matchAll(/<div class="speech">([\s\S]*?)<\/div>\s*<\/div>/gi)];
    if (sMatches.length > 0) {
      console.log(`     [Speech] Page ${pageNum}: ${sMatches.length} câu thoại`);
    }

    // Check Philosophy / Bonus
    if (html.includes("PHILOSOPHY") || html.includes("Philosophy")) {
      const p = html.match(/PHILOSOPHY[^\n<]+/i);
      console.log(`  Page ${pageNum}: [BONUS] ${p ? p[0] : 'Philosophy'}`);
    }
    if (html.includes("More expressions")) {
      const m = html.match(/More expressions[^\n<)]+\)/i);
      console.log(`  Page ${pageNum}: [BONUS] ${m ? m[0] : 'More expressions'}`);
    }
  }
}

scan().catch(console.error);
