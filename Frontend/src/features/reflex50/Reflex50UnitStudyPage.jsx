import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, PenTool, Mic, Headphones, Layers,
  CheckCircle2, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import reflex50Data from './data/reflex50Data.json';
import useReflex50Store from './store/useReflex50Store';
import Reflex50MethodGuideModal from './components/Reflex50MethodGuideModal';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

import ReflexStudyMode from './components/ReflexStudyMode';
import ReflexWorksheetMode from './components/ReflexWorksheetMode';
import ReflexSpeakingMode from './components/ReflexSpeakingMode';
import ReflexDictationMode from './components/ReflexDictationMode';
import ReflexCollocationsMode from './components/ReflexCollocationsMode';

const SPEED_OPTIONS = [
  { rate: 0.6, label: '0.6x', title: 'Rất chậm (Nghe rõ từng âm tiết)', isSlow: true },
  { rate: 0.75, label: '0.75x', title: 'Chậm rãi (Khuyên dùng khi mới nghe)', isSlow: true },
  { rate: 0.85, label: '0.85x', title: 'Hơi chậm', isSlow: true },
  { rate: 0.95, label: '0.95x', title: 'Tự nhiên', isSlow: false },
  { rate: 1.0, label: '1.0x', title: 'Bản xứ', isSlow: false },
  { rate: 1.15, label: '1.15x', title: 'Nhanh', isSlow: false }
];

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

  // Tốc độ giọng đọc & Auto-Play Loop 30 câu
  const [playbackSpeed, setPlaybackSpeed] = useState(
    () => speechService.preferences?.rate || 0.95
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [shadowingPause, setShadowingPause] = useState(true);
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
  const setLastStudiedUnit = useReflex50Store((s) => s.setLastStudiedUnit);
  const toggleMastered = useReflex50Store((s) => s.toggleMastered);
  const markUnitMastered = useReflex50Store((s) => s.markUnitMastered);
  const toggleStarred = useReflex50Store((s) => s.toggleStarred);
  const recordWritingAttempt = useReflex50Store((s) => s.recordWritingAttempt);
  const recordSpeakingAttempt = useReflex50Store((s) => s.recordSpeakingAttempt);
  const getUnitStats = useReflex50Store((s) => s.getUnitStats);
  const fetchProgress = useReflex50Store((s) => s.fetchProgress);

  // Nạp tiến độ mới nhất từ SQL Server
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const unitStats = useMemo(() => getUnitStats(uNum), [getUnitStats, uNum, masteredIds, writingHistory]);

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

  // Preload sẵn 5 câu đầu tiên mỗi khi mở Unit hoặc đổi bộ lọc
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

  const lastListenSentenceRef = useRef({});
  const recordListen = (sentenceId) => {
    const now = Date.now();
    const last = lastListenSentenceRef.current[sentenceId] || 0;
    if (now - last > 4000) {
      lastListenSentenceRef.current[sentenceId] = now;
      useReflex50Store.getState().recordListeningAttempt(sentenceId);
    }
  };

  // Phát 1 câu tiếng Anh
  const speakSentence = (sentence, customRate = null) => {
    if (isAutoPlaying) stopAutoPlay();
    const rate = customRate || playbackSpeed;
    setActivePlayingId(sentence.id);
    recordListen(sentence.id);
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
      recordListen(item.id);

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

  return (
    <div className="max-w-6xl mx-auto space-y-3.5 sm:space-y-6 pb-12 sm:pb-16">
      {/* 1. TOP HEADER & UNIT NAVIGATION */}
      <div className="duo-card p-3.5 sm:p-6 rounded-3xl space-y-3.5 sm:space-y-5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          <button
            onClick={() => navigate('/reflex-50')}
            className="duo-btn duo-btn-white duo-btn-xs inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">50 Chủ Đề Phản Xạ</span>
            <span className="sm:hidden">50 Chủ đề</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <button
              onClick={() => setIsMethodModalOpen(true)}
              className="duo-btn duo-btn-blue duo-btn-xs inline-flex items-center gap-1 shrink-0"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Phương pháp học</span>
              <span className="sm:hidden">Cách học</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="duo-btn duo-btn-white duo-btn-xs inline-flex items-center gap-1 shrink-0"
            >
              <Headphones size={12} className="text-[#1cb0f6]" />
              <span className="hidden sm:inline">Cài đặt Giọng AI</span>
              <span className="sm:hidden">Giọng AI</span>
            </button>

            {/* Prev / Next Unit */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button
                disabled={uNum <= 1}
                onClick={() => navigate(`/reflex-50/unit/${uNum - 1}?mode=${activeMode}`)}
                className="duo-btn duo-btn-white p-1.5 rounded-full disabled:opacity-40"
                title="Unit trước"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[11px] sm:text-xs font-black px-1.5 sm:px-2 text-slate-700 dark:text-slate-200">
                U{uNum}/50
              </span>
              <button
                disabled={uNum >= 50}
                onClick={() => navigate(`/reflex-50/unit/${uNum + 1}?mode=${activeMode}`)}
                className="duo-btn duo-btn-white p-1.5 rounded-full disabled:opacity-40"
                title="Unit tiếp theo"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Unit Title & Progress Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-3 py-1 rounded-full duo-btn-purple text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                UNIT {uNum < 10 ? `0${uNum}` : uNum}
              </span>
              {category && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-bold truncate max-w-[240px] sm:max-w-none">
                  Nhóm {category.order}: {category.titleVi}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
              {unit.titleEn} — <span className="text-[#ce82ff]">{unit.titleVi}</span>
            </h1>
          </div>

          {/* Unit Mastery Actions */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 px-3 sm:px-4 py-2 rounded-2xl duo-card text-left">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                Tiến độ Unit {uNum}
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
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
              className={`shrink-0 flex items-center gap-1.5 ${
                unitStats.isCompleted
                  ? 'duo-btn duo-btn-green duo-btn-xs'
                  : 'duo-btn duo-btn-white duo-btn-xs'
              }`}
            >
              <CheckCircle2 size={13} />
              <span className="hidden sm:inline">{unitStats.isCompleted ? 'Đã hoàn thành Unit' : 'Đánh dấu thuộc cả Unit'}</span>
              <span className="sm:hidden">{unitStats.isCompleted ? 'Đã xong ✓' : 'Thuộc cả Unit'}</span>
            </button>
          </div>
        </div>

        {/* 5 Main Mode Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar sm:flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'study', label: '1. Học Phản Xạ & Cụm Từ (30 câu)', shortLabel: '1. Học 30 câu', icon: BookOpen },
            { id: 'worksheet', label: '2. Làm Bài Tập Viết (→ _____)', shortLabel: '2. Bài viết', icon: PenTool, badge: `${unitStats.writtenCount}/30` },
            { id: 'speaking', label: '3. Phản Xạ Nói 3 Giây (AI chấm)', shortLabel: '3. Nói 3s', icon: Mic, badge: `${unitStats.spokenCount}/30` },
            { id: 'listening', label: '4. Nghe & Chép Chính Tả', shortLabel: '4. Nghe chép', icon: Headphones },
            { id: 'collocations', label: '5. Sổ Tay Collocations & Từ Vựng', shortLabel: '5. Từ vựng', icon: Layers, badge: unit.keyVocab.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                className={`flex items-center gap-1.5 shrink-0 ${
                  active
                    ? 'duo-btn duo-btn-purple duo-btn-sm'
                    : 'duo-btn duo-btn-white duo-btn-sm text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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

      {/* 2. STICKY FILTER & SPEED TOOLBAR */}
      {activeMode !== 'collocations' && (
        <div className="sticky top-14 z-30 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-2 sm:p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar">
            {[
              { id: 'all', label: 'Tất cả (30 câu)', shortLabel: 'Tất cả (30)' },
              { id: 'basic', label: 'Tầng 1: Cơ bản (1–10)', shortLabel: 'Tầng 1 (1–10)' },
              { id: 'intermediate', label: 'Tầng 2: Mở rộng (11–20)', shortLabel: 'Tầng 2 (11–20)' },
              { id: 'advanced', label: 'Tầng 3: Nâng cao (21–30)', shortLabel: 'Tầng 3 (21–30)' },
              { id: 'unmastered', label: `Chưa thuộc (${30 - unitStats.masteredCount})`, shortLabel: `Chưa thuộc (${30 - unitStats.masteredCount})` },
              { id: 'starred', label: `Lưu Sao / Sai (${unitStats.starredCount + unitStats.weakCount})`, shortLabel: `Lưu Sao (${unitStats.starredCount + unitStats.weakCount})` }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTierFilter(tf.id)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  tierFilter === tf.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                <span className="hidden sm:inline">{tf.label}</span>
                <span className="sm:hidden">{tf.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-full">
            <span className="text-[10px] font-bold text-slate-400 pl-2 pr-1 sm:hidden shrink-0">Tốc độ:</span>
            {SPEED_OPTIONS.map((sp) => {
              const active = Math.abs(playbackSpeed - sp.rate) < 0.03;
              return (
                <button
                  key={sp.rate}
                  onClick={() => handleSpeedChange(sp.rate)}
                  title={sp.title}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0071e3] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sp.isSlow && <Headphones size={10} />}
                  <span>{sp.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACTIVE MODE CONTENT */}
      {activeMode === 'study' && (
        <ReflexStudyMode
          filteredSentences={filteredSentences}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          masteredIds={masteredIds}
          starredIds={starredIds}
          writingHistory={writingHistory}
          toggleMastered={toggleMastered}
          toggleStarred={toggleStarred}
          recordWritingAttempt={recordWritingAttempt}
          recordSpeakingAttempt={recordSpeakingAttempt}
          playbackSpeed={playbackSpeed}
          activePlayingId={activePlayingId}
          isAutoPlaying={isAutoPlaying}
          shadowingPause={shadowingPause}
          setShadowingPause={setShadowingPause}
          toggleAutoPlayLoop={toggleAutoPlayLoop}
          stopAutoPlay={stopAutoPlay}
          speakSentence={speakSentence}
        />
      )}

      {activeMode === 'worksheet' && (
        <ReflexWorksheetMode
          filteredSentences={filteredSentences}
          unit={unit}
          uNum={uNum}
          writingHistory={writingHistory}
          playbackSpeed={playbackSpeed}
          activePlayingId={activePlayingId}
          stopAutoPlay={stopAutoPlay}
          speakSentence={speakSentence}
          recordWritingAttempt={recordWritingAttempt}
        />
      )}

      {activeMode === 'speaking' && (
        <ReflexSpeakingMode
          filteredSentences={filteredSentences}
          playbackSpeed={playbackSpeed}
          stopAutoPlay={stopAutoPlay}
          masteredIds={masteredIds}
          toggleMastered={toggleMastered}
          recordSpeakingAttempt={recordSpeakingAttempt}
        />
      )}

      {activeMode === 'listening' && (
        <ReflexDictationMode
          filteredSentences={filteredSentences}
          playbackSpeed={playbackSpeed}
          speakSentence={speakSentence}
          recordWritingAttempt={recordWritingAttempt}
        />
      )}

      {activeMode === 'collocations' && (
        <ReflexCollocationsMode
          unit={unit}
          uNum={uNum}
        />
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
