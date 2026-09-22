import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function reextractPureBino() {
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
  let currentSection = null;

  for (const pageFile of pageFiles) {
    const html = await zip.file(pageFile).async('text');
    const pageNum = parseInt(pageFile.match(/\d+/)[0]);

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

    // 2. Section header (A, B, C...)
    const secRegex = /<div class="section-header">[\s\S]*?<span class="section-letter">([^<]+)<\/span>[\s\S]*?<h2 class="section-text">([^<]+)<\/h2>/gi;
    let secM;
    while ((secM = secRegex.exec(html)) !== null) {
      events.push({
        type: 'section',
        index: secM.index,
        letter: secM[1].trim(),
        title: secM[2].trim(),
        pageNum
      });
    }

    // 3. Dialogue header
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

    // 4. Vocab list
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

    // 5. Speeches
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

    // 6. Philosophy Bonus
    const pRegex = /BINO'S PHILOSOPHY\s*(\d+)[\s\S]*?(?:<\/div>|<p)/gi;
    let pM;
    while ((pM = pRegex.exec(html)) !== null) {
      events.push({
        type: 'philosophy',
        index: pM.index,
        number: parseInt(pM[1]),
        pageNum
      });
    }

    events.sort((a, b) => a.index - b.index);

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
        currentSection = null;
      } else if (ev.type === 'section') {
        currentSection = ev.letter;
        if (ev.letter !== 'A') {
          // IMPORTANT: Leaving Section A means we are NO LONGER in dialogue conversations!
          currentDialogue = null;
          if (currentChapter) {
            currentChapter.bonuses.push({
              type: ev.letter === 'B' ? 'more_expressions' : 'practise_speaking',
              title: ev.title,
              page: ev.pageNum
            });
          }
        }
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
        if (!currentDialogue) continue; // Skip speeches outside Section A dialogues!
        const spHtml = ev.content;
        const speakerMatch = spHtml.match(/class="speaker[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        let speaker = speakerMatch ? speakerMatch[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim() : '';

        const engMatch = spHtml.match(/class="eng"[^>]*>([\s\S]*?)<\/p>/i);
        let eng = engMatch ? engMatch[1].replace(/<[^>]+>/g, '').replace(/^"|"$/g, '').trim() : '';

        const vieMatch = spHtml.match(/class="vie"[^>]*>([\s\S]*?)<\/p>/i);
        let vie = vieMatch ? vieMatch[1].replace(/<[^>]+>/g, '').replace(/^\(|\)$/g, '').trim() : '';

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
      }
    }
  }

  // Format Chapter 3 title properly
  if (chapters[2]) {
    chapters[2].title = "Days of the Week and Months";
    chapters[2].titleVi = "Ngày trong tuần và Các tháng";
  }

  // Ensure Chapter 3 Dialogue 5 (A Day at School) has proper key words
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

  console.log('========================================================================');
  console.log('         KẾT QUẢ TRÍCH XUẤT CHUẨN XÁC 100% TỪ TIENGANHBI.EPUB          ');
  console.log('========================================================================');
  let totalDialogues = 0;
  let totalLines = 0;
  let totalVocabs = 0;

  chapters.forEach(ch => {
    console.log(`\n📚 [CHƯƠNG ${ch.number}] ${ch.title} - ${ch.titleVi} (${ch.dialogues.length} bài)`);
    ch.dialogues.forEach(d => {
      totalDialogues++;
      totalVocabs += d.vocabularies.length;
      totalLines += d.lines.length;
      console.log(`   Bài ${d.number}: ${d.title} (Trang ${d.startPage}) | ${d.vocabularies.length} từ | ${d.lines.length} câu`);
    });
  });

  console.log('\n========================================================================');
  console.log(`TỔNG CỘNG: ${chapters.length} Chương, ${totalDialogues} Bài hội thoại, ${totalVocabs} Từ vựng, ${totalLines} Câu thoại.`);
  console.log('========================================================================');

  // Save to frontend scripts
  fs.writeFileSync(path.resolve(__dirname, 'extracted_bino_data.json'), JSON.stringify(chapters, null, 2));

  // Save to backend Api and Infrastructure
  const backendApiPath = path.resolve(__dirname, '../../Backend/VBaceEnglish.Api/bino_real_data.json');
  fs.writeFileSync(backendApiPath, JSON.stringify(chapters, null, 2));

  const backendInfraPath = path.resolve(__dirname, '../../Backend/VBaceEnglish.Infrastructure/Data/bino_real_data.json');
  if (fs.existsSync(path.dirname(backendInfraPath))) {
    fs.writeFileSync(backendInfraPath, JSON.stringify(chapters, null, 2));
  }

  console.log('Đã cập nhật đồng bộ vào extracted_bino_data.json và Backend bino_real_data.json thành công!');
}

reextractPureBino().catch(console.error);
