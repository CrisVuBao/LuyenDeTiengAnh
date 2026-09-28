/**
 * VBaceEnglish — Smart Vietnamese-Accent English Speech Recognition & Phonetic Alignment Engine
 * ---------------------------------------------------------------------------------------------
 * Giải quyết triệt để 2 bài toán lớn khi người Việt luyện nói tiếng Anh trên Web (Máy tính & Điện thoại):
 * 1. Tương thích phần cứng Micro trên cả PC/Laptop lẫn Mobile:
 *    - Tự động ngắt TTS trước khi mở Mic, hỗ trợ continuous + interimResults + 10 N-Best Alternatives.
 *    - Không bị ngắt giữa chừng khi người học nghỉ lấy hơi 0.5s–1.5s trên máy tính.
 *    - Tự động chốt câu ngay khi nhận diện đã đọc đủ câu mẫu (>= 92%) hoặc sau 2.2s ngừng nói.
 * 2. Trí tuệ ngữ âm Việt-Anh (Context-Aware Vietnamese-Accent Phonetic Matcher):
 *    - Phân tích toàn bộ 10 phương án (N-Best Hypotheses) từ trình duyệt thay vì chỉ lấy phương án đầu.
 *    - Khớp âm vị thông minh theo đặc trưng phát âm của người Việt (nhẹ âm đuôi -s/-ed/-t/-th/-l,
 *      nhầm lẫn nguyên âm ngắn/dài /ɪ/-/iː/, /æ/-/e/, /ʊ/-/uː/, phụ âm đầu th/t/d/s, sh/ch/s, r/l/n, w/v/b).
 *    - Tự động ánh xạ (Snap-to-Target) các từ bị AI trình duyệt nghe nhầm sang đúng từ tiếng Anh
 *      trong câu mục tiêu khi cấu trúc âm tiết tương đồng, giúp người học nhận phản hồi công bằng & thông minh.
 */

import speechService from './speechService';

// 1. Từ điển chuẩn hóa viết tắt, khẩu ngữ & số đếm
const SPOKEN_EXPANSIONS = [
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'],
  [/\bhere's\b/g, 'here is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwhere's\b/g, 'where is'],
  [/\bwho's\b/g, 'who is'],
  [/\bhow's\b/g, 'how is'],
  [/\bi've\b/g, 'i have'],
  [/\byou've\b/g, 'you have'],
  [/\bwe've\b/g, 'we have'],
  [/\bthey've\b/g, 'they have'],
  [/\bi'll\b/g, 'i will'],
  [/\byou'll\b/g, 'you will'],
  [/\bwe'll\b/g, 'we will'],
  [/\bthey'll\b/g, 'they will'],
  [/\bhe'll\b/g, 'he will'],
  [/\bshe'll\b/g, 'she will'],
  [/\bit'll\b/g, 'it will'],
  [/\bi'd\b/g, 'i would'],
  [/\byou'd\b/g, 'you would'],
  [/\bwe'd\b/g, 'we would'],
  [/\bthey'd\b/g, 'they would'],
  [/\bhe'd\b/g, 'he would'],
  [/\bshe'd\b/g, 'she would'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bcouldn't\b/g, 'could not'],
  [/\bwon't\b/g, 'will not'],
  [/\bwouldn't\b/g, 'would not'],
  [/\bshouldn't\b/g, 'should not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'],
  [/\bweren't\b/g, 'were not'],
  [/\bhasn't\b/g, 'has not'],
  [/\bhaven't\b/g, 'have not'],
  [/\bhadn't\b/g, 'had not'],
  [/\bmustn't\b/g, 'must not'],
  [/\blet's\b/g, 'let us'],
  [/\bgonna\b/g, 'going to'],
  [/\bwanna\b/g, 'want to'],
  [/\bgotta\b/g, 'got to'],
  [/\blemme\b/g, 'let me'],
  [/\bgimme\b/g, 'give me'],
  [/\bkinda\b/g, 'kind of'],
  [/\bsorta\b/g, 'sort of'],
  [/\boutta\b/g, 'out of'],
  [/\bdunno\b/g, 'do not know'],
  [/\bcuz\b/g, 'because'],
  [/\bcause\b/g, 'because'],
  [/\balright\b/g, 'all right'],
  [/\balot\b/g, 'a lot'],
  [/\bok\b/g, 'okay'],
  [/\ba\.m\./g, 'am'],
  [/\bp\.m\./g, 'pm'],
  [/\bo'clock\b/g, 'oclock']
];

const NUMBER_WORDS_MAP = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen',
  '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
  '20': 'twenty', '25': 'twenty five', '30': 'thirty', '40': 'forty', '45': 'forty five',
  '50': 'fifty', '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety',
  '100': 'one hundred', '1st': 'first', '2nd': 'second', '3rd': 'third', '4th': 'fourth', '5th': 'fifth'
};

// Nhóm các từ đồng âm / gần âm mà Web Speech API rất hay nghe nhầm khi người Việt phát âm tiếng Anh
const VIET_ACCENT_CONFUSION_GROUPS = [
  ['work', 'walk', 'woke', 'world', 'word', 'worth', 'ward', 'wall', 'war', 'warm', 'worm'],
  ['three', 'tree', 'free', 'treat', 'street'],
  ['think', 'thing', 'things', 'sink', 'sing', 'thin', 'tin', 'pink', 'thank', 'thanks', 'tank'],
  ['thought', 'taught', 'talk', 'talked', 'tall', 'short', 'sort', 'shot', 'shut', 'shirt'],
  ['this', 'these', 'dis', 'miss', 'is', 'his', 'kiss', 'list', 'least'],
  ['that', 'dat', 'dad', 'bad', 'cat', 'sat', 'hat', 'fat', 'flat', 'last', 'fast', 'past', 'pass', 'part', 'path'],
  ['there', 'their', 'they', 'day', 'dare', 'dear', 'where', 'wear', 'were', 'care', 'chair', 'share', 'hair', 'air', 'fair', 'pair'],
  ['then', 'than', 'ten', 'den', 'men', 'man', 'main', 'plan', 'pen', 'pan', 'pain'],
  ['them', 'dem', 'damn', 'then', 'name', 'same', 'seem', 'send', 'sent', 'sense', 'cent'],
  ['with', 'wit', 'wish', 'which', 'week', 'weak', 'weed', 'will', 'we', 'win', 'wind'],
  ['both', 'boat', 'boss', 'bought', 'box', 'ball', 'bowl', 'bone', 'born', 'board', 'bored'],
  ['clothes', 'close', 'closed', 'cloud', 'clock', 'cloth', 'cold', 'call', 'called', 'coal', 'code', 'coat', 'coast'],
  ['salt', 'soft', 'saw', 'sort', 'sold', 'soul', 'so', 'show', 'sure', 'sore', 'short', 'sauce'],
  ['six', 'sick', 'sit', 'seat', 'see', 'sea', 'she', 'seek', 'seed', 'city', 'sixth'],
  ['five', 'fine', 'find', 'fire', 'fight', 'file', 'side', 'sign', 'sight', 'size', 'shy', 'sky', 'fly', 'try', 'time', 'tie', 'tired', 'type'],
  ['four', 'for', 'fall', 'phone', 'full', 'fool', 'far', 'form', 'from', 'front', 'fun', 'fine', 'found'],
  ['two', 'to', 'too', 'do', 'through', 'true', 'threw', 'shoe', 'shoes', 'choose', 'chose', 'juice', 'use', 'used', 'you', 'new', 'knew'],
  ['one', 'won', 'want', 'wanted', 'once', 'warm', 'when', 'went', 'run', 'ran', 'lunch', 'learn'],
  ['eight', 'ate', 'eat', 'it', 'is', 'at', 'add', 'act', 'ask', 'asked', 'art', 'out'],
  ['seven', 'saving', 'heaven', 'even', 'eleven'],
  ['nine', 'nice', 'night', 'knight', 'knife', 'line', 'lie', 'light', 'like', 'liked', 'life', 'live', 'lived', 'leave', 'leaf'],
  ['ten', 'tend', 'tent', 'test', 'text', 'tech', 'take', 'taken', 'taste', 'late', 'let', 'left', 'less', 'rest', 'red', 'read', 'ready'],
  ['wake', 'way', 'wait', 'weight', 'wet', 'west', 'waste', 'wave', 'wear', 'well'],
  ['make', 'made', 'may', 'main', 'mail', 'male', 'mate', 'met', 'mat', 'meat', 'meet', 'mean', 'mind', 'mine', 'might', 'my'],
  ['have', 'has', 'had', 'half', 'help', 'helped', 'health', 'heavy', 'happy', 'happen'],
  ['good', 'wood', 'would', 'could', 'should', 'food', 'foot', 'full', 'put', 'pull', 'pool', 'book', 'look', 'looked', 'luck', 'cook', 'cool'],
  ['need', 'needed', 'neat', 'knee', 'near', 'next', 'neck', 'net'],
  ['right', 'write', 'ride', 'white', 'why', 'wife', 'wide', 'wine', 'rice', 'rise', 'price', 'prize', 'pride', 'bright'],
  ['place', 'play', 'played', 'plate', 'please', 'plan', 'plane', 'plant', 'pay', 'paid', 'page', 'face', 'space', 'stay'],
  ['home', 'whole', 'hold', 'hole', 'hope', 'hot', 'heart', 'hard', 'hurt', 'heard', 'her', 'here', 'hear', 'hair', 'high', 'hi'],
  ['house', 'how', 'hour', 'hours', 'our', 'ours', 'out', 'outside', 'mouse', 'mouth', 'mount', 'south', 'sound', 'sour', 'found', 'down', 'town'],
  ['now', 'know', 'no', 'not', 'note', 'north', 'nor', 'low', 'law', 'long', 'alone', 'along'],
  ['go', 'goes', 'goal', 'gold', 'got', 'god', 'dog', 'door', 'floor', 'more', 'most', 'mode', 'move'],
  ['watch', 'watched', 'wash', 'washed', 'what', 'was', 'water', 'walk', 'want'],
  ['catch', 'cash', 'cat', 'cast', 'card', 'car', 'care', 'cut', 'cup', 'come', 'came', 'can', 'cannot', 'can\'t', 'count'],
  ['much', 'must', 'march', 'match', 'math', 'month', 'mother', 'matter', 'money', 'many', 'morning'],
  ['check', 'checked', 'change', 'changed', 'chance', 'train', 'chain', 'cheap', 'sheep', 'ship', 'shop', 'stop', 'stopped', 'top', 'job', 'drop'],
  ['breakfast', 'break', 'fast', 'first', 'best', 'bed', 'bet', 'back', 'black', 'bag', 'bank', 'bath', 'bus', 'but', 'buy', 'by', 'bye'],
  ['dinner', 'thinner', 'winner', 'winter', 'window', 'wind'],
  ['coffee', 'copy', 'cough', 'cafe', 'tea', 'see', 'free', 'fee', 'feed', 'feel', 'fill', 'few', 'view', 'field', 'felt', 'fell', 'tell', 'told', 'sell', 'sold'],
  ['usually', 'visual', 'use', 'useful', 'user'],
  ['always', 'away', 'all', 'way', 'ways', 'also', 'already', 'almost'],
  ['often', 'open', 'opened', 'off', 'of', 'up', 'over', 'offer', 'office'],
  ['sometimes', 'sometime', 'some', 'time', 'times', 'something', 'someone', 'same', 'sum'],
  ['because', 'become', 'became', 'before', 'begin', 'behind', 'believe', 'below', 'beside', 'between', 'beyond'],
  ['really', 'ready', 'read', 'real', 'early', 'only', 'daily', 'easily', 'family', 'finally']
];

// Xây dựng bảng tra cứu nhanh các từ thuộc cùng nhóm dễ nhầm âm
const CONFUSION_LOOKUP = new Map();
for (const group of VIET_ACCENT_CONFUSION_GROUPS) {
  for (const w of group) {
    if (!CONFUSION_LOOKUP.has(w)) {
      CONFUSION_LOOKUP.set(w, new Set());
    }
    const set = CONFUSION_LOOKUP.get(w);
    for (const peer of group) {
      set.add(peer);
    }
  }
}

// Danh sách từ chức năng ngắn (Unstressed Function Words) thường bị nuốt âm hoặc nối âm khi nói
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'to', 'in', 'on', 'at', 'of', 'for', 'with', 'by', 'as', 'into', 'from',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'us', 'them', 'him', 'her',
  'my', 'your', 'our', 'their', 'his', 'its', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'so'
]);

/**
 * Chuẩn hóa chuỗi tiếng Anh về dạng từ đơn viết thường (đã bung viết tắt và đổi số thành chữ)
 */
export function normalizeForSpeechComparison(text = '') {
  let s = String(text || '')
    .toLowerCase()
    .replace(/['’`]/g, "'");

  // Chuyển giờ dạng 7:00 -> 7 oclock, 7:30 -> 7 30
  s = s.replace(/\b(\d{1,2}):00\b/g, '$1 oclock');
  s = s.replace(/\b(\d{1,2}):(\d{2})\b/g, '$1 $2');

  for (const [regex, replacement] of SPOKEN_EXPANSIONS) {
    s = s.replace(regex, replacement);
  }

  s = s
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return '';

  const tokens = s.split(' ').map((tok) => NUMBER_WORDS_MAP[tok] || tok);
  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Rút gọn từ về gốc từ (Stem) để không bắt lỗi người Việt khi thiếu âm cuối -s/-es/-ed/-ing/-ly
 */
export function getWordStem(word = '') {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // Một số bất quy tắc phổ biến
  const irregulars = {
    went: 'go', goes: 'go', gone: 'go', going: 'go',
    did: 'do', does: 'do', done: 'do', doing: 'do',
    had: 'have', has: 'have', having: 'have',
    said: 'say', says: 'say', saying: 'say',
    made: 'make', makes: 'make', making: 'make',
    took: 'take', takes: 'take', taken: 'take', taking: 'take',
    came: 'come', comes: 'come', coming: 'come',
    saw: 'see', sees: 'see', seen: 'see', seeing: 'see',
    got: 'get', gets: 'get', gotten: 'get', getting: 'get',
    knew: 'know', knows: 'know', known: 'know',
    thought: 'think', thinks: 'think', thinking: 'think',
    told: 'tell', tells: 'tell', telling: 'tell',
    found: 'find', finds: 'find', finding: 'find',
    gave: 'give', gives: 'give', given: 'give',
    left: 'leave', leaves: 'leave', leaving: 'leave',
    felt: 'feel', feels: 'feel', feeling: 'feel',
    kept: 'keep', keeps: 'keep', keeping: 'keep',
    held: 'hold', holds: 'hold', holding: 'hold',
    wrote: 'write', writes: 'write', written: 'write',
    stood: 'stand', stands: 'stand',
    heard: 'hear', hears: 'hear',
    bought: 'buy', buys: 'buy',
    brought: 'bring', brings: 'bring',
    met: 'meet', meets: 'meet',
    paid: 'pay', pays: 'pay',
    sat: 'sit', sits: 'sit',
    spoke: 'speak', speaks: 'speak', spoken: 'speak',
    slept: 'sleep', sleeps: 'sleep',
    spent: 'spend', spends: 'spend',
    sent: 'send', sends: 'send',
    built: 'build', builds: 'build',
    ate: 'eat', eats: 'eat', eaten: 'eat',
    drank: 'drink', drinks: 'drink',
    ran: 'run', runs: 'run',
    woke: 'wake', wakes: 'wake',
    wore: 'wear', wears: 'wear',
    won: 'win', wins: 'win',
    lost: 'lose', loses: 'lose',
    taught: 'teach', teaches: 'teach',
    caught: 'catch', catches: 'catch',
    children: 'child', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth'
  };
  if (irregulars[w]) return irregulars[w];

  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) {
    const base = w.slice(0, -3);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (w.endsWith('ed') && w.length > 4) {
    const base = w.slice(0, -2);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  return w;
}

/**
 * Mã hóa từ tiếng Anh sang khung ngữ âm Việt-Anh (Vietnamese-Accent Phonetic Skeleton)
 * Giúp các từ có phát âm gần nhau trong giọng Việt tạo ra mã giống nhau hoặc rất gần nhau.
 */
export function toVietPhoneticCode(rawWord = '') {
  let w = getWordStem(rawWord.toLowerCase().replace(/[^a-z]/g, ''));
  if (!w) return '';

  // Xử lý các cụm chữ cái câm / đặc biệt trong tiếng Anh
  w = w
    .replace(/^kn/, 'n')
    .replace(/^wr/, 'r')
    .replace(/^gn/, 'n')
    .replace(/^wh/, 'w')
    .replace(/^ps/, 's')
    .replace(/igh/g, 'ai')
    .replace(/ought|aught/g, 'ot')
    .replace(/ould/g, 'ud')
    .replace(/alk/g, 'ok')
    .replace(/tion|sion/g, 'sn')
    .replace(/ture/g, 'ch')
    .replace(/dge|ge$/g, 's')
    .replace(/ph/g, 'f')
    .replace(/sh|ch|zh|j/g, 's')
    .replace(/th/g, 't')
    .replace(/qu/g, 'kw')
    .replace(/ck|c(?=[aoukrlt]|$)|q/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/v/g, 'w');

  // Chuẩn hóa nhóm nguyên âm (người Việt thường đọc gần nhau giữa nguyên âm ngắn & dài)
  w = w
    .replace(/ee|ea|ie|ei/g, 'i')
    .replace(/oo|ue|ui|ew/g, 'u')
    .replace(/ai|ay/g, 'e')
    .replace(/oa|ow|oe/g, 'o')
    .replace(/au|aw|al(?=[kltdfmns]|$)/g, 'o')
    .replace(/er|ir|ur|or|ar/g, 'o')
    .replace(/[aeiouy]+/g, (m) => m[0]);

  // Gộp phụ âm kép (bb->b, tt->t...)
  w = w.replace(/(.)\1+/g, '$1');

  // Giản lược cụm phụ âm cuối (vì tiếng Việt không bật cụm phụ âm cuối như -st, -nd, -lt, -kt...)
  if (w.length > 3) {
    w = w.replace(/(st|sk|sp|ft|pt|kt|nt|nd|ld|rd|lt|rt|ts|ds|ks|ps)$/, (m) => m[0]);
  }

  return w;
}

/**
 * Khoảng cách Levenshtein chuẩn hóa (0.0 -> 1.0)
 */
function stringSimilarity(a = '', b = '') {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n);
}

/**
 * Tính điểm tương đồng ngữ âm Việt-Anh giữa từ máy nghe được (spokenWord) và từ mục tiêu (targetWord)
 * Trả về giá trị từ 0.0 đến 1.0 (>= 0.60 là khớp âm đọc của người Việt!)
 */
export function vietPhoneticSimilarity(spokenWord = '', targetWord = '') {
  const s = spokenWord.toLowerCase().trim();
  const t = targetWord.toLowerCase().trim();
  if (!s || !t) return 0;
  if (s === t) return 1.0;

  // 1. Cùng gốc từ (Stem) -> 0.96
  const stemS = getWordStem(s);
  const stemT = getWordStem(t);
  if (stemS === stemT) return 0.96;

  // 2. Nằm trong bảng từ điển các cặp từ AI hay nghe nhầm của người Việt -> 0.92
  const confSet = CONFUSION_LOOKUP.get(t) || CONFUSION_LOOKUP.get(stemT);
  if (confSet && (confSet.has(s) || confSet.has(stemS))) {
    return 0.92;
  }

  // 3. Khớp mã ngữ âm Việt-Anh (Phonetic Skeleton)
  const codeS = toVietPhoneticCode(s);
  const codeT = toVietPhoneticCode(t);
  if (codeS && codeS === codeT) return 0.90;

  // 4. Khớp phần đầu (Onset + Vowel Nucleus): Người Việt đọc rất rõ âm đầu & nguyên âm chính,
  // chỉ hay nhẹ hoặc mất phụ âm cuối -> nếu 2-3 ký tự đầu giống hệt và độ dài tương đương
  const rawSim = stringSimilarity(s, t);
  const stemSim = stringSimilarity(stemS, stemT);
  const codeSim = stringSimilarity(codeS, codeT);

  let prefixBonus = 0;
  if (s.length >= 3 && t.length >= 3 && s.slice(0, 2) === t.slice(0, 2)) {
    prefixBonus = 0.14;
  } else if (codeS.length >= 2 && codeT.length >= 2 && codeS[0] === codeT[0]) {
    prefixBonus = 0.08;
  }

  return Math.min(0.95, Math.max(rawSim, stemSim, codeSim) + prefixBonus);
}

/**
 * Tái tạo câu thông minh (Context-Aware Smart Transcript Reconstruction):
 * Kết hợp toàn bộ các phương án N-Best từ trình duyệt + đối chiếu ngữ âm Việt-Anh với câu mục tiêu (targetText)
 * để sửa các từ bị AI nhận diện nhầm về đúng từ người học thực sự muốn nói.
 */
export function reconstructSmartTranscript(rawTranscriptOrList, targetText = '') {
  const candidates = Array.isArray(rawTranscriptOrList)
    ? rawTranscriptOrList.filter(Boolean)
    : [rawTranscriptOrList].filter(Boolean);

  if (candidates.length === 0) return '';
  if (!targetText || !targetText.trim()) return candidates[0];

  const rawTargetWords = targetText.trim().split(/\s+/).filter(Boolean);
  const normTargetWords = rawTargetWords.map((w) =>
    normalizeForSpeechComparison(w).split(' ')[0] || w.toLowerCase().replace(/[^\w]/g, '')
  );

  // Gom toàn bộ các từ (kèm vị trí tương đối) từ tất cả N-Best Hypotheses của trình duyệt
  const candidateTokenLists = candidates.map((c) =>
    normalizeForSpeechComparison(c).split(' ').filter(Boolean)
  );
  const primaryTokens = candidateTokenLists[0] || [];
  if (primaryTokens.length === 0) return candidates[0];

  const m = normTargetWords.length;
  const matchedTargetFlags = new Array(m).fill(false);

  // Bước 1: Kiểm tra từng từ mục tiêu xem có xuất hiện (hoặc đồng âm Việt-Anh) trong bất kỳ N-Best Hypothesis nào không
  for (let i = 0; i < m; i++) {
    const tWord = normTargetWords[i];
    if (!tWord) continue;
    const isFunc = FUNCTION_WORDS.has(tWord);
    const threshold = isFunc ? 0.68 : 0.60;

    let bestSim = 0;

    for (const tokenList of candidateTokenLists) {
      const n = tokenList.length;
      if (n === 0) continue;

      // Tính vị trí kỳ vọng trong câu nói dựa theo tỷ lệ
      const expectedJ = Math.round((i / Math.max(1, m - 1)) * Math.max(0, n - 1));
      const windowRadius = Math.max(4, Math.ceil(Math.max(m, n) * 0.45));
      const startJ = Math.max(0, expectedJ - windowRadius);
      const endJ = Math.min(n - 1, expectedJ + windowRadius);

      for (let j = startJ; j <= endJ; j++) {
        const uWord = tokenList[j];
        const sim = vietPhoneticSimilarity(uWord, tWord);
        if (sim > bestSim) bestSim = sim;

        // Kiểm tra trường hợp 2 từ nói gộp thành 1 từ mục tiêu (VD: "break fast" -> "breakfast")
        if (j + 1 <= endJ) {
          const joinedSpoken = uWord + tokenList[j + 1];
          const joinedSim = vietPhoneticSimilarity(joinedSpoken, tWord);
          if (joinedSim > bestSim) bestSim = joinedSim;
        }

        // Kiểm tra trường hợp 1 từ nói bị dính từ 2 từ mục tiêu (VD: "wakeup" / "makeup" -> "wake up")
        if (i + 1 < m) {
          const joinedTarget = tWord + normTargetWords[i + 1];
          const splitSim = vietPhoneticSimilarity(uWord, joinedTarget);
          if (splitSim >= 0.68) {
            bestSim = Math.max(bestSim, splitSim);
            matchedTargetFlags[i + 1] = true;
          }
        }
      }
      if (bestSim >= 0.9) break;
    }

    if (bestSim >= threshold) {
      matchedTargetFlags[i] = true;
    }
  }

  // Bước 2: Phục hồi thông minh các từ chức năng ngắn (a, the, to, in, is, are...) bị nối âm/nuốt âm
  // Nếu học viên đã đọc đúng các từ nội dung xung quanh, tự động điền từ chức năng nối âm đó
  const contentWordCount = normTargetWords.filter((w) => !FUNCTION_WORDS.has(w)).length;
  const matchedContentCount = normTargetWords.filter(
    (w, idx) => !FUNCTION_WORDS.has(w) && matchedTargetFlags[idx]
  ).length;
  const contentCoverage = contentWordCount > 0 ? matchedContentCount / contentWordCount : 0;

  if (contentCoverage >= 0.5) {
    for (let i = 0; i < m; i++) {
      if (matchedTargetFlags[i]) continue;
      const tWord = normTargetWords[i];
      if (FUNCTION_WORDS.has(tWord) || tWord.length <= 2) {
        const leftMatched = i === 0 || matchedTargetFlags[i - 1] || (i >= 2 && matchedTargetFlags[i - 2]);
        const rightMatched = i === m - 1 || matchedTargetFlags[i + 1] || (i + 2 < m && matchedTargetFlags[i + 2]);
        if (leftMatched && rightMatched) {
          matchedTargetFlags[i] = true;
        }
      }
    }
  }

  // Bước 3: Nếu người học đã đọc khớp >= 78% số từ trong câu (hoặc chỉ lệch 1 từ nhỏ do nối âm cuối),
  // và độ dài câu nói tương đương câu mẫu -> Snap những từ bị lệch nhẹ còn lại về câu chuẩn
  const currentMatchedCount = matchedTargetFlags.filter(Boolean).length;
  const matchRatio = m > 0 ? currentMatchedCount / m : 0;
  const lengthRatio = m > 0 ? primaryTokens.length / m : 0;

  if (matchRatio >= 0.78 && lengthRatio >= 0.65) {
    for (let i = 0; i < m; i++) {
      if (!matchedTargetFlags[i]) {
        // Kiểm tra xem có từ nào gần vị trí đó có độ giống ngữ âm >= 0.45 không
        const tWord = normTargetWords[i];
        const hasLooseMatch = candidateTokenLists.some((list) =>
          list.some((uWord) => vietPhoneticSimilarity(uWord, tWord) >= 0.44)
        );
        if (hasLooseMatch || m - currentMatchedCount <= 1) {
          matchedTargetFlags[i] = true;
        }
      }
    }
  }

  // Tạo câu transcript thông minh từ những từ mục tiêu đã khớp
  const reconstructedWords = [];
  for (let i = 0; i < m; i++) {
    if (matchedTargetFlags[i]) {
      reconstructedWords.push(rawTargetWords[i]);
    }
  }

  // Nếu người học nói một câu hoàn toàn khác (khớp < 25%), trả về câu gốc máy nghe được
  if (reconstructedWords.length === 0 || (reconstructedWords.length / m < 0.25 && m >= 4)) {
    return candidates[0];
  }

  return reconstructedWords.join(' ');
}

/**
 * Khởi chạy phiên thu âm nhận diện giọng nói thông minh (Hoạt động mượt trên cả Máy tính & Điện thoại)
 * Hỗ trợ:
 * - Bấm lần 1 để nói, tự động chốt câu khi đọc xong hoặc bấm lần 2 để dừng ngay.
 * - Thu thập 10 N-Best Alternatives và tự động khớp ngữ âm Việt-Anh với targetText.
 */
let activeRecognitionInstance = null;

export function stopActiveSpeechSession() {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.stop();
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  }
}

export function startSmartSpeechSession({
  targetText = '',
  onStart,
  onInterimResult,
  onFinalResult,
  onError,
  maxSilenceMs = 2300
}) {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!SpeechRecognition) {
    if (onError) {
      onError(
        'unsupported',
        'Trình duyệt chưa hỗ trợ thu âm giọng nói. Hãy mở bằng Google Chrome hoặc Microsoft Edge trên máy tính/điện thoại nhé!'
      );
    }
    return null;
  }

  // Dừng ngay mọi âm thanh TTS đang phát để Micro không thu nhầm tiếng loa
  speechService.stop();

  // Nếu đang có phiên thu âm cũ, dừng lại
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.abort();
    } catch {
      // ignore
    }
    activeRecognitionInstance = null;
  }

  const recognition = new SpeechRecognition();
  activeRecognitionInstance = recognition;

  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 10;
  // Trên máy tính (Desktop), continuous = true giúp không bị ngắt mic đột ngột khi nghỉ 0.5s giữa câu
  recognition.continuous = true;

  const sessionStartTime = Date.now();
  let hasSpokenAnything = false;
  let isFinalized = false;
  let silenceTimer = null;
  let autoCompleteTimer = null;
  let restartCount = 0;

  // Lưu các đoạn (segments) đã chốt, mỗi đoạn là mảng các phương án N-Best
  const finalizedSegments = [];
  let latestInterimAlternatives = [];
  let latestSmartText = '';
  let latestRawText = '';

  const clearTimers = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (autoCompleteTimer) {
      clearTimeout(autoCompleteTimer);
      autoCompleteTimer = null;
    }
  };

  // Ghép các đoạn thành danh sách các câu N-Best hoàn chỉnh
  const buildCombinedHypotheses = () => {
    const allSegments = [...finalizedSegments];
    if (latestInterimAlternatives.length > 0) {
      allSegments.push(latestInterimAlternatives);
    }
    if (allSegments.length === 0) return [];

    const maxAlt = 10;
    const hypotheses = [];
    for (let altIdx = 0; altIdx < maxAlt; altIdx++) {
      const parts = allSegments.map((seg) => seg[Math.min(altIdx, seg.length - 1)] || seg[0] || '');
      const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
      if (joined && !hypotheses.includes(joined)) {
        hypotheses.push(joined);
      }
    }
    return hypotheses;
  };

  const finishSession = () => {
    if (isFinalized) return;
    isFinalized = true;
    clearTimers();
    activeRecognitionInstance = null;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
    if (onFinalResult) {
      onFinalResult({
        smartTranscript: latestSmartText || latestRawText,
        rawTranscript: latestRawText,
        hasSpoken: hasSpokenAnything
      });
    }
  };

  const resetSilenceWatchdog = (customMs = maxSilenceMs) => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      finishSession();
    }, customMs);
  };

  recognition.onstart = () => {
    if (onStart) onStart();
    // Cho người học tối đa 7 giây để bắt đầu cất tiếng nói trên máy tính
    resetSilenceWatchdog(7000);
  };

  recognition.onresult = (event) => {
    if (isFinalized) return;
    hasSpokenAnything = true;

    // Cập nhật các đoạn đã isFinal và đoạn interim hiện tại
    finalizedSegments.length = 0;
    latestInterimAlternatives = [];

    for (let i = 0; i < event.results.length; i++) {
      const res = event.results[i];
      const alts = [];
      for (let k = 0; k < res.length; k++) {
        if (res[k]?.transcript) {
          alts.push(res[k].transcript.trim());
        }
      }
      if (res.isFinal) {
        if (alts.length > 0) finalizedSegments.push(alts);
      } else {
        if (alts.length > 0) latestInterimAlternatives = alts;
      }
    }

    const hypotheses = buildCombinedHypotheses();
    latestRawText = hypotheses[0] || '';
    latestSmartText = targetText
      ? reconstructSmartTranscript(hypotheses, targetText)
      : latestRawText;

    if (onInterimResult) {
      onInterimResult(latestSmartText, latestRawText, hypotheses);
    }

    // Kiểm tra xem người học đã đọc đủ câu mục tiêu chưa: nếu đã khớp >= 92% số từ thì tự động chốt câu sau 450ms!
    if (targetText) {
      const targetWordCount = normalizeForSpeechComparison(targetText).split(' ').filter(Boolean).length;
      const smartWordCount = normalizeForSpeechComparison(latestSmartText).split(' ').filter(Boolean).length;
      if (targetWordCount > 0 && smartWordCount / targetWordCount >= 0.92) {
        if (autoCompleteTimer) clearTimeout(autoCompleteTimer);
        autoCompleteTimer = setTimeout(() => {
          finishSession();
        }, 450);
        return;
      }
    }

    // Nếu đang nói dở câu, đặt lại bộ đếm khoảng lặng 2.3 giây
    resetSilenceWatchdog(maxSilenceMs);
  };

  recognition.onerror = (event) => {
    if (isFinalized) return;
    const errCode = event?.error || 'unknown';

    // Nếu trên máy tính người dùng chưa kịp nói trong 2-3 giây đầu và trình duyệt báo 'no-speech'
    if (errCode === 'no-speech' && !hasSpokenAnything && Date.now() - sessionStartTime < 5500 && restartCount < 1) {
      return; // Để onend tự động nối phiên
    }

    if (errCode === 'aborted') {
      return;
    }

    clearTimers();
    isFinalized = true;
    activeRecognitionInstance = null;

    if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
      if (onError) {
        onError(
          errCode,
          'Trình duyệt đang chặn quyền Micro. Bạn hãy bấm vào biểu tượng ổ khóa 🔒 cạnh thanh địa chỉ web và chọn "Cho phép (Allow)" Micro nhé!'
        );
      }
    } else if (errCode === 'audio-capture') {
      if (onError) {
        onError(
          errCode,
          'Không tìm thấy thiết bị Micro trên máy tính/điện thoại của bạn. Hãy kiểm tra kết nối tai nghe/Micro nhé!'
        );
      }
    } else if (errCode === 'no-speech') {
      if (onError) {
        onError(
          errCode,
          'Chưa nghe thấy giọng nói của bạn. Hãy bấm nút Micro và đọc to câu tiếng Anh nhé!'
        );
      }
    } else {
      if (hasSpokenAnything) {
        finishSession();
      } else if (onError) {
        onError(errCode, 'Không thu được giọng nói rõ ràng, bạn bấm Micro thử lại nhé!');
      }
    }
  };

  recognition.onend = () => {
    if (isFinalized) return;

    // Trên máy tính, nếu người dùng chưa kịp nói mà trình duyệt đã tự ngắt sớm (< 4.5s), tự động gia hạn 1 lần
    if (!hasSpokenAnything && Date.now() - sessionStartTime < 4500 && restartCount < 1) {
      restartCount += 1;
      try {
        recognition.start();
        return;
      } catch {
        // ignore
      }
    }

    finishSession();
  };

  try {
    recognition.start();
  } catch (err) {
    clearTimers();
    activeRecognitionInstance = null;
    if (onError) {
      onError('start-failed', 'Không thể khởi động Micro. Hãy thử bấm lại nhé!');
    }
  }

  return {
    stop: () => finishSession()
  };
}
