import React, { useState, useEffect } from 'react';
import { Volume2, Settings, Play, Check, Sparkles, X, User, Sliders } from 'lucide-react';
import speechService from '../utils/speechService';
import toast from 'react-hot-toast';

export default function VoiceSettingsModal({ isOpen, onClose }) {
  const [voices, setVoices] = useState([]);
  const [binoVoiceURI, setBinoVoiceURI] = useState('');
  const [femaleVoiceURI, setFemaleVoiceURI] = useState('');
  const [rate, setRate] = useState(0.95);
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    speechService.getEnglishVoices().then((list) => {
      setVoices(list);
      const prefs = speechService.preferences;
      setRate(prefs.rate || 0.95);

      if (prefs.binoVoiceURI) {
        setBinoVoiceURI(prefs.binoVoiceURI);
      } else {
        speechService.getBestBinoVoice().then(v => {
          if (v) setBinoVoiceURI(v.voiceURI);
        });
      }

      if (prefs.femaleVoiceURI) {
        setFemaleVoiceURI(prefs.femaleVoiceURI);
      } else {
        speechService.getBestFemaleVoice().then(v => {
          if (v) setFemaleVoiceURI(v.voiceURI);
        });
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    speechService.savePreferences({
      binoVoiceURI,
      femaleVoiceURI,
      rate: parseFloat(rate)
    });
    toast.success('Đã lưu cài đặt giọng đọc thành công! 🎙️');
    onClose();
  };

  const handlePreviewBino = () => {
    setPreviewing('bino');
    speechService.speakLine({
      text: "Hey mate! I'm Bino. Welcome to natural English conversation!",
      characterName: 'BINO',
      speed: rate,
      forceCancel: true,
      onEnd: () => setPreviewing(null),
      onError: () => setPreviewing(null)
    });
  };

  const handlePreviewFemale = () => {
    setPreviewing('female');
    speechService.speakLine({
      text: "Hi there! Nice to meet you. How is your English learning journey going so far?",
      characterName: 'AMY',
      speed: rate,
      forceCancel: true,
      onEnd: () => setPreviewing(null),
      onError: () => setPreviewing(null)
    });
  };

  const naturalCount = voices.filter(v => v.isNatural).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Cài Đặt Giọng Đọc AI Tự Nhiên
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tùy chỉnh giọng đọc chuẩn Studio cho bài học và kịch bản thoại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Status badge */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 size={18} />
            </div>
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">Động cơ giọng đọc: </span>
              {naturalCount > 0 ? (
                <span>Đã phát hiện <strong>{naturalCount} giọng đọc Studio Neural</strong> tự nhiên từ trình duyệt của bạn (Microsoft / Google AI).</span>
              ) : (
                <span>Đang sử dụng bộ tổng hợp giọng nói tiếng Anh tiêu chuẩn.</span>
              )}
            </div>
          </div>

          {/* 1. Giọng Bino (Nam) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={14} className="text-orange-500" />
                <span>Giọng Đọc BINO (Giọng Nam Tự Nhiên):</span>
              </label>
              <button
                type="button"
                onClick={handlePreviewBino}
                disabled={previewing === 'bino'}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Play size={12} />
                <span>{previewing === 'bino' ? 'Đang đọc...' : 'Nghe thử'}</span>
              </button>
            </div>
            <select
              value={binoVoiceURI}
              onChange={(e) => setBinoVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-400 outline-none"
            >
              {voices.map(v => (
                <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                  {v.isNatural ? '⭐ ' : ''}{v.name} ({v.lang}) {v.gender === 'female' ? '👩' : '👨'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Giọng Nữ (Bạn bè / Amy / Rachel / Jazzy) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={14} className="text-blue-500" />
                <span>Giọng Nhân Vật Nữ & Bạn Bè (Amy, Rachel, Jazzy...):</span>
              </label>
              <button
                type="button"
                onClick={handlePreviewFemale}
                disabled={previewing === 'female'}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Play size={12} />
                <span>{previewing === 'female' ? 'Đang đọc...' : 'Nghe thử'}</span>
              </button>
            </div>
            <select
              value={femaleVoiceURI}
              onChange={(e) => setFemaleVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {voices.map(v => (
                <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                  {v.isNatural ? '⭐ ' : ''}{v.name} ({v.lang}) {v.gender === 'female' ? '👩' : '👨'}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Tốc độ đọc */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-500" />
                <span>Tốc độ đọc mặc định:</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">{rate}x</span>
            </div>
            <div className="flex items-center gap-3">
              {[0.8, 0.9, 0.95, 1.0, 1.1].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    Math.abs(rate - r) < 0.01
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              * Mức 0.95x là tốc độ lý tưởng nhất: vừa chuẩn tự nhiên của người bản xứ, vừa phát âm tròn vành rõ chữ cho người học.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check size={14} />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
