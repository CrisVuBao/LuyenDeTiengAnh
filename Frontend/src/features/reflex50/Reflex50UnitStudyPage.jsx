import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, PenTool, Mic, Headphones, Layers,
  Volume2, Play, Pause, CheckCircle2, Star, Eye, EyeOff, Sparkles,
  RotateCcw, Check, HelpCircle, FileText, Gauge, Zap, Award, ChevronLeft, ChevronRight
} from 'lucide-react';
import reflex50Data from './data/reflex50Data.json';
import useReflex50Store, { evaluateSentenceAttempt } from './store/useReflex50Store';
import Reflex50MethodGuideModal from './components/Reflex50MethodGuideModal';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

const SPEED_OPTIONS = [
  { rate: 0.6, label: '0.6x', title: 'Rất chậm (Nghe rõ từng âm tiết)', isSlow: true },
  { rate: 0.75, label: '0.75x', title: 'Chậm rãi (Khuyên dùng khi mới nghe)', isSlow: true },
  { rate: 0.85, label: '0.85x', title: 'Hơi chậm', isSlow: true },
  { rate: 0.95, label: '0.95x', title: 'Tự nhiên', isSlow: false },
  { rate: 1.0, label: '1.0x', title: 'Bản xứ', isSlow: false },
  { rate: 1.15, label: '1.15x', title: 'Nhanh', isSlow: false }
];

// Tạo danh sách các khối từ (word chunks) bị xáo trộn có kiểm soát để ghép câu
function buildScrambledChunks(enSentence = '', seed = 1) {
  const words = enSentence.trim().split(/\s+/).filter(Boolean);
  // Gom thành các cụm 1-2 từ nếu câu quá dài (> 9 từ) để thao tác ghép mượt mà
  const chunks = [];
  if (words.length <= 8) {
    for (let i = 0; i < words.length; i++) {
      chunks.push({ id: `c-${i}`, text: words[i] });
    }
  } else {
    let i = 0;
    let idx = 0;
    while (i < words.length) {
      const size = (i + idx + seed) % 2 === 0 && i + 1 < words.length ? 2 : 1;
      chunks.push({
        id: `c-${idx}`,
        text: words.slice(i, i + size).join(' ')
      });
      i += size;
      idx++;
    }
  }
  // Xáo trộn tất định theo seed
  const arr = [...chunks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 7 + seed * 13) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Reflex50UnitStudyPage() {
  const { unitNumber } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const uNum = Math.max(1, Math.min(50, Number(unitNumber) || 1));
  const unit = useMemo(
    () => reflex50Data.units.find((u) => u.unitNumber === uNum) || reflex50Data.units[0],
    [uNum]
  );
  const category = useMemo(
    () => reflex50Data.categories.find((c) => c.id === unit.categoryId),
    [unit]
  );

  // Chế độ chính: 'study' | 'worksheet' | 'speaking' | 'listening' | 'collocations'
  const initialMode = searchParams.get('mode') || 'study';
  const [activeMode, setActiveMode] = useState(initialMode);

  // Bộ lọc tầng câu: 'all' | 'basic' | 'intermediate' | 'advanced' | 'starred' | 'unmastered'
  const [tierFilter, setTierFilter] = useState('all');

  // Tùy chọn Active Recall trong tab Study
  const [hideEnglishGlobal, setHideEnglishGlobal] = useState(false);
  const [hideHintsGlobal, setHideHintsGlobal] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState({});
  const [inlinePracticeId, setInlinePracticeId] = useState(null);
  const [inlineInput, setInlineInput] = useState('');
  const [inlineResult, setInlineResult] = useState(null);

  // Tốc độ giọng đọc & Auto-Play Loop 30 câu
  const [playbackSpeed, setPlaybackSpeed] = useState(
    () => speechService.preferences?.rate || 0.95
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [shadowingPause, setShadowingPause] = useState(true); // Nghỉ 3.5s giữa các câu để nhại theo
  const [activePlayingId, setActivePlayingId] = useState(null);
  const autoPlayStopRef = useRef(false);
  const autoPlayTimerRef = useRef(null);

  // Đồng bộ tốc độ khi chỉnh trong VoiceSettingsModal
  useEffect(() => {
    if (typeof speechService.subscribeRateChange === 'function') {
      return speechService.subscribeRateChange((newRate) => {
        setPlaybackSpeed(newRate);
      });
    }
    return undefined;
  }, []);

  // Modals
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Store
  const masteredIds = useReflex50Store((s) => s.masteredIds);
  const starredIds = useReflex50Store((s) => s.starredIds);
  const weakIds = useReflex50Store((s) => s.weakIds);
  const writingHistory = useReflex50Store((s) => s.writingHistory);
  const speakingHistory = useReflex50Store((s) => s.speakingHistory);
  const setLastStudiedUnit = useReflex50Store((s) => s.setLastStudiedUnit);
  const toggleMastered = useReflex50Store((s) => s.toggleMastered);
  const markUnitMastered = useReflex50Store((s) => s.markUnitMastered);
  const toggleStarred = useReflex50Store((s) => s.toggleStarred);
  const recordWritingAttempt = useReflex50Store((s) => s.recordWritingAttempt);
  const recordSpeakingAttempt = useReflex50Store((s) => s.recordSpeakingAttempt);
  const getUnitStats = useReflex50Store((s) => s.getUnitStats);

  const unitStats = getUnitStats(uNum);

  // Ghi nhận Unit đang học gần nhất
  useEffect(() => {
    setLastStudiedUnit(uNum);
  }, [uNum, setLastStudiedUnit]);

  // Đồng bộ URL query param mode
  const handleModeChange = (newMode) => {
    stopAutoPlay();
    setActiveMode(newMode);
    setSearchParams({ mode: newMode }, { replace: true });
  };

  // Dừng Auto-Play khi rời trang hoặc đổi Unit
  const stopAutoPlay = () => {
    autoPlayStopRef.current = true;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    speechService.stop();
    setIsAutoPlaying(false);
    setActivePlayingId(null);
  };

  useEffect(() => {
    return () => stopAutoPlay();
  }, [uNum]);

  // Danh sách câu sau khi lọc theo Tier
  const filteredSentences = useMemo(() => {
    return unit.sentences.filter((s) => {
      if (tierFilter === 'basic') return s.number <= 10;
      if (tierFilter === 'intermediate') return s.number >= 11 && s.number <= 20;
      if (tierFilter === 'advanced') return s.number >= 21;
      if (tierFilter === 'starred') return Boolean(starredIds[s.id] || weakIds[s.id]);
      if (tierFilter === 'unmastered') return !masteredIds[s.id];
      return true;
    });
  }, [unit, tierFilter, starredIds, weakIds, masteredIds]);

  // Preload sẵn 5 câu đầu tiên mỗi khi mở Unit hoặc đổi bộ lọc để bấm Nghe phát ngay lập tức
  useEffect(() => {
    const list = filteredSentences.length > 0 ? filteredSentences : unit.sentences;
    speechService.preloadReflexSentences(list, 0, 5);
  }, [uNum, tierFilter]);

  // Đổi tốc độ phát trực tiếp
  const handleSpeedChange = (newRate) => {
    setPlaybackSpeed(newRate);
    speechService.setLiveSpeed(newRate);
    toast.success(`🎧 Đã chuyển tốc độ nghe: ${newRate}x`, { id: 'reflex50-speed' });
  };

  // Phát 1 câu tiếng Anh
  const speakSentence = (sentence, customRate = null) => {
    if (isAutoPlaying) stopAutoPlay();
    const rate = customRate || playbackSpeed;
    setActivePlayingId(sentence.id);
    speechService.speak(sentence.en, {
      rate,
      speakerIndex: sentence.number % 2,
      onEnd: () => setActivePlayingId((prev) => (prev === sentence.id ? null : prev)),
      onError: () => setActivePlayingId((prev) => (prev === sentence.id ? null : prev))
    });
  };

  // Phát liên tục danh sách câu (Auto-Play Loop + Nghỉ nhại theo Shadowing)
  const toggleAutoPlayLoop = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
      return;
    }
    const list = filteredSentences.length > 0 ? filteredSentences : unit.sentences;
    if (list.length === 0) return;

    autoPlayStopRef.current = false;
    setIsAutoPlaying(true);

    const playAtIndex = (idx) => {
      if (autoPlayStopRef.current || idx >= list.length) {
        setIsAutoPlaying(false);
        setActivePlayingId(null);
        return;
      }
      const item = list[idx];
      setActivePlayingId(item.id);

      // Tải trước 3 câu tiếp theo để chuyển câu 0ms delay
      speechService.preloadReflexSentences(list, idx + 1, 3);

      const el = document.getElementById(`reflex-card-${item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const advanceNext = () => {
        if (autoPlayStopRef.current) return;
        const pauseMs = shadowingPause ? 3200 : 900;
        autoPlayTimerRef.current = setTimeout(() => {
          playAtIndex(idx + 1);
        }, pauseMs);
      };

      speechService.speak(item.en, {
        rate: playbackSpeed,
        speakerIndex: item.number % 2,
        onEnd: advanceNext,
        onError: advanceNext
      });
    };

    playAtIndex(0);
  };

  // ===========================================================================
  // STATE & HANDLERS CHO TAB 2: WORKSHEET (LÀM BÀI TẬP VIẾT & GHÉP CỤM TỪ)
  // ===========================================================================
  const [worksheetSubMode, setWorksheetSubMode] = useState('type'); // 'type' | 'chunks'
  const [worksheetInputs, setWorksheetInputs] = useState({});
  const [worksheetResults, setWorksheetResults] = useState({});
  const [selectedChunksMap, setSelectedChunksMap] = useState({});

  // Khởi tạo dữ liệu đã làm từ trước của Unit
  useEffect(() => {
    const initialInputs = {};
    for (const s of unit.sentences) {
      if (writingHistory[s.id]?.lastInput) {
        initialInputs[s.id] = writingHistory[s.id].lastInput;
      }
    }
    setWorksheetInputs(initialInputs);
    setWorksheetResults({});
    setSelectedChunksMap({});
  }, [uNum]);

  const handleCheckSingleWorksheet = (sentence, customText = null) => {
    const textToEvaluate = customText !== null ? customText : worksheetInputs[sentence.id] || '';
    const res = evaluateSentenceAttempt(textToEvaluate, sentence.en);
    setWorksheetResults((prev) => ({ ...prev, [sentence.id]: res }));
    recordWritingAttempt(sentence.id, textToEvaluate, res.score);
    speechService.speak(sentence.en, { rate: playbackSpeed, speakerIndex: sentence.number % 2 });
  };

  const handleCheckAllWorksheet = () => {
    const nextResults = { ...worksheetResults };
    let checkedCount = 0;
    let passCount = 0;
    for (const s of filteredSentences) {
      const val = (worksheetInputs[s.id] || '').trim();
      if (val) {
        const res = evaluateSentenceAttempt(val, s.en);
        nextResults[s.id] = res;
        recordWritingAttempt(s.id, val, res.score);
        checkedCount++;
        if (res.isPass) passCount++;
      }
    }
    setWorksheetResults(nextResults);
    if (checkedCount === 0) {
      toast('Hãy gõ ít nhất 1 câu trước khi bấm Chấm bài nhé!');
    } else {
      toast.success(`Đã chấm ${checkedCount} câu: Đạt ${passCount}/${checkedCount} câu!`);
    }
  };

  // ===========================================================================
  // STATE & HANDLERS CHO TAB 3: SPEAKING (PHẢN XẠ NÓI 3 GIÂY)
  // ===========================================================================
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [thinkTimerSeconds, setThinkTimerSeconds] = useState(5); // 3s | 5s | 0 (off)
  const [countdownLeft, setCountdownLeft] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingEval, setSpeakingEval] = useState(null);
  const [showSpeakingAnswer, setShowSpeakingAnswer] = useState(false);
  const recognitionRef = useRef(null);

  const currentSpeakingSentence =
    filteredSentences[Math.min(speakingIndex, Math.max(0, filteredSentences.length - 1))] ||
    unit.sentences[0];

  // Reset bộ đếm mỗi khi sang câu mới trong tab Speaking
  useEffect(() => {
    if (activeMode !== 'speaking') return;
    setSpokenTranscript('');
    setSpeakingEval(null);
    setShowSpeakingAnswer(false);
    setCountdownLeft(thinkTimerSeconds);
  }, [speakingIndex, activeMode, uNum, thinkTimerSeconds]);

  useEffect(() => {
    if (activeMode !== 'speaking' || thinkTimerSeconds === 0 || isRecording || speakingEval) {
      return undefined;
    }
    if (countdownLeft <= 0) return undefined;
    const t = setTimeout(() => {
      setCountdownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [activeMode, thinkTimerSeconds, countdownLeft, isRecording, speakingEval]);

  const startVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Trình duyệt của bạn chưa hỗ trợ thu âm trực tiếp. Hãy dùng Chrome hoặc Edge nhé!');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    speechService.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    let finalTranscript = '';
    setIsRecording(true);
    setSpokenTranscript('');
    setSpeakingEval(null);

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += tr + ' ';
        } else {
          interim += tr;
        }
      }
      setSpokenTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => {
        setSpokenTranscript((latestText) => {
          if (latestText && currentSpeakingSentence) {
            const evalRes = evaluateSentenceAttempt(latestText, currentSpeakingSentence.en);
            setSpeakingEval(evalRes);
            setShowSpeakingAnswer(true);
            recordSpeakingAttempt(currentSpeakingSentence.id, latestText, evalRes.score);
            // Đọc lại câu mẫu chuẩn bản xứ để học viên nhại lại ngay
            speechService.speak(currentSpeakingSentence.en, { rate: playbackSpeed });
          }
          return latestText;
        });
      }, 150);
    };

    recognition.start();
  };

  // ===========================================================================
  // STATE & HANDLERS CHO TAB 4: LISTENING & DICTATION (NGHE & CHÉP CHÍNH TẢ)
  // ===========================================================================
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationInput, setDictationInput] = useState('');
  const [dictationEval, setDictationEval] = useState(null);
  const [showFirstLetterHint, setShowFirstLetterHint] = useState(false);

  const currentDictationSentence =
    filteredSentences[Math.min(dictationIndex, Math.max(0, filteredSentences.length - 1))] ||
    unit.sentences[0];

  useEffect(() => {
    setDictationInput('');
    setDictationEval(null);
    setShowFirstLetterHint(false);
  }, [dictationIndex, uNum]);

  const handleCheckDictation = () => {
    if (!currentDictationSentence) return;
    const res = evaluateSentenceAttempt(dictationInput, currentDictationSentence.en);
    setDictationEval(res);
    recordWritingAttempt(currentDictationSentence.id, dictationInput, res.score);
    speechService.speak(currentDictationSentence.en, { rate: playbackSpeed });
  };

  // ===========================================================================
  // STATE CHO TAB 5: COLLOCATIONS & VOCAB SEARCH
  // ===========================================================================
  const [vocabFilter, setVocabFilter] = useState('');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & UNIT NAVIGATION                                       */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/reflex-50')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>50 Chủ Đề Phản Xạ</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMethodModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-sky-400 border border-blue-200/70 dark:border-blue-800/60 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Phương pháp học & làm bài</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <Headphones size={13} className="text-[#0071e3]" />
              <span>Cài đặt Giọng AI</span>
            </button>

            {/* Prev / Next Unit */}
            <div className="flex items-center gap-1">
              <button
                disabled={uNum <= 1}
                onClick={() => navigate(`/reflex-50/unit/${uNum - 1}?mode=${activeMode}`)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
                title="Unit trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-200">
                Unit {uNum}/50
              </span>
              <button
                disabled={uNum >= 50}
                onClick={() => navigate(`/reflex-50/unit/${uNum + 1}?mode=${activeMode}`)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
                title="Unit tiếp theo"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Unit Title & Progress Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3] text-white text-xs font-bold">
                UNIT {uNum < 10 ? `0${uNum}` : uNum}
              </span>
              {category && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                  Nhóm {category.order}: {category.titleVi}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {unit.titleEn} — <span className="text-[#0071e3]">{unit.titleVi}</span>
            </h1>
          </div>

          {/* Unit Mastery Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Tiến độ Unit {uNum}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Đã thuộc {unitStats.masteredCount}/30 câu ({unitStats.percent}%)
                </div>
              </div>
              <button
                onClick={() => {
                  const nextState = !unitStats.isCompleted;
                  markUnitMastered(uNum, nextState);
                  toast.success(
                    nextState
                      ? `Đã đánh dấu thuộc cả 30 câu Unit ${uNum}!`
                      : `Đã bỏ đánh dấu thuộc Unit ${uNum}`
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  unitStats.isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0071e3]'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{unitStats.isCompleted ? 'Đã hoàn thành Unit' : 'Đánh dấu thuộc cả Unit'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Main Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'study', label: '1. Học Phản Xạ & Cụm Từ (30 câu)', icon: BookOpen },
            { id: 'worksheet', label: '2. Làm Bài Tập Viết (→ _____)', icon: PenTool, badge: `${unitStats.writtenCount}/30` },
            { id: 'speaking', label: '3. Phản Xạ Nói 3 Giây (AI chấm)', icon: Mic, badge: `${unitStats.spokenCount}/30` },
            { id: 'listening', label: '4. Nghe & Chép Chính Tả', icon: Headphones },
            { id: 'collocations', label: '5. Sổ Tay Collocations & Từ Vựng', icon: Layers, badge: unit.keyVocab.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STICKY FILTER & SPEED TOOLBAR (CHO STUDY / WORKSHEET / SPEAKING)   */}
      {/* ===================================================================== */}
      {activeMode !== 'collocations' && (
        <div className="sticky top-14 z-30 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Tier Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả (30 câu)' },
              { id: 'basic', label: 'Tầng 1: Cơ bản (1–10)' },
              { id: 'intermediate', label: 'Tầng 2: Mở rộng (11–20)' },
              { id: 'advanced', label: 'Tầng 3: Nâng cao (21–30)' },
              { id: 'unmastered', label: `Chưa thuộc (${30 - unitStats.masteredCount})` },
              { id: 'starred', label: `Lưu Sao / Sai (${unitStats.starredCount + unitStats.weakCount})` }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => {
                  setTierFilter(tf.id);
                  setSpeakingIndex(0);
                  setDictationIndex(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  tierFilter === tf.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Speed Selector Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              {SPEED_OPTIONS.map((sp) => {
                const active = Math.abs(playbackSpeed - sp.rate) < 0.03;
                return (
                  <button
                    key={sp.rate}
                    onClick={() => handleSpeedChange(sp.rate)}
                    title={sp.title}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0071e3] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sp.isSlow && <Headphones size={11} />}
                    <span>{sp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 1: STUDY — HỌC PHẢN XẠ & TƯ DUY CỤM TỪ (30 CÂU)                  */}
      {/* ===================================================================== */}
      {activeMode === 'study' && (
        <div className="space-y-5">
          {/* Active Recall & Auto-Play Control Strip */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setHideEnglishGlobal((prev) => !prev);
                  setRevealedCardIds({});
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  hideEnglishGlobal
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {hideEnglishGlobal ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>
                  {hideEnglishGlobal
                    ? 'Đang Ẩn Đáp Án Tiếng Anh (Chế độ Tự Phản Xạ 3s)'
                    : 'Ẩn Đáp Án Tiếng Anh (Để tự nhẩm nói trước)'}
                </span>
              </button>

              <button
                onClick={() => setHideHintsGlobal((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  hideHintsGlobal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Layers size={14} />
                <span>{hideHintsGlobal ? 'Đang Ẩn Gợi Ý Từ Vựng' : 'Ẩn Gợi Ý Từ Vựng'}</span>
              </button>
            </div>

            {/* Auto-Play 30 Sentences Button */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shadowingPause}
                  onChange={(e) => setShadowingPause(e.target.checked)}
                  className="rounded text-[#0071e3]"
                />
                <span>Nghỉ 3.5s giữa mỗi câu để nhại theo</span>
              </label>

              <button
                onClick={toggleAutoPlayLoop}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs'
                }`}
              >
                {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>
                  {isAutoPlaying
                    ? 'Dừng Phát Liên Tục'
                    : `Phát Liên Tục (${filteredSentences.length} câu)`}
                </span>
              </button>
            </div>
          </div>

          {/* Sentences List */}
          {filteredSentences.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Không có câu nào trong bộ lọc này.
              </p>
              <button
                onClick={() => setTierFilter('all')}
                className="px-4 py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold cursor-pointer"
              >
                Xem toàn bộ 30 câu
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredSentences.map((s) => {
                const isMastered = Boolean(masteredIds[s.id]);
                const isStarred = Boolean(starredIds[s.id]);
                const isPlayingThis = activePlayingId === s.id;
                const isEnglishHidden = hideEnglishGlobal && !revealedCardIds[s.id];
                const isInlineOpen = inlinePracticeId === s.id;

                const tierBadge =
                  s.number <= 10
                    ? { label: 'Tầng 1 • Cơ bản', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' }
                    : s.number <= 20
                    ? { label: 'Tầng 2 • Mở rộng', cls: 'bg-blue-50 text-[#0071e3] dark:bg-blue-950/50 dark:text-sky-300' }
                    : { label: 'Tầng 3 • Nâng cao', cls: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' };

                return (
                  <div
                    key={s.id}
                    id={`reflex-card-${s.id}`}
                    className={`rounded-3xl bg-white dark:bg-slate-900 border p-5 transition-all ${
                      isPlayingThis
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-md'
                        : isMastered
                        ? 'border-emerald-300/80 dark:border-emerald-800/60'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left Content */}
                      <div className="space-y-3 flex-1">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                            {s.number}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tierBadge.cls}`}>
                            {tierBadge.label}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                            {s.grammarNote}
                          </span>
                        </div>

                        {/* Vietnamese Prompt */}
                        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {s.vi}
                        </div>

                        {/* Clickable Vocabulary & Phrase Hints */}
                        {!hideHintsGlobal && s.hints.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400">
                              Cụm từ gợi ý (bấm để nghe):
                            </span>
                            {s.hints.map((h, hIdx) => (
                              <button
                                key={hIdx}
                                onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.88 })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700 text-xs transition-colors cursor-pointer group"
                                title="Bấm để nghe phát âm cụm từ gợi ý"
                              >
                                <Volume2 size={12} className="text-[#0071e3] opacity-80 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-[#0071e3] dark:text-sky-400">{h.term}</span>
                                {h.pos && (
                                  <span className="text-[10px] italic text-slate-400">({h.pos})</span>
                                )}
                                {h.meaning && (
                                  <span className="text-slate-600 dark:text-slate-300">: {h.meaning}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Target English Answer (or Active Recall Reveal Button) */}
                        <div className="pt-1">
                          {isEnglishHidden ? (
                            <button
                              onClick={() => {
                                setRevealedCardIds((prev) => ({ ...prev, [s.id]: true }));
                                speakSentence(s, playbackSpeed);
                              }}
                              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0071e3] dark:text-sky-400 flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Eye size={14} />
                              <span>Hãy tự bật ra câu tiếng Anh trong 3 giây → Bấm để mở đáp án & nghe mẫu</span>
                            </button>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-sm sm:text-base font-bold text-[#0071e3] dark:text-sky-300">
                                → {s.en}
                              </div>
                              {hideEnglishGlobal && (
                                <button
                                  onClick={() =>
                                    setRevealedCardIds((prev) => {
                                      const next = { ...prev };
                                      delete next[s.id];
                                      return next;
                                    })
                                  }
                                  className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  Ẩn lại
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => speakSentence(s, playbackSpeed)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isPlayingThis
                                ? 'bg-[#0071e3] text-white shadow-xs'
                                : 'bg-blue-50 dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 hover:bg-blue-100'
                            }`}
                            title="Nghe câu chuẩn"
                          >
                            <Volume2 size={14} />
                            <span>Nghe</span>
                          </button>

                          <button
                            onClick={() => speakSentence(s, 0.7)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Nghe chậm rãi 0.7x để bắt rõ từng âm"
                          >
                            <Headphones size={13} />
                            <span>Chậm</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (isInlineOpen) {
                                setInlinePracticeId(null);
                              } else {
                                setInlinePracticeId(s.id);
                                setInlineInput(writingHistory[s.id]?.lastInput || '');
                                setInlineResult(null);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              isInlineOpen
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Mở dòng viết thực hành ngay dưới câu này"
                          >
                            <PenTool size={12} />
                            <span>Viết thử</span>
                          </button>

                          <button
                            onClick={() => toggleStarred(s.id)}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isStarred
                                ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-700'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                            }`}
                            title="Đánh dấu Sao (Câu cần ôn kỹ)"
                          >
                            <Star size={14} className={isStarred ? 'fill-amber-400' : ''} />
                          </button>

                          <button
                            onClick={() => toggleMastered(s.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                              isMastered
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>{isMastered ? 'Đã thuộc' : 'Thuộc'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Quick Writing Practice Drawer */}
                    {isInlineOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={inlineInput}
                            onChange={(e) => setInlineInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const res = evaluateSentenceAttempt(inlineInput, s.en);
                                setInlineResult(res);
                                recordWritingAttempt(s.id, inlineInput, res.score);
                                speakSentence(s, playbackSpeed);
                              }
                            }}
                            placeholder="→ Gõ câu tiếng Anh của bạn vào đây rồi nhấn Enter..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const res = evaluateSentenceAttempt(inlineInput, s.en);
                              setInlineResult(res);
                              recordWritingAttempt(s.id, inlineInput, res.score);
                              speakSentence(s, playbackSpeed);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-[#0071e3] text-white text-xs font-bold hover:bg-[#0077ed] cursor-pointer"
                          >
                            Chấm câu này
                          </button>
                        </div>

                        {inlineResult && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  inlineResult.isPass ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                              >
                                Điểm chính xác: {inlineResult.score}% — {inlineResult.feedback}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {inlineResult.wordDiffs.map((wd, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                    wd.status === 'correct'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                                  }`}
                                >
                                  {wd.word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: WORKSHEET — LÀM BÀI TẬP VIẾT & GHÉP CỤM TỪ (→ _________)      */}
      {/* ===================================================================== */}
      {activeMode === 'worksheet' && (
        <div className="space-y-5">
          {/* Worksheet Mode Switcher & Batch Actions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWorksheetSubMode('type')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  worksheetSubMode === 'type'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <PenTool size={14} />
                <span>Chế độ 1: Tự Gõ Cả Câu (→ _________)</span>
              </button>

              <button
                onClick={() => setWorksheetSubMode('chunks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  worksheetSubMode === 'chunks'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Layers size={14} />
                <span>Chế độ 2: Ghép Khối Cụm Từ (Word Blocks)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckAllWorksheet}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>Chấm Tất Cả Các Câu Đã Viết</span>
              </button>

              <button
                onClick={() => {
                  setWorksheetInputs({});
                  setWorksheetResults({});
                  setSelectedChunksMap({});
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Làm lại</span>
              </button>
            </div>
          </div>

          {/* 30 Worksheet Items */}
          <div className="space-y-4">
            {filteredSentences.map((s) => {
              const res = worksheetResults[s.id];
              const userVal = worksheetInputs[s.id] || '';
              const scrambled = buildScrambledChunks(s.en, s.number + uNum);
              const pickedIds = selectedChunksMap[s.id] || [];

              return (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center">
                          {s.number}
                        </span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {s.vi}
                        </span>
                      </div>

                      {/* Hints */}
                      <div className="flex flex-wrap gap-1.5 pl-8">
                        {s.hints.map((h, idx) => (
                          <button
                            key={idx}
                            onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.88 })}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-[#0071e3] cursor-pointer"
                          >
                            • <strong className="text-[#0071e3] dark:text-sky-400">{h.term}</strong>
                            {h.pos ? ` (${h.pos})` : ''}: {h.meaning}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => speakSentence(s, playbackSpeed)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0071e3] hover:bg-blue-50 cursor-pointer"
                        title="Nghe gợi ý phát âm"
                      >
                        <Volume2 size={15} />
                      </button>
                      <button
                        onClick={() => speakSentence(s, 0.7)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        title="Nghe chậm 0.7x"
                      >
                        <Headphones size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Input Area: Type or Chunks */}
                  {worksheetSubMode === 'type' ? (
                    <div className="pl-8 flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          →
                        </span>
                        <input
                          type="text"
                          value={userVal}
                          onChange={(e) =>
                            setWorksheetInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCheckSingleWorksheet(s);
                          }}
                          placeholder="_______________________________________________________"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
                        />
                      </div>
                      <button
                        onClick={() => handleCheckSingleWorksheet(s)}
                        className="px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Kiểm tra
                      </button>
                    </div>
                  ) : (
                    <div className="pl-8 space-y-2.5">
                      {/* Assembled line */}
                      <div className="min-h-11 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400 font-bold mr-1">→</span>
                        {pickedIds.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            Bấm vào các khối từ bên dưới theo đúng thứ tự để ghép thành câu hoàn chỉnh...
                          </span>
                        ) : (
                          pickedIds.map((cid) => {
                            const chunkObj = scrambled.find((c) => c.id === cid);
                            if (!chunkObj) return null;
                            return (
                              <button
                                key={cid}
                                onClick={() => {
                                  const nextPicked = pickedIds.filter((id) => id !== cid);
                                  setSelectedChunksMap((prev) => ({ ...prev, [s.id]: nextPicked }));
                                  const nextSentence = nextPicked
                                    .map((id) => scrambled.find((c) => c.id === id)?.text)
                                    .filter(Boolean)
                                    .join(' ');
                                  setWorksheetInputs((prev) => ({ ...prev, [s.id]: nextSentence }));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#0071e3] text-white text-xs font-semibold cursor-pointer"
                              >
                                {chunkObj.text}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Available scrambled chunks */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {scrambled.map((c) => {
                            const used = pickedIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                disabled={used}
                                onClick={() => {
                                  const nextPicked = [...pickedIds, c.id];
                                  setSelectedChunksMap((prev) => ({ ...prev, [s.id]: nextPicked }));
                                  const nextSentence = nextPicked
                                    .map((id) => scrambled.find((ch) => ch.id === id)?.text)
                                    .filter(Boolean)
                                    .join(' ');
                                  setWorksheetInputs((prev) => ({ ...prev, [s.id]: nextSentence }));
                                  if (nextPicked.length === scrambled.length) {
                                    handleCheckSingleWorksheet(s, nextSentence);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  used
                                    ? 'opacity-30 bg-slate-100 dark:bg-slate-800 border-slate-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0071e3]'
                                }`}
                              >
                                {c.text}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {pickedIds.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedChunksMap((prev) => ({ ...prev, [s.id]: [] }));
                                setWorksheetInputs((prev) => ({ ...prev, [s.id]: '' }));
                                setWorksheetResults((prev) => {
                                  const next = { ...prev };
                                  delete next[s.id];
                                  return next;
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                          <button
                            onClick={() => handleCheckSingleWorksheet(s)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0071e3] text-white text-xs font-bold cursor-pointer"
                          >
                            Chấm điểm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Diff Box */}
                  {res && (
                    <div
                      className={`ml-8 p-3.5 rounded-2xl border space-y-2 ${
                        res.isPass
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${
                            res.isPass ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          Độ chính xác: {res.score}% — {res.feedback}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Đáp án chuẩn: <span className="text-[#0071e3] dark:text-sky-400">{s.en}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {res.wordDiffs.map((wd, idx) => (
                          <button
                            key={idx}
                            onClick={() => speechService.speak(wd.cleanWord, { rate: 0.75 })}
                            className={`px-2 py-0.5 rounded-md text-xs font-bold cursor-pointer ${
                              wd.status === 'correct'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200 underline'
                            }`}
                            title="Bấm để nghe phát âm từ này"
                          >
                            {wd.word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 3: SPEAKING — PHẢN XẠ NÓI 3 GIÂY (3-SECOND SPEAKING STUDIO)      */}
      {/* ===================================================================== */}
      {activeMode === 'speaking' && currentSpeakingSentence && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Top Controls: Think Timer & Progress */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Câu {speakingIndex + 1} / {filteredSentences.length}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-[#0071e3] font-semibold">
                {currentSpeakingSentence.grammarNote}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Thời gian bật phản xạ:</span>
              {[
                { sec: 3, label: '3s Nhanh' },
                { sec: 5, label: '5s Chuẩn' },
                { sec: 0, label: 'Tắt đếm giờ' }
              ].map((opt) => (
                <button
                  key={opt.sec}
                  onClick={() => setThinkTimerSeconds(opt.sec)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                    thinkTimerSeconds === opt.sec
                      ? 'bg-[#0071e3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Speaking Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 text-center">
            {/* Think Countdown Badge */}
            {thinkTimerSeconds > 0 && !speakingEval && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <Zap size={14} />
                <span>
                  {countdownLeft > 0
                    ? `Hãy bật thành tiếng trong ${countdownLeft} giây...`
                    : 'Hết giờ suy nghĩ! Hãy bấm Mic và nói to câu tiếng Anh ngay!'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Phản xạ dịch nói sang Tiếng Anh câu #{currentSpeakingSentence.number}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                "{currentSpeakingSentence.vi}"
              </h2>
            </div>

            {/* Hints */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {currentSpeakingSentence.hints.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.85 })}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#0071e3] flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 size={13} className="text-[#0071e3]" />
                  <strong className="text-[#0071e3] dark:text-sky-400">{h.term}</strong>
                  <span>: {h.meaning}</span>
                </button>
              ))}
            </div>

            {/* Microphone Record Button & Audio Preview */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={startVoiceRecording}
                className={`px-6 py-3.5 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-md transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white'
                }`}
              >
                <Mic size={18} />
                <span>{isRecording ? 'Đang nghe bạn nói... (Bấm để dừng)' : 'Bấm Để Nói Tiếng Anh'}</span>
              </button>

              <button
                onClick={() => {
                  setShowSpeakingAnswer(true);
                  speakSentence(currentSpeakingSentence, playbackSpeed);
                }}
                className="px-4 py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 size={15} className="text-[#0071e3]" />
                <span>Nghe mẫu ({playbackSpeed}x)</span>
              </button>

              <button
                onClick={() => {
                  setShowSpeakingAnswer(true);
                  speakSentence(currentSpeakingSentence, 0.7);
                }}
                className="px-4 py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Headphones size={15} />
                <span>Nghe chậm rãi (0.7x)</span>
              </button>
            </div>

            {/* Live Transcript & Evaluation */}
            {(spokenTranscript || speakingEval || showSpeakingAnswer) && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                {spokenTranscript && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    🎙️ Giọng nói nhận diện được:{' '}
                    <strong className="text-slate-900 dark:text-white">"{spokenTranscript}"</strong>
                  </div>
                )}

                {speakingEval && (
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        speakingEval.isPass ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      Điểm phản xạ phát âm: {speakingEval.score}% — {speakingEval.feedback}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Đáp án chuẩn bản xứ (Bấm vào bất kỳ từ nào để nghe chậm 0.7x):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(speakingEval
                      ? speakingEval.wordDiffs
                      : currentSpeakingSentence.en.split(/\s+/).map((w) => ({
                          word: w,
                          cleanWord: w,
                          status: 'correct'
                        }))
                    ).map((wd, idx) => (
                      <button
                        key={idx}
                        onClick={() => speechService.speak(wd.cleanWord, { rate: 0.7 })}
                        className={`px-2.5 py-1 rounded-lg text-sm font-bold cursor-pointer ${
                          wd.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                        }`}
                      >
                        {wd.word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={speakingIndex <= 0}
                onClick={() => setSpeakingIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                ← Câu trước
              </button>

              <button
                onClick={() => {
                  if (!masteredIds[currentSpeakingSentence.id]) {
                    toggleMastered(currentSpeakingSentence.id);
                  }
                  if (speakingIndex + 1 < filteredSentences.length) {
                    setSpeakingIndex((i) => i + 1);
                  } else {
                    toast.success('Đã hoàn thành lượt luyện nói!');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Đã bật thành tiếng • Sang câu tiếp →
              </button>

              <button
                disabled={speakingIndex >= filteredSentences.length - 1}
                onClick={() => setSpeakingIndex((i) => Math.min(filteredSentences.length - 1, i + 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Câu tiếp →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 4: LISTENING & DICTATION — NGHE PHẢN XẠ & CHÉP CHÍNH TẢ          */}
      {/* ===================================================================== */}
      {activeMode === 'listening' && currentDictationSentence && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 text-xs font-bold">
                Nghe & Chép Chính Tả • Câu {dictationIndex + 1} / {filteredSentences.length}
              </span>
              <button
                onClick={() => setShowFirstLetterHint((prev) => !prev)}
                className="text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
              >
                {showFirstLetterHint ? 'Ẩn gợi ý chữ cái đầu' : '💡 Gợi ý chữ cái đầu & nghĩa tiếng Việt'}
              </button>
            </div>

            {/* Audio Trigger Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              <button
                onClick={() => speakSentence(currentDictationSentence, 0.95)}
                className="px-6 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Volume2 size={18} />
                <span>Nghe Tốc Độ Chuẩn (0.95x)</span>
              </button>

              <button
                onClick={() => speakSentence(currentDictationSentence, 0.75)}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Headphones size={16} className="text-[#0071e3]" />
                <span>Nghe Chậm Rãi (0.75x)</span>
              </button>

              <button
                onClick={() => speakSentence(currentDictationSentence, 0.6)}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Gauge size={16} className="text-amber-500" />
                <span>Rất Chậm (0.6x)</span>
              </button>
            </div>

            {showFirstLetterHint && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Nghĩa tiếng Việt: "{currentDictationSentence.vi}"
                </div>
                <div className="font-mono text-amber-700 dark:text-amber-300">
                  Gợi ý khung từ:{' '}
                  {currentDictationSentence.en
                    .split(/\s+/)
                    .map((w) => w[0] + '_'.repeat(Math.max(1, w.length - 1)))
                    .join('  ')}
                </div>
              </div>
            )}

            {/* Dictation Input */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={dictationInput}
                onChange={(e) => setDictationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckDictation();
                }}
                placeholder="Nhập chính xác câu tiếng Anh bạn vừa nghe được..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
              />
              <button
                onClick={handleCheckDictation}
                className="px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold cursor-pointer"
              >
                Kiểm tra chính tả
              </button>
            </div>

            {dictationEval && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      dictationEval.isPass ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    Độ chính xác: {dictationEval.score}% — {dictationEval.feedback}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nghĩa: {currentDictationSentence.vi}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dictationEval.wordDiffs.map((wd, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        wd.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                      }`}
                    >
                      {wd.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={dictationIndex <= 0}
                onClick={() => setDictationIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                ← Câu trước
              </button>
              <button
                disabled={dictationIndex >= filteredSentences.length - 1}
                onClick={() => setDictationIndex((i) => Math.min(filteredSentences.length - 1, i + 1))}
                className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Câu tiếp theo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 5: COLLOCATIONS, REAL-LIFE EXPRESSIONS & KEY VOCAB               */}
      {/* ===================================================================== */}
      {activeMode === 'collocations' && (
        <div className="space-y-6">
          {/* 1. Collocations chuẩn bản xứ */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-[#0071e3]" />
                  <span>💡 Cụm Từ & Collocations Chuẩn Bản Xứ — {unit.titleEn}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Học thuộc các cụm từ cố định này giúp bạn bật ra cả vế câu tự nhiên mà không cần ghép từng từ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unit.bonus.collocations.map((col, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-[#0071e3] dark:text-sky-400">{col.en}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{col.vi}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => speechService.speak(col.en.split('/')[0].trim(), { rate: 0.92 })}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 text-[#0071e3] hover:bg-blue-50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      title="Nghe chuẩn"
                    >
                      <Volume2 size={14} />
                    </button>
                    <button
                      onClick={() => speechService.speak(col.en.split('/')[0].trim(), { rate: 0.68 })}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-[#0071e3] border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      title="Nghe chậm 0.68x"
                    >
                      <Headphones size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Mẫu câu giao tiếp thực tế */}
          {unit.bonus.realLifeSentences?.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                🗣️ Mẫu Câu Giao Tiếp Thực Tế Cốt Lõi Trong Chủ Đề {unit.titleVi}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unit.bonus.realLifeSentences.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{item.en}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.vi}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => speechService.speak(item.en, { rate: 0.95 })}
                        className="p-2 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ed] cursor-pointer"
                      >
                        <Volume2 size={14} />
                      </button>
                      <button
                        onClick={() => speechService.speak(item.en, { rate: 0.72 })}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Nghe chậm"
                      >
                        <Headphones size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Toàn bộ Từ Vựng & Cụm Từ Trọng Tâm Của 30 Câu */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  ⭐ Toàn Bộ Từ Vựng & Cấu Trúc Trong Unit {uNum} ({unit.keyVocab.length} mục)
                </h2>
                <p className="text-xs text-slate-500">
                  Mỗi từ vựng đều đi kèm câu ngữ cảnh thực tế từ 30 câu trong bài
                </p>
              </div>
              <input
                type="text"
                value={vocabFilter}
                onChange={(e) => setVocabFilter(e.target.value)}
                placeholder="Lọc nhanh từ vựng..."
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unit.keyVocab
                .filter(
                  (v) =>
                    !vocabFilter ||
                    v.term.toLowerCase().includes(vocabFilter.toLowerCase()) ||
                    v.meaning.toLowerCase().includes(vocabFilter.toLowerCase())
                )
                .map((v, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0071e3] dark:text-sky-400">
                          {v.term}
                        </span>
                        {v.pos && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {v.pos}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          = {v.meaning}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                        VD: "{v.exampleEn}"
                      </div>
                    </div>

                    <button
                      onClick={() => speechService.speak(v.term.split('/')[0].trim(), { rate: 0.88 })}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0071e3] hover:bg-blue-50 shrink-0 cursor-pointer"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Reflex50MethodGuideModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
      />

      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
