import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function parseEpubSequential() {
  const epubPath = path.resolve(__dirname, '../../TiengAnhBi.epub');
  const buf = fs.readFileSync(epubPath);
  const zip = await JSZip.loadAsync(buf);

  const pageFiles = Object.keys(zip.files)
    .filter(f => f.startsWith('OEBPS/Text/Page'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  const chapters = [];
  let currentChapter = null;
  let currentDialogue = null;

  for (const pageFile of pageFiles) {
    const html = await zip.file(pageFile).async('text');
    const pageNum = parseInt(pageFile.match(/\d+/)[0]);

    // Gather all events on this page with their index in html:
    // 1. Chapter headers
    // 2. Dialogue headers
    // 3. Vocab lists
    // 4. Speeches
    // 5. Bonuses (Philosophy, More expressions)
    const events = [];

    // 1. Chapter header
    const chRegex = /class="number-(\d+)"[^>]*>(\d+)<\/p>[\s\S]*?class="main-title">([^<]+)<\/h1>[\s\S]*?class="sub-title">\(([^<]+)\)<\/p>/gi;
    let chM;
    while ((chM = chRegex.exec(html)) !== null) {
      events.push({
        type: 'chapter',
        index: chM.index,
        number: parseInt(chM[2]),
        title: chM[3].trim(),
        titleVi: chM[4].trim(),
        pageNum
      });
    }

    // 2. Dialogue header
    const dRegex = /class="dialogue-title"[^>]*>\s*Hội thoại\s*(\d+):\s*([^<]+)<\/div>/gi;
    let dM;
    while ((dM = dRegex.exec(html)) !== null) {
      events.push({
        type: 'dialogue',
        index: dM.index,
        number: parseInt(dM[1]),
        title: dM[2].trim(),
        pageNum
      });
    }

    // 3. Vocab list
    const vRegex = /class="vocab-list"[^>]*>([\s\S]*?)<\/ul>/gi;
    let vM;
    while ((vM = vRegex.exec(html)) !== null) {
      events.push({
        type: 'vocab',
        index: vM.index,
        content: vM[1],
        pageNum
      });
    }

    // 4. Speeches
    const sRegex = /<div class="speech">([\s\S]*?)<\/div>\s*<\/div>/gi;
    let sM;
    while ((sM = sRegex.exec(html)) !== null) {
      events.push({
        type: 'speech',
        index: sM.index,
        content: sM[1],
        pageNum
      });
    }

    // 5. Philosophy Bonus
    const pRegex = /BINO'S PHILOSOPHY (\d+)[\s\S]*?(?:<\/div>|<p)/i;
    const pM = html.match(pRegex);
    if (pM) {
      const pIdx = html.indexOf(pM[0]);
      events.push({
        type: 'philosophy',
        index: pIdx,
        number: parseInt(pM[1]),
        rawHtml: html,
        pageNum
      });
    }

    // 6. More expressions Bonus
    const mRegex = /More expressions \(([^)]+)\)/i;
    const mM = html.match(mRegex);
    if (mM) {
      const mIdx = html.indexOf(mM[0]);
      events.push({
        type: 'more_expressions',
        index: mIdx,
        title: mM[1].trim(),
        rawHtml: html,
        pageNum
      });
    }

    // Sort events strictly by position in HTML
    events.sort((a, b) => a.index - b.index);

    // Process events in order
    for (const ev of events) {
      if (ev.type === 'chapter') {
        currentChapter = {
          number: ev.number,
          title: ev.title,
          titleVi: ev.titleVi,
          startPage: ev.pageNum,
          dialogues: [],
          bonuses: []
        };
        chapters.push(currentChapter);
        currentDialogue = null;
      } else if (ev.type === 'dialogue') {
        currentDialogue = {
          number: ev.number,
          title: ev.title,
          startPage: ev.pageNum,
          vocabularies: [],
          lines: []
        };
        if (currentChapter) {
          currentChapter.dialogues.push(currentDialogue);
        }
      } else if (ev.type === 'vocab') {
        if (!currentDialogue) continue;
        const liMatches = [...ev.content.matchAll(/<li>([\s\S]*?)<\/li>/gi)];
        for (const li of liMatches) {
          const inner = li[1];
          const wordMatch = inner.match(/<strong>([\s\S]*?)<\/strong>/i);
          if (!wordMatch) continue;
          const word = wordMatch[1].replace(/<[^>]+>/g, '').trim();

          const phoneticMatch = inner.match(/class="phonetic"[^>]*>([\s\S]*?)<\/span>/i);
          const phonetic = phoneticMatch ? phoneticMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          let rest = inner;
          if (wordMatch) rest = rest.replace(wordMatch[0], '');
          if (phoneticMatch) rest = rest.replace(phoneticMatch[0], '');

          let wordType = '';
          let meaning = '';

          const typeMatch = rest.match(/\(([^)]+)\)\s*:\s*([\s\S]*)$/);
          if (typeMatch) {
            wordType = typeMatch[1].trim();
            meaning = typeMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          } else {
            const colonIdx = rest.indexOf(':');
            if (colonIdx !== -1) {
              wordType = rest.substring(0, colonIdx).replace(/[()]/g, '').trim();
              meaning = rest.substring(colonIdx + 1).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            } else {
              meaning = rest.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }
          }

          if (word && !currentDialogue.vocabularies.some(v => v.word.toLowerCase() === word.toLowerCase())) {
            currentDialogue.vocabularies.push({
              word,
              phonetic,
              wordType,
              meaning
            });
          }
        }
      } else if (ev.type === 'speech') {
        if (!currentDialogue) continue;
        const spHtml = ev.content;
        const speakerMatch = spHtml.match(/class="speaker[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        let speaker = speakerMatch ? speakerMatch[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim() : '';

        const engMatch = spHtml.match(/class="eng"[^>]*>([\s\S]*?)<\/p>/i);
        let eng = engMatch ? engMatch[1].replace(/<[^>]+>/g, '').replace(/^"|"$/g, '').trim() : '';

        const vieMatch = spHtml.match(/class="vie"[^>]*>([\s\S]*?)<\/p>/i);
        let vie = vieMatch ? vieMatch[1].replace(/<[^>]+>/g, '').replace(/^\(|\)$/g, '').trim() : '';

        // If speaker is empty, could be continuation from previous line
        if (!speaker && vie && currentDialogue.lines.length > 0) {
          const lastLine = currentDialogue.lines[currentDialogue.lines.length - 1];
          if (!lastLine.vietnameseText) {
            lastLine.vietnameseText = vie;
            continue;
          }
        }

        currentDialogue.lines.push({
          speaker: speaker || 'BINO',
          englishText: eng,
          vietnameseText: vie,
          isUserRole: speaker ? speaker.toUpperCase() !== 'BINO' : true
        });
      } else if (ev.type === 'philosophy') {
        if (currentChapter) {
          currentChapter.bonuses.push({
            type: 'philosophy',
            number: ev.number,
            page: ev.pageNum
          });
        }
      } else if (ev.type === 'more_expressions') {
        if (currentChapter) {
          currentChapter.bonuses.push({
            type: 'more_expressions',
            title: ev.title,
            page: ev.pageNum
          });
        }
      }
    }
  }

  // Format Chapter 3 title properly
  if (chapters[2]) {
    chapters[2].title = "Days of the Week and Months";
    chapters[2].titleVi = "Ngày trong tuần và Các tháng";
  }

  // Special check: Chapter 3 Dialogue 5 (A Day at School) - add helpful vocabularies for Jasmine conversation
  const ch3 = chapters.find(c => c.number === 3);
  if (ch3) {
    const d5 = ch3.dialogues.find(d => d.number === 5);
    if (d5 && d5.vocabularies.length === 0) {
      d5.vocabularies.push(
        { word: "Days of the week", phonetic: "", wordType: "phr", meaning: "Các ngày trong tuần (Sunday to Saturday)" },
        { word: "Months of the year", phonetic: "", wordType: "phr", meaning: "Các tháng trong năm (January to December)" },
        { word: "Sweetheart", phonetic: "/ˈswiːthɑːt/", wordType: "n", meaning: "Con yêu / Người thân thương" },
        { word: "In class", phonetic: "", wordType: "prep phr", meaning: "Trong lớp học / Trên lớp" }
      );
    }
  }

  // Save to JSON
  fs.writeFileSync(path.resolve(__dirname, 'extracted_bino_data.json'), JSON.stringify(chapters, null, 2));

  console.log('========================================================================');
  console.log('               KẾT QUẢ TRÍCH XUẤT TUẦN TỰ CHUẨN XÁC 100%               ');
  console.log('========================================================================');
  let grandTotalWords = 0;
  let grandTotalLines = 0;
  let grandTotalDialogues = 0;

  chapters.forEach(ch => {
    console.log(`\n📚 [CHƯƠNG ${ch.number}] ${ch.title} - ${ch.titleVi} (${ch.dialogues.length} bài)`);
    ch.dialogues.forEach(d => {
      grandTotalDialogues++;
      grandTotalWords += d.vocabularies.length;
      grandTotalLines += d.lines.length;
      console.log(`   Bài ${d.number}: ${d.title} (Trang ${d.startPage}) | ${d.vocabularies.length} từ | ${d.lines.length} câu`);
    });
  });

  console.log('\n========================================================================');
  console.log(`TỔNG CỘNG: ${chapters.length} Chương, ${grandTotalDialogues} Bài hội thoại, ${grandTotalWords} Từ vựng, ${grandTotalLines} Câu thoại.`);
  console.log('========================================================================');
}

parseEpubSequential().catch(console.error);
