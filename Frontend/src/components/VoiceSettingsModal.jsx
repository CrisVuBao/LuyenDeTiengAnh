import React, { useState, useEffect } from 'react';
import { Volume2, Play, Check, Sparkles, X, User, Users, Sliders } from 'lucide-react';
import speechService from '../utils/speechService';
import toast from 'react-hot-toast';

export default function VoiceSettingsModal({ isOpen, onClose }) {
  const [voices, setVoices] = useState([]);
  const [binoVoiceURI, setBinoVoiceURI] = useState('en-US-AndrewMultilingualNeural');
  const [femaleVoiceURI, setFemaleVoiceURI] = useState('en-US-AvaMultilingualNeural');
  const [maleVoiceURI, setMaleVoiceURI] = useState('en-US-BrianMultilingualNeural');
  const [rate, setRate] = useState(0.95);
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    speechService.getEnglishVoices().then((list) => {
      setVoices(list);
      const prefs = speechService.preferences;
      setRate(prefs.rate || 0.95);
      setBinoVoiceURI(prefs.binoVoiceURI || 'en-US-AndrewMultilingualNeural');
      setFemaleVoiceURI(prefs.femaleVoiceURI || 'en-US-AvaMultilingualNeural');
      setMaleVoiceURI(prefs.maleVoiceURI || 'en-US-BrianMultilingualNeural');
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    speechService.savePreferences({
      binoVoiceURI,
      femaleVoiceURI,
      maleVoiceURI,
      rate: parseFloat(rate)
    });
    toast.success('Đã lưu cài đặt giọng đọc Studio Neural AI! 🎙️');
    onClose();
  };

  const handlePreviewBino = () => {
    setPreviewing('bino');
    speechService.speakLine({
      text: "Hey mate! I'm Bino. Welcome to natural English conversation!",
      characterName: 'BINO',
      voiceURI: binoVoiceURI,
      speed: rate,
      forceCancel: true,
      onEnd: () => setPreviewing(null),
      onError: () => setPreviewing(null)
    });
  };

  const handlePreviewFemale = () => {
    setPreviewing('female');
    speechService.speakLine({
      text: 'Hi there! Nice to meet you. How is your English learning journey going so far?',
      characterName: 'AMY',
      voiceURI: femaleVoiceURI,
      speed: rate,
      forceCancel: true,
      onEnd: () => setPreviewing(null),
      onError: () => setPreviewing(null)
    });
  };

  const handlePreviewMalePartner = () => {
    setPreviewing('male');
    speechService.speakLine({
      text: "Sounds awesome! Let's grab a coffee and practice speaking together.",
      characterName: 'JEREMY',
      voiceURI: maleVoiceURI,
      speed: rate,
      forceCancel: true,
      onEnd: () => setPreviewing(null),
      onError: () => setPreviewing(null)
    });
  };

  const maleVoices = voices.filter((v) => v.gender === 'male');
  const femaleVoices = voices.filter((v) => v.gender === 'female');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Giọng Đọc Studio Neural AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chuẩn giọng người thật Microsoft Edge Neural trên mọi trình duyệt
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status badge */}
          <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/15 text-[#0071e3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Volume2 size={18} />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <span className="font-bold text-[#0071e3] dark:text-blue-400">
                Microsoft Edge Neural Studio Engine:{' '}
              </span>
              <span>
                Đã kích hoạt <strong>{voices.length} giọng đọc AI người thật</strong> đồng nhất trên
                Chrome, Samsung Browser, Brave, Safari & Edge.
              </span>
            </div>
          </div>

          {/* 1. Giọng Bino (Nam chính) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={14} className="text-[#0071e3]" />
                <span>Giọng Đọc BINO (Nam Chính):</span>
              </label>
              <button
                type="button"
                onClick={handlePreviewBino}
                disabled={previewing === 'bino'}
                className="text-xs font-bold text-[#0071e3] dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Play size={12} />
                <span>{previewing === 'bino' ? 'Đang phát thử...' : 'Nghe thử giọng Bino'}</span>
              </button>
            </div>
            <select
              value={binoVoiceURI}
              onChange={(e) => setBinoVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#0071e3] outline-none"
            >
              <optgroup label="Giọng Nam Studio Neural (Khuyên dùng cho Bino)">
                {maleVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    ⭐ {v.name} 👨
                  </option>
                ))}
              </optgroup>
              <optgroup label="Giọng Nữ Studio Neural">
                {femaleVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    ⭐ {v.name} 👩
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 2. Giọng Nữ (Amy / Rachel / Stephanie...) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User size={14} className="text-pink-500" />
                <span>Giọng Nhân Vật Nữ (Amy, Rachel, Stephanie...):</span>
              </label>
              <button
                type="button"
                onClick={handlePreviewFemale}
                disabled={previewing === 'female'}
                className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
              >
                <Play size={12} />
                <span>{previewing === 'female' ? 'Đang phát thử...' : 'Nghe thử giọng Nữ'}</span>
              </button>
            </div>
            <select
              value={femaleVoiceURI}
              onChange={(e) => setFemaleVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-pink-400 outline-none"
            >
              <optgroup label="Giọng Nữ Studio Neural (Khuyên dùng)">
                {femaleVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    ⭐ {v.name} {v.isChild ? '👧' : '👩'}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Giọng Nam Studio Neural">
                {maleVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    ⭐ {v.name} 👨
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 3. Giọng Nam Đối Thoại (Jeremy / Buddy / Barber...) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-500" />
                <span>Giọng Bạn Nam Đối Thoại (Jeremy, Buddy...):</span>
              </label>
              <button
                type="button"
                onClick={handlePreviewMalePartner}
                disabled={previewing === 'male'}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Play size={12} />
                <span>{previewing === 'male' ? 'Đang phát thử...' : 'Nghe thử giọng Bạn nam'}</span>
              </button>
            </div>
            <select
              value={maleVoiceURI}
              onChange={(e) => setMaleVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-400 outline-none"
            >
              <optgroup label="Giọng Nam Đối Thoại Studio Neural">
                {maleVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    ⭐ {v.name} 👨
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. Tốc độ đọc */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders size={14} className="text-[#0071e3]" />
                <span>Tốc độ đọc mặc định:</span>
              </span>
              <span className="text-[#0071e3] dark:text-blue-400 font-extrabold">{rate}x</span>
            </div>
            <div className="flex items-center gap-2.5">
              {[0.8, 0.9, 0.95, 1.0, 1.1].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    Math.abs(rate - r) < 0.01
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              * Mức 0.95x là tốc độ lý tưởng nhất: vừa giữ nguyên ngữ điệu tự nhiên của người bản xứ, vừa phát âm rõ chữ.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check size={14} />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
