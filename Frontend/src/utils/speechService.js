/**
 * VBaceEnglish - Studio Voice & Microsoft Edge Neural Speech Service
 * Đồng bộ 100% giọng đọc Microsoft Edge Neural Online (Natural) chuẩn người thật
 * trên MỌI trình duyệt (Chrome, Samsung Internet, Brave, Safari, Edge, Firefox - cả Điện thoại & Máy tính).
 * Hỗ trợ phân vai tự động (Bino, Nhân vật Nữ, Nhân vật Nam đối thoại, Trẻ em) + Pre-fetch Cache 0ms.
 */

const PREFS_STORAGE_KEY = 'vbace_speech_preferences_v2';

/**
 * Danh sách 16 giọng đọc Studio Neural AI tốt nhất của Microsoft Edge / Azure Cognitive Services
 * Hoạt động trên mọi trình duyệt thông qua EdgeNeuralTtsEngine
 */
export const STUDIO_NEURAL_VOICES = [
  // === GIỌNG NAM STUDIO NEURAL ===
  {
    id: 'en-US-AndrewMultilingualNeural',
    name: 'Microsoft Andrew Multilingual Online (Natural)',
    shortLabel: 'Andrew Multilingual (Mỹ - Ấm áp, Tự nhiên như người thật)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'bino'
  },
  {
    id: 'en-US-BrianMultilingualNeural',
    name: 'Microsoft Brian Multilingual Online (Natural)',
    shortLabel: 'Brian Multilingual (Mỹ - Trẻ trung, Giao tiếp đời thực)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male_partner'
  },
  {
    id: 'en-US-SteffanNeural',
    name: 'Microsoft Steffan Online (Natural)',
    shortLabel: 'Steffan Neural (Mỹ - Rõ nét, Hiện đại)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },
  {
    id: 'en-US-ChristopherNeural',
    name: 'Microsoft Christopher Online (Natural)',
    shortLabel: 'Christopher Neural (Mỹ - Trầm ấm, Chuẩn mực)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Microsoft Guy Online (Natural)',
    shortLabel: 'Guy Neural (Mỹ - Giàu cảm xúc, Tự nhiên)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },
  {
    id: 'en-US-RogerNeural',
    name: 'Microsoft Roger Online (Natural)',
    shortLabel: 'Roger Neural (Mỹ - Điềm đạm, Tròn vành rõ chữ)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },
  {
    id: 'en-AU-WilliamNeural',
    name: 'Microsoft William Online (Natural)',
    shortLabel: 'William Neural (Úc - Phong cách Sydney)',
    lang: 'en-AU',
    accent: 'Úc (AU)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Microsoft Ryan Online (Natural)',
    shortLabel: 'Ryan Neural (Anh Quốc - Lịch lãm)',
    lang: 'en-GB',
    accent: 'Anh (UK)',
    gender: 'male',
    isNatural: true,
    recommendedFor: 'male'
  },

  // === GIỌNG NỮ & TRẺ EM STUDIO NEURAL ===
  {
    id: 'en-US-AvaMultilingualNeural',
    name: 'Microsoft Ava Multilingual Online (Natural)',
    shortLabel: 'Ava Multilingual (Mỹ - Nữ Studio AI tự nhiên nhất)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-US-EmmaMultilingualNeural',
    name: 'Microsoft Emma Multilingual Online (Natural)',
    shortLabel: 'Emma Multilingual (Mỹ - Trong trẻo, Thân thiện)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Microsoft Jenny Online (Natural)',
    shortLabel: 'Jenny Neural (Mỹ - Giao tiếp phản xạ tự nhiên)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Microsoft Aria Online (Natural)',
    shortLabel: 'Aria Neural (Mỹ - Sống động, Ngữ điệu biểu cảm)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-US-MichelleNeural',
    name: 'Microsoft Michelle Online (Natural)',
    shortLabel: 'Michelle Neural (Mỹ - Nhẹ nhàng, Dễ nghe)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-AU-NatashaNeural',
    name: 'Microsoft Natasha Online (Natural)',
    shortLabel: 'Natasha Neural (Úc - Tự nhiên)',
    lang: 'en-AU',
    accent: 'Úc (AU)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Microsoft Sonia Online (Natural)',
    shortLabel: 'Sonia Neural (Anh Quốc - Sang trọng)',
    lang: 'en-GB',
    accent: 'Anh (UK)',
    gender: 'female',
    isNatural: true,
    recommendedFor: 'female'
  },
  {
    id: 'en-US-AnaNeural',
    name: 'Microsoft Ana Online (Natural) - Child Voice',
    shortLabel: 'Ana Neural (Mỹ - Giọng Trẻ Em / Bé Jazzy)',
    lang: 'en-US',
    accent: 'Mỹ (US)',
    gender: 'female',
    isChild: true,
    isNatural: true,
    recommendedFor: 'child'
  }
];

/**
 * Các mức tốc độ đọc từ rất chậm rãi (nghe kỹ từng âm) đến nhanh phản xạ
 */
export const SPEECH_SPEED_PRESETS = [
  {
    value: 0.6,
    label: '0.6x',
    shortTag: 'Rất chậm',
    desc: 'Rất chậm rãi • Nghe kỹ từng âm tiết & âm nối',
    isSlow: true
  },
  {
    value: 0.75,
    label: '0.75x',
    shortTag: 'Chậm rãi',
    desc: 'Chậm rãi • Lý tưởng khi mới nghe bài lần đầu',
    isSlow: true
  },
  {
    value: 0.85,
    label: '0.85x',
    shortTag: 'Hơi chậm',
    desc: 'Hơi chậm • Dễ bắt nhịp & tập nhại theo (Shadowing)',
    isSlow: true
  },
  {
    value: 0.95,
    label: '0.95x',
    shortTag: 'Tự nhiên',
    desc: 'Tự nhiên • Rõ chữ, chuẩn ngữ điệu khuyên dùng',
    isSlow: false
  },
  {
    value: 1.0,
    label: '1.0x',
    shortTag: 'Bản xứ',
    desc: 'Bản xứ • Tốc độ giao tiếp đời thực',
    isSlow: false
  },
  {
    value: 1.15,
    label: '1.15x',
    shortTag: 'Nhanh',
    desc: 'Nhanh • Thử thách phản xạ nghe nâng cao',
    isSlow: false
  }
];

const defaultPreferences = {
  binoVoiceURI: 'en-US-AndrewMultilingualNeural',
  femaleVoiceURI: 'en-US-AvaMultilingualNeural',
  maleVoiceURI: 'en-US-BrianMultilingualNeural',
  childVoiceURI: 'en-US-AnaNeural',
  rate: 0.95,
  pitch: 1.0,
  autoRoleVoices: true
};

class SpeechService {
  constructor() {
    this.preferences = this.loadPreferences();
    this.audioBlobCache = new Map();
    this.inflightFetches = new Map();
    this.activeUtterances = [];
    this.playToken = 0;
    this.rateListeners = new Set();
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Đảm bảo mã giọng luôn thuộc chuẩn Neural nếu dữ liệu cũ lưu tên giọng local
        const validIds = new Set(STUDIO_NEURAL_VOICES.map((v) => v.id));
        const parsedRate = parseFloat(parsed.rate);
        return {
          ...defaultPreferences,
          ...parsed,
          rate: !Number.isNaN(parsedRate) && parsedRate >= 0.5 && parsedRate <= 1.5
            ? parsedRate
            : defaultPreferences.rate,
          binoVoiceURI: validIds.has(parsed.binoVoiceURI)
            ? parsed.binoVoiceURI
            : defaultPreferences.binoVoiceURI,
          femaleVoiceURI: validIds.has(parsed.femaleVoiceURI)
            ? parsed.femaleVoiceURI
            : defaultPreferences.femaleVoiceURI,
          maleVoiceURI: validIds.has(parsed.maleVoiceURI)
            ? parsed.maleVoiceURI
            : defaultPreferences.maleVoiceURI
        };
      }
    } catch {
      // ignore
    }
    return { ...defaultPreferences };
  }

  savePreferences(newPrefs) {
    this.preferences = { ...this.preferences, ...newPrefs };
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch {
      // ignore
    }
    if (newPrefs.rate !== undefined) {
      this.applyLivePlaybackRate(newPrefs.rate);
      this.notifyRateListeners(newPrefs.rate);
    }
  }

  /**
   * Lấy tốc độ đọc ưu tiên hiện tại của người dùng
   */
  getPreferredSpeed() {
    return this.preferences?.rate || 0.95;
  }

  /**
   * Đổi tốc độ đọc ngay lập tức (kể cả khi đang phát giữa câu) và đồng bộ toàn hệ thống
   */
  setLiveSpeed(newRate) {
    const clamped = Math.max(0.5, Math.min(1.5, parseFloat(newRate) || 0.95));
    this.savePreferences({ rate: clamped });
    return clamped;
  }

  applyLivePlaybackRate(rate) {
    const clamped = Math.max(0.5, Math.min(1.5, parseFloat(rate) || 0.95));
    if (this.ttsAudio) {
      try {
        this.ttsAudio.preservesPitch = true;
        this.ttsAudio.mozPreservesPitch = true;
        this.ttsAudio.webkitPreservesPitch = true;
        this.ttsAudio.playbackRate = clamped;
      } catch {
        // ignore
      }
    }
  }

  subscribeRateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.rateListeners.add(listener);
    return () => this.rateListeners.delete(listener);
  }

  notifyRateListeners(newRate) {
    this.rateListeners.forEach((fn) => {
      try {
        fn(newRate);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Trả về danh sách 16 giọng đọc Studio Neural AI chuẩn Microsoft Edge
   * Hoạt động đồng nhất trên mọi trình duyệt (Chrome, Samsung Browser, Brave, Safari, Edge...)
   */
  async getEnglishVoices() {
    return STUDIO_NEURAL_VOICES.map((item) => ({
      voice: {
        voiceURI: item.id,
        name: item.name,
        lang: item.lang
      },
      id: item.id,
      name: item.shortLabel,
      fullName: item.name,
      lang: item.lang,
      accent: item.accent,
      score: 100,
      isNatural: true,
      isFemale: item.gender === 'female',
      isMale: item.gender === 'male',
      isChild: !!item.isChild,
      gender: item.gender
    }));
  }

  async getBestBinoVoice() {
    const id = this.preferences.binoVoiceURI || defaultPreferences.binoVoiceURI;
    const found = STUDIO_NEURAL_VOICES.find((v) => v.id === id) || STUDIO_NEURAL_VOICES[0];
    return { voiceURI: found.id, name: found.name, lang: found.lang };
  }

  async getBestFemaleVoice() {
    const id = this.preferences.femaleVoiceURI || defaultPreferences.femaleVoiceURI;
    const found = STUDIO_NEURAL_VOICES.find((v) => v.id === id) || STUDIO_NEURAL_VOICES[8];
    return { voiceURI: found.id, name: found.name, lang: found.lang };
  }

  async getBestMalePartnerVoice() {
    let id = this.preferences.maleVoiceURI || defaultPreferences.maleVoiceURI;
    if (id === this.preferences.binoVoiceURI) {
      id =
        this.preferences.binoVoiceURI === 'en-US-BrianMultilingualNeural'
          ? 'en-US-AndrewMultilingualNeural'
          : 'en-US-BrianMultilingualNeural';
    }
    const found = STUDIO_NEURAL_VOICES.find((v) => v.id === id) || STUDIO_NEURAL_VOICES[1];
    return { voiceURI: found.id, name: found.name, lang: found.lang };
  }

  /**
   * Xác định nhân vật là Bino, Nữ, Trẻ em hay Nam đối tác để gán giọng Studio Neural tương ứng
   */
  detectRoleProfile(characterName = '') {
    const name = (characterName || '').toUpperCase().trim();

    if (!name || name.includes('BINO')) {
      return { role: 'bino', isChild: false, isFemale: false };
    }

    if (
      name.includes('JAZZY') ||
      name.includes('DAUGHTER') ||
      name.includes('CHILD') ||
      name.includes('KID') ||
      name.includes('LITTLE GIRL')
    ) {
      return { role: 'child', isChild: true, isFemale: true };
    }

    const femaleNames = [
      'AMY',
      'RACHEL',
      'STEPHANIE',
      'MOM',
      'MOTHER',
      'WIFE',
      'WOMAN',
      'GIRL',
      'WAITRESS',
      'LADY',
      'CAMERON',
      'SARAH',
      'EMILY',
      'LISA',
      'ANNA',
      'JESSICA',
      'SISTER',
      'AUNT',
      'GRANDMA',
      'GRANDMOTHER',
      'NURSE',
      'RECEPTIONIST',
      'CASHIER',
      'HOSTESS',
      'FLIGHT ATTENDANT'
    ];
    if (femaleNames.some((f) => name.includes(f))) {
      return { role: 'female', isChild: false, isFemale: true };
    }

    return { role: 'male', isChild: false, isFemale: false };
  }

  /**
   * Chọn mã giọng đọc Neural tương ứng với nhân vật
   */
  resolveNeuralVoiceId(characterName = 'BINO', explicitVoiceURI = null) {
    if (explicitVoiceURI && explicitVoiceURI.endsWith('Neural')) {
      return explicitVoiceURI;
    }

    const profile = this.detectRoleProfile(characterName);
    if (profile.role === 'bino') {
      return this.preferences.binoVoiceURI || defaultPreferences.binoVoiceURI;
    }
    if (profile.role === 'child') {
      return this.preferences.childVoiceURI || defaultPreferences.childVoiceURI;
    }
    if (profile.role === 'female') {
      return this.preferences.femaleVoiceURI || defaultPreferences.femaleVoiceURI;
    }

    let partnerMale = this.preferences.maleVoiceURI || defaultPreferences.maleVoiceURI;
    if (partnerMale === (this.preferences.binoVoiceURI || defaultPreferences.binoVoiceURI)) {
      partnerMale =
        partnerMale === 'en-US-BrianMultilingualNeural'
          ? 'en-US-AndrewMultilingualNeural'
          : 'en-US-BrianMultilingualNeural';
    }
    return partnerMale;
  }

  /**
   * Tạo URL API TTS cho câu thoại & giọng đọc cụ thể kèm tốc độ AI chuẩn
   */
  buildTtsApiUrl(text, voiceId, rateParam = '+0%') {
    const cleanText = (text || '').trim();
    const safeVoice = voiceId || defaultPreferences.binoVoiceURI;
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/bino/tts?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(safeVoice)}&rate=${encodeURIComponent(rateParam)}`;
  }

  /**
   * Tải trước (Pre-fetch) âm thanh Studio Neural vào bộ nhớ đệm Blob URL
   * Giúp chuyển câu hội thoại phát ngay lập tức (0ms delay) với chất lượng Studio 96kbps
   */
  async prefetchAudioBlobUrl(text, voiceId, rateParam = '+0%') {
    const cleanText = (text || '').trim();
    if (!cleanText) return null;

    const safeVoice = voiceId || defaultPreferences.binoVoiceURI;
    const cacheKey = `${safeVoice}|${rateParam}|${cleanText}`;

    if (this.audioBlobCache.has(cacheKey)) {
      return this.audioBlobCache.get(cacheKey);
    }

    if (this.inflightFetches.has(cacheKey)) {
      return this.inflightFetches.get(cacheKey);
    }

    const url = this.buildTtsApiUrl(cleanText, safeVoice, rateParam);
    const promise = fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const blob = await res.blob();
        if (!blob || blob.size < 200) throw new Error('Empty TTS audio blob');
        const blobUrl = URL.createObjectURL(blob);

        // Giới hạn tối đa 250 câu trong RAM để tiết kiệm bộ nhớ
        if (this.audioBlobCache.size >= 250) {
          const oldestKey = this.audioBlobCache.keys().next().value;
          const oldUrl = this.audioBlobCache.get(oldestKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          this.audioBlobCache.delete(oldestKey);
        }

        this.audioBlobCache.set(cacheKey, blobUrl);
        return blobUrl;
      })
      .finally(() => {
        this.inflightFetches.delete(cacheKey);
      });

    this.inflightFetches.set(cacheKey, promise);
    return promise;
  }

  /**
   * Tải trước danh sách các câu thoại trong bài học để phát liền mạch 0ms
   */
  preloadDialogueLines(lines = [], startIndex = 0, count = 4) {
    if (!Array.isArray(lines) || lines.length === 0) return;
    const effectiveRate = this.preferences.rate || 0.95;
    const percent = Math.round((effectiveRate - 1.0) * 100);
    const rateParam = percent >= 0 ? `+${percent}%` : `${percent}%`;
    const slice = lines.slice(startIndex, startIndex + count);
    slice.forEach((line) => {
      if (!line?.englishText) return;
      const voiceId = this.resolveNeuralVoiceId(line.characterName);
      this.prefetchAudioBlobUrl(line.englishText, voiceId, rateParam).catch(() => {});
    });
  }

  /**
   * Khởi tạo trình phát HTML5 <audio> chuẩn âm lượng tối đa và luồng chạy ngầm 44.1kHz thuần im lặng
   * Loại bỏ hoàn toàn tạp âm 8000Hz gây hạ âm lượng và bẹt tiếng trên loa điện thoại
   */
  ensureBackgroundAudioEngine() {
    if (typeof window === 'undefined') return;

    if (!this.ttsAudio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 1.0;
      audio.playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      this.ttsAudio = audio;
    }

    if (!this.keepAliveAudio) {
      // Dùng chuẩn 44,100 Hz chuẩn đa phương tiện CD và 100% im lặng (all zeroes)
      // Tuyệt đối không dùng 8000 Hz hay sóng vuông vì sẽ làm điện thoại tưởng đang gọi điện thoại (Voice Call SCO)
      const sampleRate = 44100;
      const numSamples = sampleRate; // 1 giây im lặng chuẩn
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);
      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      // Ghi toàn bộ là 0 (Im lặng hoàn toàn 100%, không phát sinh tần số rè hay nhiễu)
      for (let i = 0; i < numSamples; i++) {
        view.setInt16(44 + i * 2, 0, true);
      }
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const keepAlive = new Audio(URL.createObjectURL(blob));
      keepAlive.loop = true;
      keepAlive.volume = 0.0001;
      keepAlive.playsInline = true;
      keepAlive.setAttribute('playsinline', 'true');
      this.keepAliveAudio = keepAlive;
    }
  }

  startBackgroundSession(metadata = {}, handlers = {}) {
    this.ensureBackgroundAudioEngine();
    this.mediaHandlers = { ...this.mediaHandlers, ...handlers };

    if (this.keepAliveAudio && this.keepAliveAudio.paused) {
      this.keepAliveAudio.play().catch(() => {});
    }

    this.updateMediaSession(metadata);
    this.requestWakeLock();
  }

  updateMediaSession(metadata = {}) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: metadata.title || 'Chém Tiếng Anh Không Cần Động Não',
        artist: metadata.artist || 'Bino Studio Neural AI 🎙️',
        album: metadata.album || 'VBaceEnglish Reflex Audio',
        artwork: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }]
      });

      navigator.mediaSession.playbackState = 'playing';

      const h = this.mediaHandlers || {};
      navigator.mediaSession.setActionHandler('play', () => h.onPlay?.());
      navigator.mediaSession.setActionHandler('pause', () => h.onPause?.());
      navigator.mediaSession.setActionHandler('previoustrack', () => h.onPrev?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => h.onNext?.());
      navigator.mediaSession.setActionHandler('stop', () => h.onStop?.());
    } catch {
      // ignore
    }
  }

  async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      } catch {
        // ignore
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Phát giọng đọc Studio Neural AI qua HTML5 <audio> trên MỌI trình duyệt
   */
  async speakViaNeuralStudioAudio({
    text,
    voiceId,
    speed = 0.95,
    token,
    onStart,
    onEnd,
    onError
  }) {
    this.ensureBackgroundAudioEngine();
    const audio = this.ttsAudio;
    if (!audio) {
      this.fallbackBrowserSpeak({ text, speed, onStart, onEnd, onError });
      return;
    }

    const cleanText = (text || '').trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.isUsingHtmlAudio = true;
    this.isStopped = false;

    let finished = false;
    let fallbackTimer = null;

    const finishUp = (cb, arg) => {
      if (finished) return;
      finished = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (this.playToken === token) {
        this.isUsingHtmlAudio = false;
        this.activeLineParams = null;
        audio.onended = null;
        audio.onerror = null;
        audio.onplay = null;
      }
      cb?.(arg);
    };

    try {
      // Chuyển đổi tốc độ số sang chuẩn rate của Edge Neural TTS (+0%, -25%, -40%,...)
      // Giúp âm thanh được AI tính toán tổng hợp tự nhiên ở đúng nhịp độ,
      // hoàn toàn không cần điện thoại chạy bộ time-stretch (vốn gây tiếng bẹt, nghẹt, biến dạng và sụt âm lượng trên mobile)
      const effectiveRate = Math.max(0.5, Math.min(1.5, speed || this.preferences.rate || 0.95));
      const percent = Math.round((effectiveRate - 1.0) * 100);
      const rateParam = percent >= 0 ? `+${percent}%` : `${percent}%`;

      // Ưu tiên lấy từ Blob Cache (0ms) hoặc tải stream từ EdgeNeuralTtsEngine
      let srcUrl = null;
      try {
        srcUrl = await this.prefetchAudioBlobUrl(cleanText, voiceId, rateParam);
      } catch {
        srcUrl = this.buildTtsApiUrl(cleanText, voiceId, rateParam);
      }

      if (this.isStopped || this.playToken !== token) return;

      const wordCount = cleanText.split(/\s+/).length;
      const maxWaitMs = Math.max(6000, (wordCount * 1100) / effectiveRate + 6000);
      fallbackTimer = setTimeout(() => {
        finishUp(onEnd);
      }, maxWaitMs);

      audio.pause();
      audio.src = srcUrl;
      audio.volume = 1.0;
      // Phát trực tiếp 1.0x vì âm thanh đã chuẩn tốc độ AI ngay từ backend!
      // Loại bỏ hoàn toàn pitch-stretching trên di động
      audio.playbackRate = 1.0;

      audio.onplay = () => {
        if (this.playToken === token) onStart?.();
      };
      audio.onended = (e) => {
        if (this.playToken === token) finishUp(onEnd, e);
      };
      audio.onerror = () => {
        if (this.isStopped || this.playToken !== token) return;
        finishUp(() => {
          this.fallbackBrowserSpeak({ text: cleanText, speed, onStart, onEnd, onError });
        });
      };

      await audio.play();
    } catch (err) {
      if (this.isStopped || this.playToken !== token) return;
      finishUp(() => {
        this.fallbackBrowserSpeak({ text: cleanText, speed, onStart, onEnd, onError });
      }, err);
    }
  }

  /**
   * Dự phòng trường hợp mất kết nối mạng hoàn toàn
   */
  fallbackBrowserSpeak({ text, speed = 0.95, onStart, onEnd, onError }) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onError?.(new Error('Không hỗ trợ tổng hợp giọng nói'));
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speed || 0.95;
      if (onStart) utterance.onstart = onStart;
      utterance.onend = (e) => onEnd?.(e);
      utterance.onerror = (e) => onError?.(e);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      onError?.(e);
    }
  }

  /**
   * Phát một câu thoại với giọng Studio Neural AI của nhân vật tương ứng
   */
  async speakLine({
    text,
    characterName = 'BINO',
    voiceURI = null,
    speed = null,
    onStart,
    onEnd,
    onError,
    forceCancel = false,
    metadata = null
  }) {
    if (typeof window === 'undefined') return;

    this.ensureBackgroundAudioEngine();
    const effectiveSpeed = speed || this.preferences.rate || 0.95;

    if (metadata) {
      this.updateMediaSession(metadata);
    }

    if (this.keepAliveAudio && this.keepAliveAudio.paused) {
      this.keepAliveAudio.play().catch(() => {});
    }

    if (forceCancel && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const currentToken = ++this.playToken;
    const voiceId = this.resolveNeuralVoiceId(characterName, voiceURI);

    this.activeLineParams = {
      text,
      characterName,
      voiceId,
      speed: effectiveSpeed,
      onStart,
      onEnd,
      onError
    };

    await this.speakViaNeuralStudioAudio({
      text,
      voiceId,
      speed: effectiveSpeed,
      token: currentToken,
      onStart,
      onEnd,
      onError
    });
  }

  /**
   * Phát bất kỳ câu tiếng Anh hoặc cụm từ nào với giọng Studio Neural AI
   * Hỗ trợ cả cú pháp speak(text, { rate, speed, speakerIndex, characterName, voiceURI, onStart, onEnd, onError })
   * lẫn speak(text, speedNumber, onEndCallback)
   */
  async speak(text, optionsOrSpeed = {}, maybeOnEnd = null) {
    if (typeof window === 'undefined' || !text) {
      if (typeof maybeOnEnd === 'function') maybeOnEnd();
      return;
    }

    let opts = {};
    if (typeof optionsOrSpeed === 'number') {
      opts = { speed: optionsOrSpeed, onEnd: maybeOnEnd };
    } else if (optionsOrSpeed && typeof optionsOrSpeed === 'object') {
      opts = optionsOrSpeed;
    }

    const effectiveSpeed = opts.speed || opts.rate || this.preferences.rate || 0.95;
    let characterName = opts.characterName || 'BINO';
    if (!opts.characterName && typeof opts.speakerIndex === 'number') {
      characterName = opts.speakerIndex % 2 === 1 ? 'AMY' : 'BINO';
    }

    await this.speakLine({
      text,
      characterName,
      voiceURI: opts.voiceURI || null,
      speed: effectiveSpeed,
      onStart: opts.onStart,
      onEnd: opts.onEnd || maybeOnEnd,
      onError: opts.onError,
      forceCancel: true,
      metadata: opts.metadata || null
    });
  }

  /**
   * Tải trước (Pre-fetch) các câu phản xạ trong danh sách để khi bấm Nghe hoặc Phát Liên Tục đạt độ trễ 0ms
   */
  preloadReflexSentences(sentences = [], startIndex = 0, count = 5) {
    if (!Array.isArray(sentences) || sentences.length === 0) return;
    const effectiveRate = this.preferences.rate || 0.95;
    const percent = Math.round((effectiveRate - 1.0) * 100);
    const rateParam = percent >= 0 ? `+${percent}%` : `${percent}%`;
    const slice = sentences.slice(startIndex, startIndex + count);
    slice.forEach((item) => {
      const enText = typeof item === 'string' ? item : item?.en;
      if (!enText) return;
      const num = typeof item === 'object' && typeof item?.number === 'number' ? item.number : 0;
      const charName = num % 2 === 1 ? 'AMY' : 'BINO';
      const voiceId = this.resolveNeuralVoiceId(charName);
      this.prefetchAudioBlobUrl(enText, voiceId, rateParam).catch(() => {});
    });
  }

  /**
   * Phát từ vựng đơn lẻ hoặc câu mẫu mở rộng với giọng Studio Neural AI của Bino
   */
  async speakWord(word, speed = null, onEnd) {
    if (typeof window === 'undefined' || !word) return;
    const effectiveSpeed = speed || this.preferences.rate || 0.95;
    const currentToken = ++this.playToken;
    const voiceId = this.preferences.binoVoiceURI || defaultPreferences.binoVoiceURI;

    await this.speakViaNeuralStudioAudio({
      text: word,
      voiceId,
      speed: effectiveSpeed,
      token: currentToken,
      onEnd
    });
  }

  stop(stopKeepAlive = false) {
    this.isStopped = true;
    this.playToken += 1;
    this.activeLineParams = null;
    this.isUsingHtmlAudio = false;
    if (this.ttsAudio) {
      this.ttsAudio.onended = null;
      this.ttsAudio.onerror = null;
      this.ttsAudio.onplay = null;
      this.ttsAudio.pause();
    }
    if (stopKeepAlive && this.keepAliveAudio) {
      this.keepAliveAudio.pause();
      this.releaseWakeLock();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch {
          // ignore
        }
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.currentUtterance = null;
      if (window.__vbaceUtterance) window.__vbaceUtterance = null;
      window.speechSynthesis.cancel();
      this.activeUtterances = [];
    }
  }
}

const speechService = new SpeechService();
export default speechService;
