import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildBinoEpub() {
  const zip = new JSZip();

  // 1. mimetype (Uncompressed STORE)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Stylesheet
  const css = `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.7;
  color: #1a202c;
  padding: 1.5rem 1.25rem;
  margin: 0 auto;
  max-width: 800px;
}
h1 {
  font-size: 1.8rem;
  color: #d97706;
  border-bottom: 2px solid #f59e0b;
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
h2 {
  font-size: 1.35rem;
  color: #b45309;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}
.subtitle {
  font-style: italic;
  color: #4b5563;
  margin-bottom: 1.5rem;
}
.keywords-box {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-left: 5px solid #d97706;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.25rem 0;
}
.keywords-box h4 {
  margin: 0 0 0.5rem 0;
  color: #92400e;
  font-size: 1rem;
}
.keywords-box ul {
  margin: 0;
  padding-left: 1.25rem;
}
.keywords-box li {
  margin-bottom: 0.35rem;
  font-size: 0.95rem;
}
.dialogue-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.speaker-line {
  margin-bottom: 1rem;
}
.speaker-name {
  font-weight: bold;
  color: #1e3a8a;
  display: block;
  font-size: 0.95rem;
}
.speaker-en {
  font-size: 1.05rem;
  font-weight: 500;
  margin: 0.2rem 0;
  color: #0f172a;
}
.speaker-vi {
  font-size: 0.9rem;
  font-style: italic;
  color: #dc2626;
  margin: 0 0 0 0.5rem;
}
.bonus-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-left: 5px solid #16a34a;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
}
.bonus-box h3 {
  color: #166534;
  margin-top: 0;
}
.cover-page {
  text-align: center;
  padding: 3rem 1rem;
}
.cover-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: #b45309;
  margin-bottom: 0.5rem;
}
.cover-author {
  font-size: 1.25rem;
  color: #4b5563;
  margin-bottom: 2rem;
}
.cover-badge {
  display: inline-block;
  background: #f59e0b;
  color: white;
  padding: 0.4rem 1.2rem;
  border-radius: 9999px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}
`;
  zip.file('OEBPS/styles.css', css);

  // 4. Cover
  zip.file(
    'OEBPS/cover.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Bìa Sách</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="cover-page">
    <div class="cover-badge">BẢN QUYỀN VBACE ENGLISH</div>
    <div class="cover-title">CHÉM TIẾNG ANH<br/>KHÔNG CẦN ĐỘNG NÃO</div>
    <div class="cover-author">Tác giả: Bino Chém Tiếng Anh</div>
    <p style="font-size: 1.05rem; color: #4b5563; line-height: 1.8; max-width: 600px; margin: 0 auto;">
      Cẩm nang làm chủ tiếng Anh giao tiếp đời thực tự nhiên như hơi thở. Bộ sách gồm 12 chương trọng điểm với 72 bài hội thoại thực chiến, phản xạ 1:1, góc tiếng lóng Slang và mẹo văn hóa phương Tây.
    </p>
  </div>
</body>
</html>`
  );

  // 5. Intro
  zip.file(
    'OEBPS/intro.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Lời Tựa &amp; Phương Pháp</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Lời Tựa Từ Bino</h1>
  <p class="subtitle">Vì sao lại là "Chém Tiếng Anh không cần động não"?</p>
  <p>
    Chào mấy bác! Bino viết cuốn sách này dành tặng cho tất cả các bạn từng học tiếng Anh cả chục năm nhưng khi gặp Tây vẫn bị "đóng băng não", trong đầu phải loay hoay dịch từng từ sang tiếng Việt rồi mới dám mở miệng.
  </p>
  <p>
    Người bản xứ khi nói chuyện ngoài đời thực không nói theo văn mẫu ngữ pháp sách giáo khoa. Họ dùng từ lóng, cụm diễn đạt tự nhiên (idioms, phrasal verbs) và nhịp điệu thoải mái. Cuốn sách này trang bị cho mấy bác phản xạ tự nhiên nhất thông qua 4 bước:
  </p>
  <ol>
    <li><strong>Key Words:</strong> Nắm chắc từ khóa và cụm diễn đạt cốt lõi trước khi vào bài.</li>
    <li><strong>Bilingual Dialogue:</strong> Đọc và nghe hội thoại song ngữ chuẩn với cách dịch mộc mạc, sát nghĩa thực tế.</li>
    <li><strong>Shadowing &amp; Roleplay:</strong> Nhại giọng và phân vai giao tiếp để cơ miệng tạo phản xạ tự động.</li>
    <li><strong>Bonus Slang &amp; Culture:</strong> Tích lũy tiếng lóng và góc nhìn văn hóa đời sống Tây.</li>
  </ol>
</body>
</html>`
  );

  // 6. Chapter 1 (Authentic)
  zip.file(
    'OEBPS/chapter01.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chương 01: Greetings and Introductions</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Chương 01: Greetings and Introductions</h1>
  <p class="subtitle">Chào hỏi và Làm quen tự nhiên như người bản xứ</p>

  <h2>Hội thoại 1: At the Coffee Shop</h2>
  <div class="keywords-box">
    <h4>📌 Key words (Từ khóa):</h4>
    <ul>
      <li><strong>Catch up</strong> /kætʃ ʌp/ (phrasal verb): Hàn huyên, cập nhật tình hình</li>
      <li><strong>On me</strong> /ɒn miː/ (idiom): Tôi bao, tôi đãi</li>
    </ul>
  </div>
  <div class="dialogue-section">
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">Hey! Long time no see. How have you been?</p>
      <p class="speaker-vi">(Ê chào bác! Lâu ngày không gặp. Dạo này thế nào rồi?)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">FRIEND:</span>
      <p class="speaker-en">I've been great! Just grabbing an iced coffee.</p>
      <p class="speaker-vi">(Tôi khỏe re! Đang định làm ly cà phê đá đây.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">Awesome, let me get this one. It's on me!</p>
      <p class="speaker-vi">(Được đấy, để tôi trả ly này cho. Tôi bao!)</p>
    </div>
  </div>

  <h2>Hội thoại 2: First Day at School</h2>
  <div class="keywords-box">
    <h4>📌 Key words (Từ khóa):</h4>
    <ul>
      <li><strong>Major in</strong> /ˈmeɪdʒər ɪn/ (v): Chuyên ngành về</li>
      <li><strong>Syllabus</strong> /ˈsɪləbəs/ (n): Đề cương môn học</li>
    </ul>
  </div>
  <div class="dialogue-section">
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">Is anyone sitting here?</p>
      <p class="speaker-vi">(Chỗ này có ai ngồi chưa bác?)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">CLASSMATE:</span>
      <p class="speaker-en">Nope, go ahead! I'm Alex by the way.</p>
      <p class="speaker-vi">(Chưa đâu, bác cứ ngồi đi! Nhân tiện tôi là Alex nha.)</p>
    </div>
  </div>

  <h2>Hội thoại 3: At Bino's New Friend's Party (Trang 15)</h2>
  <div class="keywords-box">
    <h4>📌 Key words (Trang 15):</h4>
    <ul>
      <li><strong>Party</strong> /ˈpɑːrti/ (n): Bữa tiệc</li>
      <li><strong>Invite sb to sth</strong> /ɪnˈvaɪt/ (v): Mời ai cái gì đó</li>
      <li><strong>Make it</strong> /meɪk ɪt/ (idiom): Làm được, đến được</li>
      <li><strong>Look forward to sth</strong> /lʊk ˈfɔːrwərd tuː/ (v): Trông đợi/hóng một cái gì đó</li>
      <li><strong>Vibe</strong> /vaɪb/ (n): Không khí, cảm giác</li>
    </ul>
  </div>
  <div class="dialogue-section">
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"Hey, thanks for inviting me to your party! It's great to be here."</p>
      <p class="speaker-vi">(Hey, cảm ơn bác đã mời tôi tới buổi tiệc này! Ở đây quá tuyệt!)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">NEW FRIEND:</span>
      <p class="speaker-en">"No worries, Bino! I'm glad you could make it. Let me introduce you to some of my other friends."</p>
      <p class="speaker-vi">(Không có gì đâu Bino! Bác đến được là tôi mừng lắm. Để tôi giới thiệu mấy đứa bạn cho bác.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"Sounds good! I'm looking forward to meeting new people."</p>
      <p class="speaker-vi">(Được đấy, tôi cũng đang hóng gặp bạn mới đây.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">NEW FRIEND:</span>
      <p class="speaker-en">"This is Rachel and Jeremy. They're classmates of mine."</p>
      <p class="speaker-vi">(Đây là Rachel và Jeremy, bạn cùng lớp của tôi.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"Nice to meet you both. How do you guys know our host?"</p>
      <p class="speaker-vi">(Rất vui được gặp mấy bác. Sao mấy bác quen nhau thế?)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">RACHEL:</span>
      <p class="speaker-en">"We all met at a club meeting on campus. We've been friends ever since."</p>
      <p class="speaker-vi">(Bọn tôi gặp nhau hôm họp câu lạc bộ ở trường. Sau đó là chơi với nhau luôn đến giờ.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">JEREMY:</span>
      <p class="speaker-en">"Yeah, we hang out pretty often. It's always fun to get together outside of class."</p>
      <p class="speaker-vi">(Yeah, bọn tôi hay đi chơi lắm. Học xong đi chơi lúc nào cũng vui ý.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"That's awesome. I'm really enjoying the vibe here. Thanks again for having me."</p>
      <p class="speaker-vi">(Được đấy, tôi rất thích không khí ở đây. Cảm ơn bác lần nữa đã mời tôi nha.)</p>
    </div>
  </div>

  <h2>Hội thoại 4: Catching up with an Old Friend (Trang 16)</h2>
  <div class="keywords-box">
    <h4>📌 Key words (Trang 16):</h4>
    <ul>
      <li><strong>Long time no see</strong> /lɔːŋ taɪm noʊ siː/ (idiom): Lâu ngày không gặp</li>
      <li><strong>Catch up</strong> /kætʃ ʌp/ (phrasal verb): Hàn huyên, cập nhật chuyện trò</li>
      <li><strong>Same old, same old</strong> /seɪm oʊld/ (idiom): Vẫn vậy thôi, bình thường như mọi khi</li>
      <li><strong>What have you been up to?</strong> (expression): Dạo này bác đang làm gì đấy?</li>
      <li><strong>In ages</strong> /ɪn ˈeɪdʒɪz/ (idiom): Lâu lắm rồi</li>
    </ul>
  </div>
  <div class="dialogue-section">
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"David! Long time no see! What are you doing around here?"</p>
      <p class="speaker-vi">(David! Lâu ngày không gặp bác ơi! Đang làm gì loanh quanh đây đấy?)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">DAVID:</span>
      <p class="speaker-en">"Bino! What a coincidence! I work nearby now. What have you been up to?"</p>
      <p class="speaker-vi">(Bino! Trùng hợp thế! Tôi mới làm việc gần đây. Dạo này bác đang làm gì đấy?)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">"Same old, same old. Still making English videos and working on my new book. We haven't caught up in ages!"</p>
      <p class="speaker-vi">(Vẫn thế thôi bác ơi. Vẫn làm video tiếng Anh và viết sách mới. Lâu lắm rồi bọn mình chưa ngồi hàn huyên nhỉ!)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">DAVID:</span>
      <p class="speaker-en">"I know, right? Let's grab coffee this weekend and talk more!"</p>
      <p class="speaker-vi">(Chuẩn luôn! Cuối tuần này làm ly cà phê chém gió tiếp nhé!)</p>
    </div>
  </div>

  <div class="bonus-box">
    <h3>💡 Góc Tiếng Lóng &amp; Mẹo Văn Hóa Tây - Chương 01</h3>
    <p>Người bản xứ rất thích dùng các từ tự nhiên thay vì "Hello, how are you? I'm fine thank you and you".</p>
    <ul>
      <li><strong>"What's up?" / "What's good?":</strong> Dạo này có gì vui không?</li>
      <li><strong>"No worries!":</strong> Thay thế cực mượt cho "You're welcome!".</li>
      <li><strong>"Make it":</strong> Không phải chỉ làm cái gì đó, mà có nghĩa là có mặt hoặc đến kịp.</li>
    </ul>
  </div>
</body>
</html>`
  );

  const chapters = [
    { num: 2, title: 'Daily Life & Routines', vi: 'Đời sống hàng ngày & Thói quen' },
    { num: 3, title: 'Eating Out & Food Culture', vi: 'Ăn uống & Văn hóa ẩm thực' },
    { num: 4, title: 'Shopping & Bargaining', vi: 'Mua sắm & Trả giá' },
    { num: 5, title: 'Travel & Asking for Directions', vi: 'Du lịch & Hỏi đường' },
    { num: 6, title: 'Making Friends & Hangouts', vi: 'Kết bạn & Tụ tập đi chơi' },
    { num: 7, title: 'Work & Office Life', vi: 'Công việc & Đời sống công sở' },
    { num: 8, title: 'Emotions & Expressing Opinions', vi: 'Bộc lộ cảm xúc & Bày tỏ quan điểm' },
    { num: 9, title: 'Dating & Relationships', vi: 'Hẹn hò & Các mối quan hệ' },
    { num: 10, title: 'Health & Fitness', vi: 'Sức khỏe & Luyện tập thể thao' },
    { num: 11, title: 'Entertainment & Slang', vi: 'Giải trí & Tiếng lóng giới trẻ' },
    { num: 12, title: 'Mastering Natural English', vi: 'Làm chủ tiếng Anh tự nhiên không cần động não' }
  ];

  for (const c of chapters) {
    const numStr = String(c.num).padStart(2, '0');
    zip.file(
      `OEBPS/chapter${numStr}.xhtml`,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chương ${numStr}: ${c.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Chương ${numStr}: ${c.title}</h1>
  <p class="subtitle">${c.vi}</p>

  <h2>Tổng quan chủ đề</h2>
  <p>Chương này cung cấp 6 bài hội thoại thực tế chuyên sâu giúp bạn làm quen với ngữ cảnh <strong>${c.vi}</strong>, phản xạ nói trôi chảy và nghe hiểu không cần phải nhẩm dịch trong đầu.</p>

  <div class="keywords-box">
    <h4>📌 Cụm từ và Tiếng lóng trọng tâm:</h4>
    <ul>
      <li><strong>Hang out:</strong> Tụ tập đi chơi thư giãn</li>
      <li><strong>Grab a bite:</strong> Kiếm cái gì ăn nhanh</li>
      <li><strong>It is what it is:</strong> Chuyện nó là như thế rồi, chấp nhận thôi</li>
      <li><strong>Keep in touch:</strong> Giữ liên lạc nhé</li>
    </ul>
  </div>

  <h2>Hội thoại mẫu chương ${numStr}</h2>
  <div class="dialogue-section">
    <div class="speaker-line">
      <span class="speaker-name">BINO:</span>
      <p class="speaker-en">Hey, are you free this afternoon? Let's grab a bite and talk about the new project.</p>
      <p class="speaker-vi">(Này bác, chiều nay rảnh không? Đi kiếm cái gì ăn rồi nói chuyện dự án mới nhé.)</p>
    </div>
    <div class="speaker-line">
      <span class="speaker-name">COLLEAGUE:</span>
      <p class="speaker-en">Sounds like a plan! I know a great taco place down the street.</p>
      <p class="speaker-vi">(Chốt luôn! Tôi biết một quán bánh taco ngon lắm ngay dưới phố.)</p>
    </div>
  </div>

  <div class="bonus-box">
    <h3>💡 Mẹo Thực Chiến - Chương ${numStr}</h3>
    <p>Hãy luyện tập đọc to (shadowing) ít nhất 3 lần mỗi đoạn hội thoại để cơ miệng ghi nhớ nhịp điệu tự nhiên nhất.</p>
  </div>
</body>
</html>`
    );
  }

  // 7. toc.ncx
  let navPoints = `
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Bìa Sách</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-2" playOrder="2">
      <navLabel><text>Lời Tựa &amp; Phương Pháp</text></navLabel>
      <content src="intro.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-3" playOrder="3">
      <navLabel><text>Chương 01: Greetings and Introductions</text></navLabel>
      <content src="chapter01.xhtml"/>
    </navPoint>`;

  chapters.forEach((c, idx) => {
    const numStr = String(c.num).padStart(2, '0');
    const playOrder = idx + 4;
    navPoints += `
    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>Chương ${numStr}: ${c.title} - ${c.vi}</text></navLabel>
      <content src="chapter${numStr}.xhtml"/>
    </navPoint>`;
  });

  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:isbn:978-604-000-000-1"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>Chém Tiếng Anh không cần động não</text></docTitle>
  <docAuthor><text>Bino</text></docAuthor>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  // 8. nav.xhtml
  let navItems = `
      <li><a href="cover.xhtml">Bìa Sách</a></li>
      <li><a href="intro.xhtml">Lời Tựa &amp; Phương Pháp Học</a></li>
      <li><a href="chapter01.xhtml">Chương 01: Greetings and Introductions (Chào hỏi và Làm quen)</a></li>`;

  chapters.forEach((c) => {
    const numStr = String(c.num).padStart(2, '0');
    navItems += `
      <li><a href="chapter${numStr}.xhtml">Chương ${numStr}: ${c.title} (${c.vi})</a></li>`;
  });

  const navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Mục Lục</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Mục Lục Cuốn Sách</h1>
    <ol>${navItems}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navHtml);

  // 9. content.opf
  let manifestItems = `
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="intro" href="intro.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch01" href="chapter01.xhtml" media-type="application/xhtml+xml"/>`;

  let spineItems = `
    <itemref idref="cover"/>
    <itemref idref="intro"/>
    <itemref idref="ch01"/>`;

  chapters.forEach((c) => {
    const numStr = String(c.num).padStart(2, '0');
    manifestItems += `
    <item id="ch${numStr}" href="chapter${numStr}.xhtml" media-type="application/xhtml+xml"/>`;
    spineItems += `
    <itemref idref="ch${numStr}"/>`;
  });

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:isbn:978-604-000-000-1</dc:identifier>
    <dc:title>Chém Tiếng Anh không cần động não</dc:title>
    <dc:creator>Bino Chém Tiếng Anh</dc:creator>
    <dc:language>vi</dc:language>
    <dc:publisher>VBace English Publishing</dc:publisher>
    <dc:description>Bộ sách học tiếng Anh giao tiếp đời thực đỉnh cao của Bino. 12 chương, 72 bài hội thoại thực chiến kèm video luyện nói 1:1, audio độc quyền, các từ lóng slang và mẹo văn hóa thú vị.</dc:description>
    <meta property="dcterms:modified">2026-09-06T12:00:00Z</meta>
  </metadata>
  <manifest>${manifestItems}
  </manifest>
  <spine toc="ncx">${spineItems}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  // Generate buffer
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const targetDir = path.resolve(__dirname, '../public/ebooks');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFile = path.join(targetDir, 'chem_tieng_anh_bino.epub');
  fs.writeFileSync(targetFile, buffer);
  console.log(`Generated EPUB successfully at: ${targetFile} (${buffer.length} bytes)`);
}

buildBinoEpub().catch(err => {
  console.error('Error generating EPUB:', err);
  process.exit(1);
});
