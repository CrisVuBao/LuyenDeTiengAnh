/**
 * VBaceEnglish - Studio Voice & Neural Speech Service
 * Cung cấp giọng đọc tiếng Anh tự nhiên chuẩn Studio (Microsoft Neural / Google Natural / Apple Premium)
 * Hỗ trợ đa giọng đọc phân vai theo nhân vật (Bino, Bạn nữ, Bạn nam, Trẻ em)
 */

const PREFS_STORAGE_KEY = 'vbace_speech_preferences_v1';

// Default Preferences
const defaultPreferences = {
  binoVoiceURI: '',          // Preferred voice for BINO
  femaleVoiceURI: '',        // Preferred voice for female characters (Amy, Rachel, Jazzy...)
  maleVoiceURI: '',          // Preferred voice for other male characters (Jeremy, Buddy...)
  rate: 0.95,                // 0.95x is very natural and clear for English learners
  pitch: 1.0,
  autoRoleVoices: true       // Automatically switch voices based on character name
};

class SpeechService {
  constructor() {
    this.voices = [];
    this.isLoaded = false;
    this.preferences = this.loadPreferences();
    this.activeUtterances = [];
    this.initVoices();
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        return { ...defaultPreferences, ...JSON.parse(saved) };
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
  }

  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const load = () => {
      const all = window.speechSynthesis.getVoices();
      if (all && all.length > 0) {
        this.voices = all;
        this.isLoaded = true;
      }
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  /**
   * Lấy danh sách giọng tiếng Anh được xếp hạng theo độ tự nhiên (Neural/Natural lên đầu)
   */
  async getEnglishVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];

    if (!this.isLoaded || this.voices.length === 0) {
      await new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          const all = window.speechSynthesis.getVoices();
          if ((all && all.length > 0) || attempts > 20) {
            this.voices = all || [];
            this.isLoaded = true;
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    // Filter English voices
    const enVoices = this.voices.filter(v => 
      v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB') || v.lang.includes('AU')
    );

    // Score and rank voices: Natural/Neural/Online/Premium get highest scores
    const scored = enVoices.map(voice => {
      let score = 0;
      const name = voice.name.toLowerCase();

      // Highest tier: Edge Natural / Azure Neural Online voices
      if (name.includes('natural') || name.includes('online')) score += 100;
      if (name.includes('neural')) score += 90;
      if (name.includes('premium') || name.includes('enhanced')) score += 80;
      
      // Google high quality voices
      if (name.includes('google')) score += 70;

      // Prioritize US and Aussie/UK accents
      if (voice.lang === 'en-US' || voice.lang.includes('en_US')) score += 15;
      if (voice.lang === 'en-AU' || voice.lang.includes('en_AU')) score += 12; // Bino lived in Sydney!
      if (voice.lang === 'en-GB' || voice.lang.includes('en_GB')) score += 10;

      // Penalize legacy robotic desktop synthesizers
      if (name.includes('desktop') || name.includes('sapi') || name.includes('microsoft david desktop')) {
        score -= 50;
      }

      const isFemale = name.includes('jenny') || name.includes('aria') || name.includes('michelle') ||
                       name.includes('female') || name.includes('sonia') || name.includes('samantha') ||
                       name.includes('natasha') || name.includes('zira') || name.includes('ava');

      const isMale = name.includes('guy') || name.includes('christopher') || name.includes('eric') ||
                     name.includes('male') || name.includes('david') || name.includes('mark') ||
                     name.includes('ryan') || name.includes('william') || name.includes('steffan');

      return {
        voice,
        name: voice.name,
        lang: voice.lang,
        score,
        isNatural: score >= 60,
        isFemale,
        isMale: !isFemale || isMale,
        gender: isFemale ? 'female' : 'male'
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  /**
   * Chọn giọng tối ưu nhất cho Bino (giọng nam ấm áp, tự nhiên)
   */
  async getBestBinoVoice() {
    const list = await this.getEnglishVoices();
    if (list.length === 0) return null;

    // Check user preference first
    if (this.preferences.binoVoiceURI) {
      const match = list.find(v => v.voice.voiceURI === this.preferences.binoVoiceURI);
      if (match) return match.voice;
    }

    // Auto-select top-scoring male natural voice
    // Preferred: Guy, Christopher, William, Eric, Google US English
    const naturalMale = list.find(v => 
      v.isNatural && v.gender === 'male' && 
      (v.name.toLowerCase().includes('guy') || 
       v.name.toLowerCase().includes('christopher') || 
       v.name.toLowerCase().includes('william') ||
       v.name.toLowerCase().includes('google') ||
       v.name.toLowerCase().includes('eric'))
    );
    if (naturalMale) return naturalMale.voice;

    const anyNaturalMale = list.find(v => v.isNatural && v.gender === 'male');
    if (anyNaturalMale) return anyNaturalMale.voice;

    const anyNatural = list.find(v => v.isNatural);
    if (anyNatural) return anyNatural.voice;

    return list[0]?.voice || null;
  }

  /**
   * Chọn giọng tối ưu cho nhân vật nữ (Jenny, Aria, Michelle, Google Female...)
   */
  async getBestFemaleVoice() {
    const list = await this.getEnglishVoices();
    if (list.length === 0) return null;

    if (this.preferences.femaleVoiceURI) {
      const match = list.find(v => v.voice.voiceURI === this.preferences.femaleVoiceURI);
      if (match) return match.voice;
    }

    const naturalFemale = list.find(v => 
      v.isNatural && v.gender === 'female' &&
      (v.name.toLowerCase().includes('jenny') || 
       v.name.toLowerCase().includes('aria') || 
       v.name.toLowerCase().includes('michelle') ||
       v.name.toLowerCase().includes('natasha') ||
       v.name.toLowerCase().includes('female'))
    );
    if (naturalFemale) return naturalFemale.voice;

    const anyNaturalFemale = list.find(v => v.isNatural && v.gender === 'female');
    if (anyNaturalFemale) return anyNaturalFemale.voice;

    const anyFemale = list.find(v => v.gender === 'female');
    if (anyFemale) return anyFemale.voice;

    return list[0]?.voice || null;
  }

  /**
   * Chọn giọng tối ưu cho nhân vật nam đối tác (Ryan, Eric, Steffan, Roger...)
   */
  async getBestMalePartnerVoice() {
    const list = await this.getEnglishVoices();
    if (list.length === 0) return null;

    if (this.preferences.maleVoiceURI) {
      const match = list.find(v => v.voice.voiceURI === this.preferences.maleVoiceURI);
      if (match) return match.voice;
    }

    const naturalMale = list.find(v => 
      v.isNatural && v.gender === 'male' &&
      (v.name.toLowerCase().includes('ryan') || 
       v.name.toLowerCase().includes('eric') || 
       v.name.toLowerCase().includes('steffan') ||
       v.name.toLowerCase().includes('roger') ||
       v.name.toLowerCase().includes('christopher'))
    );
    if (naturalMale) return naturalMale.voice;

    return await this.getBestBinoVoice();
  }

  /**
   * Xác định nhân vật là Nữ, Trẻ em, hay Nam để gán giọng thích hợp
   */
  detectRoleProfile(characterName = '') {
    const name = characterName.toUpperCase().trim();
    
    // Check if Bino
    if (name.includes('BINO')) {
      return { role: 'bino', isChild: false, isFemale: false };
    }

    // Check if Child / Youngster
    if (name.includes('JAZZY') || name.includes('DAUGHTER') || name.includes('CHILD') || name.includes('KID')) {
      return { role: 'child', isChild: true, isFemale: true };
    }

    // Check if Female
    const femaleNames = ['AMY', 'RACHEL', 'STEPHANIE', 'MOM', 'MOTHER', 'WIFE', 'WOMAN', 'GIRLFRIEND', 'WAITRESS', 'LADY', 'CAMERON'];
    if (femaleNames.some(f => name.includes(f))) {
      return { role: 'female', isChild: false, isFemale: true };
    }

    // Default other role: male partner (Jeremy, Buddy, Barber, Colleague, Friend, Team Leader...)
    return { role: 'male', isChild: false, isFemale: false };
  }

  /**
   * Tạo luồng âm thanh nền siêu nhẹ (Keep-Alive WAV) và trình phát HTML5 <audio>
   * Giúp iOS Safari & Android Chrome KHÔNG ngắt âm thanh khi người dùng tắt màn hình điện thoại
   */
  ensureBackgroundAudioEngine() {
    if (typeof window === 'undefined') return;

    if (!this.ttsAudio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      this.ttsAudio = audio;
    }

    if (!this.keepAliveAudio) {
      // Tạo 1 giây WAV PCM tần số siêu trầm (gần như im lặng tuyệt đối) để giữ AudioSession trên di động khi khóa màn hình
      const sampleRate = 8000;
      const numSamples = sampleRate;
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
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      for (let i = 0; i < numSamples; i++) {
        view.setInt16(44 + i * 2, i % 2 === 0 ? 1 : -1, true);
      }
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const keepAlive = new Audio(URL.createObjectURL(blob));
      keepAlive.loop = true;
      keepAlive.volume = 0.01;
      keepAlive.playsInline = true;
      keepAlive.setAttribute('playsinline', 'true');
      this.keepAliveAudio = keepAlive;
    }

    if (!this._visibilityListenerBound && typeof document !== 'undefined') {
      this._visibilityListenerBound = true;
      document.addEventListener('visibilitychange', () => {
        // Nếu người dùng vừa bấm nút nguồn tắt màn hình điện thoại khi đang đọc bằng speechSynthesis
        if (document.hidden && this.activeLineParams && !this.isStopped && !this.isUsingHtmlAudio) {
          const params = this.activeLineParams;
          if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
            window.speechSynthesis.cancel();
          }
          this.speakViaHtmlAudio(params);
        }
      });
    }
  }

  /**
   * Bật chế độ giữ phiên âm thanh liên tục trên điện thoại & cập nhật màn hình khóa (MediaSession)
   */
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
        artist: metadata.artist || 'Bino Studio AI 🎙️',
        album: metadata.album || 'VBaceEnglish Reflex Audio',
        artwork: [
          { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }
        ]
      });

      navigator.mediaSession.playbackState = 'playing';

      const h = this.mediaHandlers || {};
      navigator.mediaSession.setActionHandler('play', () => h.onPlay?.());
      navigator.mediaSession.setActionHandler('pause', () => h.onPause?.());
      navigator.mediaSession.setActionHandler('previoustrack', () => h.onPrev?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => h.onNext?.());
      navigator.mediaSession.setActionHandler('stop', () => h.onStop?.());
    } catch {
      // ignore on unsupported browsers
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

  isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  }

  /**
   * Phát câu thoại qua luồng HTML5 <audio> (/api/bino/tts)
   * Đảm bảo 100% vẫn phát liên tục khi tắt màn hình điện thoại hoặc ẩn trình duyệt
   */
  speakViaHtmlAudio({ text, speed = 0.95, onStart, onEnd, onError }) {
    this.ensureBackgroundAudioEngine();
    const audio = this.ttsAudio;
    if (!audio) {
      onError?.(new Error('Không thể khởi tạo HTML5 Audio'));
      return;
    }

    this.isUsingHtmlAudio = true;
    this.isStopped = false;

    const cleanText = (text || '').trim();
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const ttsUrl = `${baseUrl}/bino/tts?text=${encodeURIComponent(cleanText)}&tl=en`;

    let finished = false;
    let fallbackTimer = null;

    const finishUp = (cb, arg) => {
      if (finished) return;
      finished = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this.isUsingHtmlAudio = false;
      this.activeLineParams = null;
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      cb?.(arg);
    };

    const wordCount = cleanText.split(/\s+/).length;
    const maxWaitMs = Math.max(4000, ((wordCount * 750) / (speed || 0.95)) + 3500);
    fallbackTimer = setTimeout(() => {
      finishUp(onEnd);
    }, maxWaitMs);

    audio.pause();
    audio.src = ttsUrl;
    audio.playbackRate = Math.max(0.7, Math.min(1.35, speed || this.preferences.rate || 0.95));

    audio.onplay = () => onStart?.();
    audio.onended = (e) => finishUp(onEnd, e);
    audio.onerror = (err) => {
      if (this.isStopped) return;
      finishUp(onError, err);
    };

    audio.play().catch((err) => {
      if (this.isStopped) return;
      finishUp(onError, err);
    });
  }

  /**
   * Phát một câu thoại với giọng nhân vật tương ứng
   */
  async speakLine({ text, characterName = 'BINO', speed = null, onStart, onEnd, onError, forceCancel = false, metadata = null }) {
    if (typeof window === 'undefined') return;

    this.ensureBackgroundAudioEngine();
    const effectiveSpeed = speed || this.preferences.rate || 0.95;

    if (metadata) {
      this.updateMediaSession(metadata);
    }

    if (this.keepAliveAudio && this.keepAliveAudio.paused) {
      this.keepAliveAudio.play().catch(() => {});
    }

    // Lưu thông tin câu hiện tại để nếu người dùng tắt màn hình giữa chừng thì chuyển ngay sang HTML5 Audio
    this.activeLineParams = { text, characterName, speed: effectiveSpeed, onStart, onEnd, onError };

    // Nếu màn hình đang tắt (document.hidden) hoặc trình duyệt không hỗ trợ Web Speech API -> Dùng HTML5 Audio TTS
    const isScreenOff = typeof document !== 'undefined' && document.hidden;
    if (isScreenOff || !window.speechSynthesis) {
      this.speakViaHtmlAudio({ text, speed: effectiveSpeed, onStart, onEnd, onError });
      return;
    }

    if (this.ttsAudio && !this.ttsAudio.paused) {
      this.ttsAudio.pause();
    }
    this.isUsingHtmlAudio = false;

    // Chỉ cancel khi có yêu cầu dừng cưỡng bức (vd: chuyển bài thủ công, bấm từng câu)
    if (forceCancel && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }

    // Khắc phục lỗi paused ngầm của Chromium
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const profile = this.detectRoleProfile(characterName);
    let selectedVoice = null;
    let pitch = this.preferences.pitch || 1.0;

    if (profile.role === 'bino') {
      selectedVoice = await this.getBestBinoVoice();
      pitch = 1.0;
    } else if (profile.role === 'child') {
      selectedVoice = await this.getBestFemaleVoice();
      pitch = 1.25; // Higher pitch for Jazzy / kid
    } else if (profile.role === 'female') {
      selectedVoice = await this.getBestFemaleVoice();
      pitch = 1.05; // Pleasant female pitch
    } else {
      selectedVoice = await this.getBestMalePartnerVoice();
      pitch = 0.95; // Distinctive male partner tone
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice ? selectedVoice.lang : 'en-US';
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.rate = effectiveSpeed;
    utterance.pitch = pitch;

    // Chống Chromium Garbage Collection: lưu tham chiếu global & instance
    this.activeUtterances.push(utterance);
    this.currentUtterance = utterance;
    this.isStopped = false;
    if (typeof window !== 'undefined') {
      window.__vbaceUtterance = utterance;
    }

    let hasEnded = false;
    let fallbackTimer = null;

    const cleanUp = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this.activeUtterances = this.activeUtterances.filter(u => u !== utterance);
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (!this.isUsingHtmlAudio) {
        this.activeLineParams = null;
      }
    };

    const handleEnd = (e) => {
      if (hasEnded || this.isUsingHtmlAudio) return;
      hasEnded = true;
      cleanUp();
      onEnd?.(e);
    };

    const handleError = (e) => {
      if (hasEnded || this.isUsingHtmlAudio) return;
      hasEnded = true;
      cleanUp();
      if (this.isStopped) {
        return;
      }
      // Nếu Web Speech bị gián đoạn khi khóa màn hình điện thoại -> chuyển mượt sang HTML5 Audio TTS
      if (typeof document !== 'undefined' && document.hidden) {
        this.speakViaHtmlAudio({ text, speed: effectiveSpeed, onStart, onEnd, onError });
        return;
      }
      onError?.(e);
    };

    // Fallback timer an toàn: đảm bảo không bao giờ bị kẹt nếu Chromium nuốt mất sự kiện onend
    const wordCount = (text || '').trim().split(/\s+/).length;
    const estimatedDurationMs = Math.max(2500, ((wordCount * 650) / effectiveSpeed) + 2500);
    fallbackTimer = setTimeout(() => {
      if (!hasEnded && !this.isUsingHtmlAudio) {
        handleEnd();
      }
    }, estimatedDurationMs);

    if (onStart) utterance.onstart = onStart;
    utterance.onend = handleEnd;
    utterance.onerror = handleError;

    window.speechSynthesis.speak(utterance);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Phát từ vựng đơn lẻ (Flashcards / Key words) với giọng chuẩn rõ nét nhất
   */
  async speakWord(word, speed = null, onEnd) {
    if (typeof window === 'undefined') return;
    const effectiveSpeed = speed || this.preferences.rate || 0.9;

    if ((typeof document !== 'undefined' && document.hidden) || !window.speechSynthesis) {
      this.speakViaHtmlAudio({ text: word, speed: effectiveSpeed, onEnd });
      return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const voice = await this.getBestBinoVoice();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = voice ? voice.lang : 'en-US';
    if (voice) utterance.voice = voice;
    utterance.rate = effectiveSpeed;
    utterance.pitch = 1.0;

    this.activeUtterances.push(utterance);
    this.currentUtterance = utterance;

    const cleanUp = () => {
      this.activeUtterances = this.activeUtterances.filter(u => u !== utterance);
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
    };

    utterance.onend = (e) => {
      cleanUp();
      onEnd?.(e);
    };
    utterance.onerror = () => {
      cleanUp();
    };

    window.speechSynthesis.speak(utterance);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  stop(stopKeepAlive = false) {
    this.isStopped = true;
    this.activeLineParams = null;
    this.isUsingHtmlAudio = false;
    if (this.ttsAudio) {
      this.ttsAudio.onended = null;
      this.ttsAudio.onerror = null;
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

