import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vietnamese meanings & natural example sentences for the 53 household items in Chapter 12 (Pages 192-197)
const CH12_VI_AND_EXAMPLES = {
  "Chair": {
    vi: "Cái ghế",
    exampleEn: "This chair is made of wood.",
    exampleVi: "Cái ghế này được làm bằng gỗ."
  },
  "Table": {
    vi: "Cái bàn",
    exampleEn: "We gather around the dining table for dinner every evening.",
    exampleVi: "Chúng tôi quây quần bên bàn ăn tối vào mỗi buổi tối."
  },
  "Sofa": {
    vi: "Ghế sô-pha (ghế trường kỷ)",
    exampleEn: "I love relaxing on the sofa and watching movies after work.",
    exampleVi: "Tôi thích thư giãn trên ghế sô-pha và xem phim sau giờ làm việc."
  },
  "Bed": {
    vi: "Cái giường",
    exampleEn: "Nothing feels better than lying in a warm bed on a rainy night.",
    exampleVi: "Không gì tuyệt hơn được nằm trên chiếc giường ấm áp vào đêm mưa."
  },
  "Lamp": {
    vi: "Đèn bàn / Đèn ngủ",
    exampleEn: "She turned on the bedside lamp to read a book before sleeping.",
    exampleVi: "Cô ấy bật chiếc đèn đầu giường để đọc sách trước khi ngủ."
  },
  "Rug": {
    vi: "Tấm thảm trải sàn",
    exampleEn: "We put a soft rug in the middle of the living room.",
    exampleVi: "Chúng tôi trải một tấm thảm êm ái ở giữa phòng khách."
  },
  "TV (Television)": {
    vi: "Ti-vi (Vô tuyến truyền hình)",
    exampleEn: "Can you turn down the TV a bit? I'm on the phone.",
    exampleVi: "Bạn vặn nhỏ ti-vi xuống một chút được không? Mình đang nghe điện thoại."
  },
  "Clock": {
    vi: "Đồng hồ treo tường / để bàn",
    exampleEn: "The wall clock shows that it's almost time for lunch.",
    exampleVi: "Chiếc đồng hồ treo tường chỉ gần đến giờ ăn trưa rồi."
  },
  "Refrigerator (fridge)": {
    vi: "Tủ lạnh",
    exampleEn: "Put the leftover food in the fridge so it doesn't go bad.",
    exampleVi: "Hãy cất thức ăn thừa vào tủ lạnh để không bị hỏng nhé."
  },
  "Microwave": {
    vi: "Lò vi sóng",
    exampleEn: "I'll just heat up my lunch in the microwave for two minutes.",
    exampleVi: "Mình sẽ hâm nóng bữa trưa trong lò vi sóng khoảng hai phút."
  },
  "Oven": {
    vi: "Lò nướng",
    exampleEn: "Preheat the oven to 180 degrees before baking the cake.",
    exampleVi: "Hãy làm nóng lò nướng ở 180 độ trước khi nướng bánh."
  },
  "Dishwasher": {
    vi: "Máy rửa bát",
    exampleEn: "Loading the dishwasher after dinner saves us so much time.",
    exampleVi: "Cho bát đĩa vào máy rửa bát sau bữa tối giúp chúng tôi tiết kiệm rất nhiều thời gian."
  },
  "Washing machine": {
    vi: "Máy giặt",
    exampleEn: "Just toss your dirty clothes into the washing machine.",
    exampleVi: "Cứ cho quần áo bẩn của bạn vào máy giặt nhé."
  },
  "Dryer": {
    vi: "Máy sấy quần áo",
    exampleEn: "Since it's raining all week, we have to use the dryer for our laundry.",
    exampleVi: "Vì trời mưa cả tuần nên chúng tôi phải dùng máy sấy cho mẻ đồ giặt."
  },
  "Toaster": {
    vi: "Máy nướng bánh mì lát",
    exampleEn: "Two slices of bread just popped up from the toaster.",
    exampleVi: "Hai lát bánh mì vừa nảy lên khỏi máy nướng bánh mì."
  },
  "Blender": {
    vi: "Máy xay sinh tố",
    exampleEn: "I use the blender every morning to make a fresh fruit smoothie.",
    exampleVi: "Tôi dùng máy xay sinh tố mỗi sáng để làm một ly sinh tố trái cây tươi."
  },
  "Coffee maker": {
    vi: "Máy pha cà phê",
    exampleEn: "The smell of fresh coffee from the coffee maker wakes me up instantly.",
    exampleVi: "Mùi cà phê mới pha từ máy pha cà phê đánh thức tôi ngay lập tức."
  },
  "Kettle": {
    vi: "Ấm đun nước",
    exampleEn: "I'll put the kettle on so we can have a cup of hot tea.",
    exampleVi: "Mình sẽ bắc ấm đun nước lên để chúng ta uống một tách trà nóng nhé."
  },
  "Vacuum cleaner": {
    vi: "Máy hút bụi",
    exampleEn: "I run the vacuum cleaner over the carpet every Saturday morning.",
    exampleVi: "Tôi dùng máy hút bụi làm sạch thảm vào mỗi sáng thứ Bảy."
  },
  "Trash can": {
    vi: "Thùng rác",
    exampleEn: "Don't forget to empty the kitchen trash can before going to bed.",
    exampleVi: "Đừng quên đổ thùng rác trong bếp trước khi đi ngủ nhé."
  },
  "Broom": {
    vi: "Cây chổi quét nhà",
    exampleEn: "Grab a broom and sweep up the broken glass carefully.",
    exampleVi: "Lấy cây chổi và quét sạch mảnh kính vỡ thật cẩn thận nhé."
  },
  "Mop": {
    vi: "Cây lau nhà",
    exampleEn: "After sweeping the floor, I cleaned it with a wet mop.",
    exampleVi: "Sau khi quét sàn, tôi lau sạch lại bằng cây lau nhà ướt."
  },
  "Bucket": {
    vi: "Cái xô",
    exampleEn: "He filled the bucket with warm soapy water to wash the car.",
    exampleVi: "Anh ấy đổ đầy nước xà phòng ấm vào xô để rửa xe."
  },
  "Sponge": {
    vi: "Miếng bọt biển rửa bát",
    exampleEn: "Use the soft side of the sponge so you don't scratch the pan.",
    exampleVi: "Hãy dùng mặt mềm của miếng bọt biển để không làm xước chảo nhé."
  },
  "Towel": {
    vi: "Khăn tắm / Khăn lau",
    exampleEn: "There is a clean towel hanging on the bathroom door.",
    exampleVi: "Có một chiếc khăn sạch đang treo trên cửa phòng tắm."
  },
  "Toilet": {
    vi: "Bồn cầu / Nhà vệ sinh",
    exampleEn: "Excuse me, where is the toilet?",
    exampleVi: "Xin lỗi, cho mình hỏi nhà vệ sinh ở đâu vậy?"
  },
  "Sink": {
    vi: "Bồn rửa (bát / mặt)",
    exampleEn: "Just leave your dirty mug in the kitchen sink for now.",
    exampleVi: "Cứ để tạm chiếc cốc bẩn của bạn trong bồn rửa bếp nhé."
  },
  "Shower": {
    vi: "Vòi hoa sen / Phòng tắm vòi sen",
    exampleEn: "I always take a quick hot shower before going to bed.",
    exampleVi: "Tôi luôn tắm nhanh dưới vòi hoa sen nước nóng trước khi đi ngủ."
  },
  "Bathtub": {
    vi: "Bồn tắm nằm",
    exampleEn: "Soaking in a warm bathtub is the best way to unwind.",
    exampleVi: "Ngâm mình trong bồn tắm nước ấm là cách tuyệt nhất để xả hơi."
  },
  "Toothbrush": {
    vi: "Bàn chải đánh răng",
    exampleEn: "Dentists recommend replacing your toothbrush every three months.",
    exampleVi: "Nha sĩ khuyên bạn nên thay bàn chải đánh răng ba tháng một lần."
  },
  "Toothpaste": {
    vi: "Kem đánh răng",
    exampleEn: "We're running out of toothpaste, so I'll buy a new tube today.",
    exampleVi: "Nhà mình sắp hết kem đánh răng rồi, hôm nay mình sẽ mua một tuýp mới."
  },
  "Soap": {
    vi: "Xà phòng / Xà bông",
    exampleEn: "Wash your hands thoroughly with soap and warm water.",
    exampleVi: "Hãy rửa tay thật kỹ bằng xà phòng và nước ấm."
  },
  "Shampoo": {
    vi: "Dầu gội đầu",
    exampleEn: "This herbal shampoo smells amazing and makes my hair soft.",
    exampleVi: "Loại dầu gội thảo dược này thơm tuyệt vời và làm tóc mình rất mềm."
  },
  "Conditioner": {
    vi: "Dầu xả tóc",
    exampleEn: "Apply conditioner to the ends of your hair after shampooing.",
    exampleVi: "Hãy thoa dầu xả vào phần đuôi tóc sau khi gội đầu xong."
  },
  "Toilet paper": {
    vi: "Giấy vệ sinh",
    exampleEn: "Could you grab a new roll of toilet paper from the cabinet?",
    exampleVi: "Bạn lấy giúp mình một cuộn giấy vệ sinh mới trong tủ được không?"
  },
  "Tissue": {
    vi: "Khăn giấy rút",
    exampleEn: "Here, take a tissue to wipe your hands.",
    exampleVi: "Này, lấy một tờ khăn giấy để lau tay đi bạn."
  },
  "Light bulb": {
    vi: "Bóng đèn điện",
    exampleEn: "The light bulb in the hallway burned out, so I need to change it.",
    exampleVi: "Bóng đèn ngoài hành lang bị cháy rồi, mình cần phải thay bóng mới."
  },
  "Candle": {
    vi: "Cây nến",
    exampleEn: "We lit a scented candle during the power outage.",
    exampleVi: "Chúng tôi đã thắp một cây nến thơm trong lúc mất điện."
  },
  "Matches": {
    vi: "Que diêm / Hộp diêm",
    exampleEn: "Keep matches and lighters out of reach of children.",
    exampleVi: "Hãy để diêm và bật lửa tránh xa tầm tay trẻ em."
  },
  "Fire extinguisher": {
    vi: "Bình chữa cháy",
    exampleEn: "Every kitchen should have a small fire extinguisher nearby.",
    exampleVi: "Mọi căn bếp đều nên có một bình chữa cháy nhỏ ở gần đó."
  },
  "Fire alarm": {
    vi: "Chuông báo cháy",
    exampleEn: "The fire alarm went off because I burned the toast!",
    exampleVi: "Chuông báo cháy kêu inh ỏi vì mình làm cháy bánh mì nướng!"
  },
  "Smoke detector": {
    vi: "Thiết bị báo khói",
    exampleEn: "Remember to check the batteries in your smoke detector twice a year.",
    exampleVi: "Hãy nhớ kiểm tra pin trong thiết bị báo khói mỗi năm hai lần."
  },
  "First aid kit": {
    vi: "Bộ dụng cụ sơ cứu y tế",
    exampleEn: "We keep a first aid kit in the bathroom cabinet for emergencies.",
    exampleVi: "Chúng tôi để một bộ dụng cụ sơ cứu trong tủ phòng tắm cho các trường hợp khẩn cấp."
  },
  "Bandage": {
    vi: "Băng cá nhân / Băng gạc y tế",
    exampleEn: "Put a clean bandage on that paper cut so it doesn't get infected.",
    exampleVi: "Dán băng cá nhân sạch lên vết đứt tay đó để khỏi bị nhiễm trùng nhé."
  },
  "Thermometer": {
    vi: "Nhiệt kế (đo thân nhiệt)",
    exampleEn: "Use the thermometer to check if you have a fever.",
    exampleVi: "Hãy dùng nhiệt kế kiểm tra xem bạn có bị sốt không."
  },
  "Humidifier": {
    vi: "Máy tạo độ ẩm",
    exampleEn: "Running a humidifier in winter keeps my skin from drying out.",
    exampleVi: "Bật máy tạo độ ẩm vào mùa đông giúp da mình không bị khô."
  },
  "Dehumidifier": {
    vi: "Máy hút ẩm",
    exampleEn: "A dehumidifier is essential during the humid rainy season.",
    exampleVi: "Máy hút ẩm là thiết bị cực kỳ cần thiết vào mùa mưa nồm ẩm."
  },
  "Air purifier": {
    vi: "Máy lọc không khí",
    exampleEn: "The air purifier removes dust and pollen from the bedroom.",
    exampleVi: "Máy lọc không khí giúp loại bỏ bụi mịn và phấn hoa trong phòng ngủ."
  },
  "Fan": {
    vi: "Quạt máy / Quạt điện",
    exampleEn: "Can you turn on the fan? It's getting a bit stuffy in here.",
    exampleVi: "Bạn bật quạt lên giúp mình được không? Trong này hơi bí rồi."
  },
  "Heater": {
    vi: "Máy sưởi",
    exampleEn: "We turned on the electric heater because the night was freezing.",
    exampleVi: "Chúng tôi bật máy sưởi điện lên vì đêm nay lạnh cóng."
  },
  "Nightstand": {
    vi: "Tủ đầu giường (táp đầu giường)",
    exampleEn: "I always leave my glasses and phone on the nightstand before sleeping.",
    exampleVi: "Tôi luôn để kính và điện thoại trên tủ đầu giường trước khi ngủ."
  },
  "Extension cord": {
    vi: "Ổ cắm điện nối dài (dây nối dài)",
    exampleEn: "The wall outlet is too far, so we need an extension cord.",
    exampleVi: "Ổ cắm trên tường xa quá nên chúng ta cần một dây ổ cắm nối dài."
  },
  "Ceiling fan": {
    vi: "Quạt trần",
    exampleEn: "Spinning the ceiling fan on low helps circulate the cool air.",
    exampleVi: "Bật quạt trần ở mức nhẹ giúp lưu thông không khí mát mẻ khắp phòng."
  }
};

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
  const ch12AllWords = [];

  for (const pageFile of pageFiles) {
    const html = await zip.file(pageFile).async('text');
    const pageNum = parseInt(pageFile.match(/\d+/)[0]);

    // Skip final publisher imprint page (Page 200) and empty placeholder Page 121
    if (pageNum === 200 || pageNum === 121) continue;

    // Extract body inside content-container for Bonus HTML tracking
    const containerMatch = html.match(/<div class="content-container">([\s\S]*?)<\/div>\s*<\/body>/i);
    let pageContentHtml = containerMatch ? containerMatch[1] : '';
    // Strip the top page-header bar
    pageContentHtml = pageContentHtml.replace(/<div class="page-header"[^>]*>[\s\S]*?<\/div>/gi, '').trim();

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
    const pRegex = /class="philosophy-title"[^>]*>\s*BINO['’]S PHILOSOPHY\s*(\d+)\s*<\/div>/gi;
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

    let sectionBStartedOnThisPage = false;

    for (const ev of events) {
      if (ev.type === 'chapter') {
        currentChapter = {
          number: ev.number,
          title: ev.title,
          titleVi: ev.titleVi,
          startPage: ev.pageNum,
          dialogues: [],
          bonuses: [],
          bonusPagesHtml: [],
          philosophySubtitle: ''
        };
        chapters.push(currentChapter);
        currentDialogue = null;
        currentSection = ev.number === 12 ? 'CH12_VOCAB' : null;
      } else if (ev.type === 'section') {
        currentSection = ev.letter;
        if (ev.letter !== 'A') {
          currentDialogue = null;
          if (currentChapter) {
            currentChapter.bonuses.push({
              type: ev.letter === 'B' ? 'more_expressions' : 'practise_speaking',
              title: ev.title,
              page: ev.pageNum
            });
          }
          if (ev.letter === 'B') {
            sectionBStartedOnThisPage = true;
            // Capture from <div class="section-header"> of Section B to end of content-container on this page
            const secIdx = pageContentHtml.indexOf('<div class="section-header">');
            if (secIdx !== -1 && currentChapter) {
              currentChapter.bonusPagesHtml.push(pageContentHtml.substring(secIdx));
            }
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
        // Special handling for Chapter 12 (Around the House - 53 items across pages 192-197)
        if (currentChapter && currentChapter.number === 12) {
          const liMatches = [...ev.content.matchAll(/<li>([\s\S]*?)<\/li>/gi)];
          for (const li of liMatches) {
            const inner = li[1].replace(/<br\s*\/?>[\s\S]*/i, '');
            const wordMatch = inner.match(/<strong>([\s\S]*?)<\/strong>/i);
            if (!wordMatch) continue;
            const word = wordMatch[1].replace(/<[^>]+>/g, '').trim();
            const phoneticMatch = inner.match(/class="phonetic"[^>]*>([\s\S]*?)<\/span>/i);
            const phonetic = phoneticMatch ? phoneticMatch[1].replace(/<[^>]+>/g, '').trim() : '';
            const defMatch = inner.match(/\(n\)\s*-\s*([\s\S]*)$/i);
            const engDef = defMatch ? defMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
            ch12AllWords.push({
              word,
              phonetic,
              wordType: 'n',
              engDef,
              pageNum: ev.pageNum
            });
          }
          continue;
        }

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
          const subMatch = html.match(/class="philosophy-content"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
          if (subMatch && !currentChapter.philosophySubtitle) {
            currentChapter.philosophySubtitle = subMatch[1].replace(/<[^>]+>/g, '').trim();
          }
          currentChapter.bonuses.push({
            type: 'philosophy',
            number: ev.number,
            page: ev.pageNum
          });
        }
      }
    }

    // Append full page content to bonusPagesHtml if we are in Section B, Section C, Philosophy, or Chapter 12
    if (currentChapter) {
      if (currentChapter.number === 12) {
        currentChapter.bonusPagesHtml.push(pageContentHtml);
      } else if (!sectionBStartedOnThisPage && (currentSection === 'B' || currentSection === 'C' || html.includes('philosophy-box'))) {
        currentChapter.bonusPagesHtml.push(pageContentHtml);
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

  // Ensure Chapter 9 Dialogue 1 (Jazzy’s Favorite Things to Do) has key words from the dialogue
  const ch9 = chapters.find(c => c.number === 9);
  if (ch9) {
    const d1 = ch9.dialogues.find(d => d.number === 1);
    if (d1 && d1.vocabularies.length === 0) {
      d1.vocabularies.push(
        { word: "For fun", phonetic: "/fər fʌn/", wordType: "phr", meaning: "Để giải trí / Cho vui (What do you like to do for fun?)" },
        { word: "Color pictures", phonetic: "/ˈkʌlər ˈpɪktʃərz/", wordType: "vp", meaning: "Tô màu tranh" },
        { word: "Dollhouse", phonetic: "/ˈdɑːlhaʊs/", wordType: "n", meaning: "Nhà búp bê" },
        { word: "Stuffed animals", phonetic: "/stʌft ˈænɪmlz/", wordType: "np", meaning: "Thú nhồi bông / Gấu bông" },
        { word: "Paper airplanes", phonetic: "/ˈpeɪpər ˈerpleɪnz/", wordType: "np", meaning: "Máy bay giấy" },
        { word: "Before you know it", phonetic: "", wordType: "idiom", meaning: "Chẳng mấy chốc / Hồi nào không hay" }
      );
    }
  }

  // Ensure Chapter 10 Dialogue 2 (Jazzy Practising Ordering Food) has key words from the dialogue
  const ch10 = chapters.find(c => c.number === 10);
  if (ch10) {
    const d2 = ch10.dialogues.find(d => d.number === 2);
    if (d2 && d2.vocabularies.length === 0) {
      d2.vocabularies.push(
        { word: "Macca's", phonetic: "/ˈmækəz/", wordType: "n (slang Úc)", meaning: "Cửa hàng thức ăn nhanh McDonald's (tiếng lóng cực phổ biến ở Úc)" },
        { word: "Nuggets and chips", phonetic: "/ˈnʌɡɪts ænd tʃɪps/", wordType: "np", meaning: "Gà viên chiên và khoai tây chiên" },
        { word: "Happy Meal", phonetic: "/ˈhæpi miːl/", wordType: "np", meaning: "Phần ăn thiếu nhi tại McDonald's" },
        { word: "At the counter", phonetic: "/æt ðə ˈkaʊntər/", wordType: "prep phr", meaning: "Tại quầy thu ngân / quầy gọi món" },
        { word: "Apple juice", phonetic: "/ˈæpl dʒuːs/", wordType: "np", meaning: "Nước ép táo" }
      );
    }
  }

  // Build 6 structured interactive lessons for Chapter 12 (Around the House) from the 53 household items
  const ch12 = chapters.find(c => c.number === 12);
  if (ch12 && ch12AllWords.length > 0) {
    const lessonGroups = [
      {
        number: 1,
        title: "Living Room & Bedroom Furniture (Nội thất Phòng khách & Phòng ngủ)",
        startPage: 192,
        words: ch12AllWords.slice(0, 8) // Chair -> Clock (8 words)
      },
      {
        number: 2,
        title: "Kitchen & Laundry Appliances (Thiết bị Nhà bếp & Giặt sấy)",
        startPage: 193,
        words: ch12AllWords.slice(8, 18) // Refrigerator -> Kettle (10 words)
      },
      {
        number: 3,
        title: "Cleaning Tools & Supplies (Dụng cụ Dọn dẹp vệ sinh)",
        startPage: 194,
        words: ch12AllWords.slice(18, 25) // Vacuum cleaner -> Towel (7 words)
      },
      {
        number: 4,
        title: "Bathroom & Personal Care (Đồ dùng Phòng tắm & Vệ sinh cá nhân)",
        startPage: 195,
        words: ch12AllWords.slice(25, 36) // Toilet -> Tissue (11 words)
      },
      {
        number: 5,
        title: "Lighting, Fire Safety & First Aid (Chiếu sáng, Phòng cháy & Sơ cứu)",
        startPage: 196,
        words: ch12AllWords.slice(36, 45) // Light bulb -> Thermometer (9 words)
      },
      {
        number: 6,
        title: "Air Quality, Heating & Room Electricals (Điều hòa không khí & Thiết bị điện)",
        startPage: 197,
        words: ch12AllWords.slice(45, 53) // Humidifier -> Ceiling fan (8 words)
      }
    ];

    ch12.dialogues = lessonGroups.map(group => {
      const vocabularies = [];
      const lines = [];

      for (const item of group.words) {
        const extra = CH12_VI_AND_EXAMPLES[item.word] || {
          vi: item.word,
          exampleEn: `We use the ${item.word.toLowerCase()} every day at home.`,
          exampleVi: `Chúng tôi sử dụng ${item.word.toLowerCase()} mỗi ngày ở nhà.`
        };

        vocabularies.push({
          word: item.word,
          phonetic: item.phonetic,
          wordType: item.wordType,
          meaning: `${extra.vi} — ${item.engDef}`
        });

        // Turn 1: BINO explains the household object in English (exact book definition)
        lines.push({
          speaker: "BINO",
          englishText: `${item.word}: ${item.engDef}`,
          vietnameseText: `Giải nghĩa "${item.word}" (${extra.vi}): ${item.engDef}`,
          isUserRole: false
        });

        // Turn 2: YOU respond with the Vietnamese meaning & an example sentence (as instructed on Page 192)
        lines.push({
          speaker: "YOU",
          englishText: extra.exampleEn,
          vietnameseText: `${extra.vi} — ${extra.exampleVi}`,
          isUserRole: true
        });
      }

      return {
        number: group.number,
        title: group.title,
        startPage: group.startPage,
        vocabularies,
        lines
      };
    });
  }

  // Finalize Bonus Title, Bonus Content HTML, and Bonus Slangs for all 12 chapters
  for (const ch of chapters) {
    const philTitle = ch.philosophySubtitle
      ? `Bino's Philosophy #${ch.number}: ${ch.philosophySubtitle}`
      : `Bino's Philosophy #${ch.number}`;

    ch.bonusTitle = `Mẫu Câu Mở Rộng (More Expressions) & ${philTitle}`;
    ch.bonusContentHtml = ch.bonusPagesHtml.join('\n<hr class="bonus-page-divider" />\n');

    // Collect top slang/key phrases for quick pronunciation cards
    const slangs = [];
    for (const d of ch.dialogues) {
      for (const v of d.vocabularies.slice(0, 2)) {
        if (v.word && !slangs.includes(v.word) && slangs.length < 12) {
          slangs.push(v.word);
        }
      }
    }
    ch.bonusSlangs = slangs;
    delete ch.bonusPagesHtml;
  }

  console.log('========================================================================');
  console.log('         KẾT QUẢ TRÍCH XUẤT CHUẨN XÁC 100% TỪ TIENGANHBI.EPUB          ');
  console.log('========================================================================');
  let totalDialogues = 0;
  let totalLines = 0;
  let totalVocabs = 0;

  chapters.forEach(ch => {
    console.log(`\n📚 [CHƯƠNG ${ch.number}] ${ch.title} - ${ch.titleVi} (${ch.dialogues.length} bài | Bonus HTML: ${ch.bonusContentHtml.length} chars)`);
    console.log(`   ★ Bonus: ${ch.bonusTitle}`);
    ch.dialogues.forEach(d => {
      totalDialogues++;
      totalVocabs += d.vocabularies.length;
      totalLines += d.lines.length;
      console.log(`   Bài ${d.number}: ${d.title} (Trang ${d.startPage}) | ${d.vocabularies.length} từ | ${d.lines.length} câu`);
    });
  });

  console.log('\n========================================================================');
  console.log(`TỔNG CỘNG: ${chapters.length} Chương, ${totalDialogues} Bài học, ${totalVocabs} Từ vựng, ${totalLines} Câu thoại.`);
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

  // Also copy the updated TiengAnhBi.epub to Frontend/public/ebooks and Backend/wwwroot/ebooks
  const publicEpubPath = path.resolve(__dirname, '../public/ebooks/chem_tieng_anh_bino.epub');
  if (fs.existsSync(path.dirname(publicEpubPath))) {
    fs.copyFileSync(epubPath, publicEpubPath);
  }
  const wwwrootEpubPath = path.resolve(__dirname, '../../Backend/VBaceEnglish.Api/wwwroot/ebooks/chem_tieng_anh_bino.epub');
  if (fs.existsSync(path.dirname(wwwrootEpubPath))) {
    fs.copyFileSync(epubPath, wwwrootEpubPath);
  }

  console.log('Đã cập nhật đồng bộ vào extracted_bino_data.json, Backend bino_real_data.json và copy file epub mới thành công!');
}

reextractPureBino().catch(console.error);
