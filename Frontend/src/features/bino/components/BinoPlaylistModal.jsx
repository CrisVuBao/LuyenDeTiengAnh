import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, 
  Sparkles, X, Minimize2, Maximize2, Check, CheckSquare, Square, 
  ListMusic, BookOpen, Layers, Clock, ArrowRight, ChevronDown, 
  ChevronRight, Repeat, Repeat1, Eye, EyeOff, Settings,
  Music, Sliders, ExternalLink, Headphones
} from 'lucide-react';
import binoApi from '../../../api/binoApi';
import speechService, { SPEECH_SPEED_PRESETS } from '../../../utils/speechService';
import VoiceSettingsModal from '../../../components/VoiceSettingsModal';
import toast from 'react-hot-toast';

// Global Persistent Store giúp trình phát giữ nguyên xuyên suốt khi chuyển qua mọi trang
export const useBinoPlayerStore = create((set) => ({
  isOpen: false,
  isMinimized: false,
  book: null,
  initialSelectedIds: null,
  autoStart: false,
  handOffPayload: null,
  requestToken: 0,

  openPlaylist: ({ ids = null, autoStart = false, minimized = false, book = null } = {}) =>
    set((state) => ({
      isOpen: true,
      isMinimized: minimized,
      initialSelectedIds: ids,
      autoStart,
      book: book || state.book || binoApi.peekBookOverview(),
      handOffPayload: null,
      requestToken: state.requestToken + 1,
    })),

  handOffSingleLesson: ({ lesson, lineIdx = 0, speed = 0.95, repeatMode = 'one' }) =>
    set((state) => ({
      isOpen: true,
      isMinimized: true,
      initialSelectedIds: lesson ? [lesson.id] : null,
      autoStart: true,
      handOffPayload: { lesson, lineIdx, speed, repeatMode },
      requestToken: state.requestToken + 1,
    })),

  closePlayer: () =>
    set({
      isOpen: false,
      isMinimized: false,
      autoStart: false,
      handOffPayload: null,
    }),

  setMinimized: (isMinimized) => set({ isMinimized }),
  setBook: (book) => set({ book }),
}));

export default function BinoPlaylistModal() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isOpen,
    isMinimized,
    book: storeBook,
    initialSelectedIds,
    autoStart,
    handOffPayload,
    requestToken,
    closePlayer,
    setMinimized,
    setBook,
  } = useBinoPlayerStore();

  const book = storeBook || binoApi.peekBookOverview();

  // Tự động tải thông tin sách nếu mở trình phát từ trang khác (vd: Trang chủ)
  useEffect(() => {
    if (isOpen && !book) {
      binoApi.getBookOverview()
        .then((res) => {
          if (res?.data) setBook(res.data);
        })
        .catch(() => {});
    }
  }, [isOpen, book, setBook]);

  // Lấy toàn bộ danh sách ID của các bài hội thoại có trong sách
  const allDialogueIds = useMemo(() => {
    if (!book?.chapters?.length) return [];
    const ids = [];
    book.chapters.forEach(c => {
      c.dialogues?.forEach(d => {
        ids.push(d.id);
      });
    });
    return ids;
  }, [book]);

  // Danh sách ID các bài được chọn
  const [selectedIds, setSelectedIds] = useState(() => {
    if (initialSelectedIds?.length) return initialSelectedIds;
    return allDialogueIds;
  });

  // Trạng thái dữ liệu Playlist & Phát âm thanh
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(() => speechService.preferences?.rate || 0.95);
  const [repeatMode, setRepeatMode] = useState('all'); // 'all' (lặp toàn playlist), 'one' (lặp 1 bài), 'none' (phát xong dừng)
  const [showVietsub, setShowVietsub] = useState(true);
  const [activeView, setActiveView] = useState('player'); // 'player' hoặc 'selector'
  const [expandedChapters, setExpandedChapters] = useState({});
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Refs chống race-condition và stale closures
  const isPlayingRef = useRef(false);
  const audioSpeedRef = useRef(audioSpeed);
  const playSessionTokenRef = useRef(0);
  const stepTokenRef = useRef(0);
  const currentLessonIdxRef = useRef(0);
  const currentLineIdxRef = useRef(0);
  const playlistRef = useRef([]);
  const timeoutTimerRef = useRef(null);
  const lineRefs = useRef({});
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    audioSpeedRef.current = audioSpeed;
  }, [audioSpeed]);

  useEffect(() => {
    return speechService.subscribeRateChange((newRate) => {
      setAudioSpeed(newRate);
      audioSpeedRef.current = newRate;
    });
  }, []);

  const handleChangeSpeed = (speed) => {
    const updated = speechService.setLiveSpeed(speed);
    setAudioSpeed(updated);
    audioSpeedRef.current = updated;
    const preset = SPEECH_SPEED_PRESETS.find((p) => Math.abs(p.value - updated) < 0.02);
    if (updated <= 0.85) {
      toast.success(`🎧 Tốc độ ${updated}x (${preset?.shortTag || 'Chậm rãi'}): Nghe kỹ từng âm`, {
        id: 'bino-speed-toast',
        duration: 1800
      });
    } else {
      toast.success(`🎙️ Tốc độ ${updated}x (${preset?.shortTag || 'Tự nhiên'})`, {
        id: 'bino-speed-toast',
        duration: 1500
      });
    }
  };

  const handleCycleSpeed = () => {
    const commonSpeeds = [0.75, 0.85, 0.95, 1.0, 1.15];
    const curIdx = commonSpeeds.findIndex(s => Math.abs(s - audioSpeed) < 0.05);
    const nextIdx = (curIdx + 1) % commonSpeeds.length;
    handleChangeSpeed(commonSpeeds[nextIdx]);
  };

  const handleCycleRepeat = () => {
    const modes = ['all', 'one', 'none'];
    const curIdx = modes.indexOf(repeatMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    setRepeatMode(nextMode);
    if (nextMode === 'all') toast.success('🔁 Lặp lại: Toàn bộ danh sách');
    else if (nextMode === 'one') toast.success('🔂 Lặp lại: 1 bài liên tục');
    else toast('⏹️ Tự dừng khi hết danh sách', { icon: '⏹️' });
  };

  // Khi người dùng chuyển sang trang khác trong lúc Modal đang mở full -> Tự động thu nhỏ xuống góc màn hình và GIỮ NGUYÊN phát nhạc!
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (isOpen && !isMinimized) {
        setMinimized(true);
      }
    }
  }, [location.pathname, isOpen, isMinimized, setMinimized]);

  // Cập nhật selectedIds khi initialSelectedIds thay đổi từ bên ngoài
  useEffect(() => {
    if (initialSelectedIds?.length) {
      setSelectedIds(initialSelectedIds);
    } else if (allDialogueIds.length && selectedIds.length === 0) {
      setSelectedIds(allDialogueIds);
    }
  }, [initialSelectedIds, allDialogueIds, requestToken]);

  // Nếu nhận handOffSingleLesson từ BinoDialogueStudyPage khi người dùng chuyển trang lúc đang nghe
  useEffect(() => {
    if (!isOpen || !handOffPayload?.lesson) return;
    const { lesson, lineIdx = 0, speed = 0.95, repeatMode: mode = 'one' } = handOffPayload;
    const singleList = [lesson];
    setAudioSpeed(speed);
    setRepeatMode(mode);
    setPlaylist(singleList);
    playlistRef.current = singleList;
    setCurrentLessonIdx(0);
    currentLessonIdxRef.current = 0;
    setCurrentLineIdx(lineIdx);
    currentLineIdxRef.current = lineIdx;
    setLoading(false);

    const timer = setTimeout(() => {
      startPlayback(0, lineIdx, singleList, speed);
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen, requestToken, handOffPayload]);

  // Tải dữ liệu kịch bản các bài thoại khi modal mở (nếu không phải handOff trực tiếp)
  useEffect(() => {
    if (!isOpen || handOffPayload?.lesson) return;
    const targetIds = initialSelectedIds?.length ? initialSelectedIds : selectedIds;
    if (targetIds.length === 0) {
      setPlaylist([]);
      playlistRef.current = [];
      setLoading(false);
      return;
    }

    setLoading(true);
    const idsParam =
      targetIds.length > 0 && targetIds.length !== allDialogueIds.length
        ? targetIds.join(',')
        : null;

    binoApi.getPlaylistDialogues(idsParam)
      .then(res => {
        if (res?.data?.length) {
          setPlaylist(res.data);
          playlistRef.current = res.data;
          setCurrentLessonIdx(0);
          currentLessonIdxRef.current = 0;
          setCurrentLineIdx(0);
          currentLineIdxRef.current = 0;

          if (autoStart) {
            setTimeout(() => {
              startPlayback(0, 0, res.data);
            }, 200);
          }
        } else {
          setPlaylist([]);
          playlistRef.current = [];
        }
      })
      .catch(err => {
        console.error('Lỗi tải playlist:', err);
        toast.error('Không thể tải danh sách bài học');
      })
      .finally(() => setLoading(false));
  }, [isOpen, requestToken, selectedIds.join(',')]);

  // Cuộn mượt đến câu thoại đang phát
  useEffect(() => {
    if (!isMinimized && activeView === 'player' && currentLineIdx !== null && lineRefs.current[currentLineIdx]) {
      lineRefs.current[currentLineIdx].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIdx, isMinimized, activeView]);

  // Dừng phát âm thanh an toàn
  const stopPlayback = (stopKeepAlive = false) => {
    playSessionTokenRef.current += 1;
    stepTokenRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    speechService.stop(stopKeepAlive);
  };

  // Khi người dùng chủ động bấm nút X đóng trình phát hoàn toàn
  const handleClose = () => {
    stopPlayback(true);
    closePlayer();
  };

  // Bắt đầu phát bài học tại vị trí lessonIdx, câu lineIdx
  const startPlayback = (
    lessonIdx = currentLessonIdxRef.current,
    lineIdx = 0,
    currentList = playlistRef.current,
    overrideSpeed = null
  ) => {
    if (!currentList?.length) return;
    stopPlayback(false);

    const boundedLessonIdx = Math.max(0, Math.min(lessonIdx, currentList.length - 1));
    currentLessonIdxRef.current = boundedLessonIdx;
    setCurrentLessonIdx(boundedLessonIdx);

    const lesson = currentList[boundedLessonIdx];
    if (!lesson?.dialogueLines?.length) {
      toast('Bài học này chưa có câu thoại, đang chuyển bài kế...', { icon: '⏭️' });
      playNextLesson(boundedLessonIdx, currentList);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    const sessionToken = playSessionTokenRef.current;

    // Kích hoạt phiên phát nền & điều khiển trên màn hình khóa điện thoại (MediaSession)
    speechService.startBackgroundSession(
      {
        title: `${lesson.title}`,
        artist: `Chương ${lesson.chapterNumber} • Bài ${lesson.dialogueNumber} (VBace)`,
        album: 'Giao Tiếp Thực Chiến — VBaceEnglish'
      },
      {
        onPlay: () => startPlayback(currentLessonIdxRef.current, currentLineIdxRef.current, playlistRef.current),
        onPause: () => stopPlayback(false),
        onPrev: () => playPrevLesson(currentLessonIdxRef.current, playlistRef.current),
        onNext: () => playNextLesson(currentLessonIdxRef.current, playlistRef.current),
        onStop: () => handleClose()
      }
    );

    playLineAt(boundedLessonIdx, lineIdx, sessionToken, currentList, overrideSpeed);
  };

  // Phát một câu thoại cụ thể
  const playLineAt = (lessonIdx, lineIdx, sessionToken, currentList = playlistRef.current, overrideSpeed = null) => {
    if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;

    const lesson = currentList[lessonIdx];
    if (!lesson?.dialogueLines?.length) return;

    // Đã đọc xong bài học hiện tại
    if (lineIdx >= lesson.dialogueLines.length) {
      handleLessonFinished(lessonIdx, sessionToken, currentList);
      return;
    }

    currentLineIdxRef.current = lineIdx;
    setCurrentLineIdx(lineIdx);

    const line = lesson.dialogueLines[lineIdx];
    const currentStep = ++stepTokenRef.current;

    speechService.preloadDialogueLines(lesson.dialogueLines, lineIdx + 1, 3);

    speechService.speakLine({
      text: line.englishText,
      characterName: line.characterName,
      speed: overrideSpeed || audioSpeedRef.current || audioSpeed,
      metadata: {
        title: `${line.characterName}: "${line.englishText}"`,
        artist: `Chương ${lesson.chapterNumber} • Bài ${lesson.dialogueNumber}: ${lesson.title}`,
        album: 'Giao Tiếp Thực Chiến — VBaceEnglish'
      },
      onEnd: () => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;

        // Nghỉ 450ms rồi chuyển câu tiếp theo trong bài
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAt(lessonIdx, lineIdx + 1, sessionToken, currentList, overrideSpeed);
        }, 450);
      },
      onError: (err) => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;
        console.warn('[Playlist] Lỗi đọc câu thoại, tự động chuyển tiếp:', err);

        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAt(lessonIdx, lineIdx + 1, sessionToken, currentList, overrideSpeed);
        }, 600);
      }
    });
  };

  // Xử lý khi hoàn thành một bài hội thoại
  const handleLessonFinished = (lessonIdx, sessionToken, currentList) => {
    if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;

    const currentLesson = currentList[lessonIdx];
    toast.success(`Xong: ${currentLesson.title} ✨`, { duration: 2000 });

    if (repeatMode === 'one') {
      timeoutTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        playLineAt(lessonIdx, 0, sessionToken, currentList);
      }, 900);
      return;
    }

    if (lessonIdx < currentList.length - 1) {
      const nextIdx = lessonIdx + 1;
      const nextLesson = currentList[nextIdx];
      toast(`Chuẩn bị: Bài ${nextIdx + 1}/${currentList.length} — ${nextLesson.title} 🎧`, { icon: '⏭️', duration: 2500 });

      timeoutTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        currentLessonIdxRef.current = nextIdx;
        setCurrentLessonIdx(nextIdx);
        currentLineIdxRef.current = 0;
        setCurrentLineIdx(0);
        playLineAt(nextIdx, 0, sessionToken, currentList);
      }, 1000);
      return;
    }

    if (repeatMode === 'all') {
      toast('Đã hết danh sách! Bắt đầu lặp lại từ đầu bài 1... 🔄', { icon: '🔄', duration: 3000 });
      timeoutTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        currentLessonIdxRef.current = 0;
        setCurrentLessonIdx(0);
        currentLineIdxRef.current = 0;
        setCurrentLineIdx(0);
        playLineAt(0, 0, sessionToken, currentList);
      }, 1200);
    } else {
      stopPlayback(true);
      toast.success(`Đã hoàn thành toàn bộ ${currentList.length} bài hội thoại trong danh sách! 🎉`, { duration: 4000 });
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback(false);
    } else {
      startPlayback(currentLessonIdxRef.current, currentLineIdxRef.current);
    }
  };

  const playNextLesson = (fromIdx = currentLessonIdxRef.current, list = playlist) => {
    if (!list?.length) return;
    const nextIdx = fromIdx < list.length - 1 ? fromIdx + 1 : (repeatMode === 'all' ? 0 : fromIdx);
    startPlayback(nextIdx, 0, list);
  };

  const playPrevLesson = (fromIdx = currentLessonIdxRef.current, list = playlist) => {
    if (!list?.length) return;
    if (currentLineIdxRef.current > 1) {
      startPlayback(fromIdx, 0, list);
      return;
    }
    const prevIdx = fromIdx > 0 ? fromIdx - 1 : 0;
    startPlayback(prevIdx, 0, list);
  };

  const toggleSelectDialogue = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectChapter = (chapter) => {
    const chapterDialogueIds = chapter.dialogues?.map(d => d.id) || [];
    const isAllSelected = chapterDialogueIds.every(id => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !chapterDialogueIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...chapterDialogueIds])));
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(allDialogueIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  if (!isOpen) return null;

  const currentLesson = playlist[currentLessonIdx];
  const currentLine = currentLesson?.dialogueLines?.[currentLineIdx];

  // ================= RENDER MINI FLOATING PLAYER =================
  if (isMinimized) {
    const totalLines = currentLesson?.dialogueLines?.length || 1;
    const progressPercent = Math.min(100, Math.round(((currentLineIdx + 1) / totalLines) * 100));

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-5 left-2.5 right-2.5 sm:left-auto sm:right-6 z-40 max-w-sm sm:w-96 select-none"
      >
        <div className="relative overflow-hidden p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-[#0c101a]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2.5">
          {/* Subtle line progress bar across bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 dark:bg-white/[0.06]">
            <div 
              className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Left Avatar / Equalizer Box */}
          <div 
            onClick={() => setMinimized(false)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071e3] to-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer active:scale-95 transition-transform"
            title="Bấm để mở rộng trình phát"
          >
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            ) : (
              <ListMusic size={17} />
            )}
          </div>

          {/* Center Info - Clicking expands to full player */}
          <div 
            onClick={() => setMinimized(false)}
            className="min-w-0 flex-1 cursor-pointer group"
            title="Bấm để mở rộng trình phát"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">
              <span className="text-[#0071e3] dark:text-sky-400 font-extrabold">
                {currentLesson ? `Bài ${currentLesson.dialogueNumber}` : 'Đang tải...'}
              </span>
              <span>•</span>
              <span className="truncate">{currentLesson?.title || 'Hội thoại'}</span>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-snug group-hover:text-[#0071e3] transition-colors">
              {currentLine?.englishText ? `"${currentLine.englishText}"` : (currentLesson?.titleVi || 'Sẵn sàng phát...')}
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center justify-center shadow-sm shadow-blue-500/25 active:scale-90 transition-transform cursor-pointer"
              title={isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              onClick={() => playNextLesson()}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward size={14} />
            </button>

            <button
              onClick={() => setMinimized(false)}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Mở rộng trình phát"
            >
              <Maximize2 size={13} />
            </button>

            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Đóng trình phát"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ================= RENDER FULL PLAYLIST MODAL =================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl h-[94vh] sm:h-[92vh] sm:max-h-[850px] flex flex-col bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
      >
        
        {/* Top Header Bar */}
        <div className="border-b border-slate-100 dark:border-slate-800 shrink-0 bg-gradient-to-r from-blue-500/10 via-white to-sky-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          {/* Mobile Top Drag Indicator */}
          <div 
            onClick={() => setMinimized(true)}
            className="sm:hidden pt-2 pb-1 cursor-pointer flex justify-center"
            title="Kéo hoặc bấm để thu nhỏ"
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="p-3 sm:p-5 flex items-center justify-between gap-3">
            {/* Desktop Left: Title & Icon */}
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <ListMusic size={20} />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    Playlist Hội Thoại Thực Chiến
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0071e3] dark:bg-blue-950 dark:text-sky-300 shrink-0">
                    Studio AI 🎙️
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Phát liên tục kể cả khi chuyển trang hoặc tắt màn hình điện thoại
                </p>
              </div>
            </div>

            {/* Mobile Left: Back/Minimize button + Current Title */}
            <div className="flex sm:hidden items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
                title="Thu nhỏ xuống góc"
              >
                <ChevronDown size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase text-[#0071e3] dark:text-sky-400 truncate tracking-wide">
                  {currentLesson ? `Chương ${currentLesson.chapterNumber} • Bài ${currentLesson.dialogueNumber} (${currentLessonIdx + 1}/${playlist.length})` : 'Playlist'}
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {currentLesson?.title || 'Trình phát hội thoại'}
                </h3>
              </div>
            </div>

            {/* Action Buttons Right */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setShowVietsub(!showVietsub)}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  showVietsub
                    ? 'border-blue-300 bg-blue-50 text-[#0071e3] dark:bg-blue-950/60 dark:text-sky-300 dark:border-blue-800'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title={showVietsub ? 'Tắt dịch tiếng Việt' : 'Bật dịch tiếng Việt'}
              >
                {showVietsub ? <Eye size={14} className="text-[#0071e3] dark:text-sky-400" /> : <EyeOff size={14} />}
                <span className="hidden sm:inline">{showVietsub ? 'Vietsub: Bật' : 'Vietsub: Tắt'}</span>
              </button>

              <button
                onClick={() => setIsVoiceSettingsOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Cài đặt giọng đọc Studio Neural"
              >
                <Sparkles size={14} className="text-[#0071e3]" />
                <span className="hidden sm:inline">Giọng đọc</span>
              </button>

              <button
                onClick={() => setMinimized(true)}
                className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                title="Thu nhỏ xuống góc màn hình"
              >
                <Minimize2 size={16} />
              </button>

              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
                title="Đóng trình phát"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Segmented Interactive Switcher on Mobile (Lời thoại vs Chọn bài) */}
          <div className="flex sm:hidden p-1 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/60 dark:border-white/[0.06] grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveView('player')}
              className={`py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'player'
                  ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-sky-300 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Music size={13} />
              <span>Lời Thoại Bài Học</span>
            </button>
            <button
              onClick={() => setActiveView('selector')}
              className={`py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'selector'
                  ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-sky-300 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <ListMusic size={13} />
              <span>Danh Sách Bài ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Main Body: 2 Columns on Desktop */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* CỘT TRÁI (4 cols): DANH SÁCH CHỌN BÀI HỌC */}
          <div className={`lg:col-span-4 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 ${
            activeView === 'selector' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Selector Toolbar */}
            <div className="p-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chọn bài ({selectedIds.length}/{allDialogueIds.length})
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                >
                  Tất cả
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Chapters & Dialogues Tree */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 custom-scrollbar">
              {book?.chapters?.map(chapter => {
                const chapterDialogueIds = chapter.dialogues?.map(d => d.id) || [];
                const selectedInChapter = chapterDialogueIds.filter(id => selectedIds.includes(id)).length;
                const isAllChapterSelected = selectedInChapter === chapterDialogueIds.length && chapterDialogueIds.length > 0;
                const isExpanded = expandedChapters[chapter.id] ?? true;

                return (
                  <div 
                    key={chapter.id}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm"
                  >
                    {/* Chapter Header */}
                    <div className="p-2.5 flex items-center justify-between gap-2 bg-slate-100/60 dark:bg-slate-800">
                      <div className="flex items-center gap-2 truncate">
                        <button
                          type="button"
                          onClick={() => toggleSelectChapter(chapter)}
                          className="text-blue-600 dark:text-blue-400 p-0.5 hover:scale-110 transition-transform"
                        >
                          {isAllChapterSelected ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : selectedInChapter > 0 ? (
                            <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[10px] font-black text-blue-600">
                              -
                            </div>
                          ) : (
                            <Square size={16} className="text-slate-400" />
                          )}
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate font-vietsub">
                          Chương {chapter.chapterNumber < 10 ? `0${chapter.chapterNumber}` : chapter.chapterNumber}: {chapter.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {selectedInChapter}/{chapterDialogueIds.length}
                        </span>
                        <button
                          onClick={() => setExpandedChapters(prev => ({ ...prev, [chapter.id]: !isExpanded }))}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Dialogues List */}
                    {isExpanded && (
                      <div className="p-1 space-y-0.5">
                        {chapter.dialogues?.map(dialogue => {
                          const isSelected = selectedIds.includes(dialogue.id);
                          const isCurrentlyPlaying = currentLesson?.id === dialogue.id;

                          return (
                            <div
                              key={dialogue.id}
                              onClick={() => toggleSelectDialogue(dialogue.id)}
                              className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isCurrentlyPlaying
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-200 font-bold shadow-sm'
                                  : isSelected
                                  ? 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {isSelected ? (
                                  <CheckSquare size={14} className="text-[#0071e3] shrink-0" />
                                ) : (
                                  <Square size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <span className="truncate">
                                  {dialogue.dialogueNumber}. {dialogue.title}
                                </span>
                              </div>

                              {isCurrentlyPlaying && isPlaying && (
                                <div className="flex items-end gap-0.5 h-3 text-[#0071e3] dark:text-sky-400 shrink-0">
                                  <span className="equalizer-bar" />
                                  <span className="equalizer-bar" />
                                  <span className="equalizer-bar" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Apply / Start button for Selector */}
            <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                disabled={selectedIds.length === 0}
                onClick={() => {
                  setActiveView('player');
                  startPlayback(0, 0);
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                  selectedIds.length > 0
                    ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-blue-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play size={14} fill="currentColor" />
                <span>Bắt Đầu Nghe ({selectedIds.length} bài)</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (8 cols): KHU VỰC PHÁT HỘI THOẠI CHÍNH */}
          <div className={`lg:col-span-8 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 ${
            activeView === 'player' ? 'flex' : 'hidden lg:flex'
          }`}>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-500">Đang chuẩn bị playlist hội thoại...</p>
              </div>
            ) : playlist.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 text-center">
                <ListMusic size={40} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Chưa chọn bài học nào để phát
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Hãy chọn ít nhất 1 bài hội thoại từ danh sách bên trái để bắt đầu luyện nghe!
                </p>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 cursor-pointer"
                >
                  Chọn tất cả 34 bài
                </button>
              </div>
            ) : (
              <>
                {/* NOW PLAYING HERO CARD (Unified for clutter-free learning) */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        currentLine && ['leo', 'vbace', 'bino'].some(k => currentLine.characterName?.toLowerCase().includes(k))
                          ? 'bg-[#0071e3] text-white shadow-2xs'
                          : 'bg-indigo-600 text-white shadow-2xs'
                      }`}>
                        {currentLine?.characterName || 'LEO'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Câu {currentLineIdx + 1}/{currentLesson?.dialogueLines?.length || 0}
                      </span>
                      {isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 text-[#0071e3] ml-1">
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                        Bài {currentLessonIdx + 1}/{playlist.length}
                      </span>
                      {/* Mini sentence progress bar */}
                      <div className="w-16 sm:w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0071e3] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round(((currentLineIdx + 1) / (currentLesson?.dialogueLines?.length || 1)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[15px] sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    "{currentLine?.englishText || 'Sẵn sàng phát hội thoại...'}"
                  </p>

                  {showVietsub && currentLine?.vietnameseText && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-vietsub font-medium leading-relaxed">
                      ({currentLine.vietnameseText})
                    </p>
                  )}
                </div>

                {/* Scrollable Dialogue Lines List */}
                <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2 custom-scrollbar">
                  {currentLesson?.dialogueLines?.map((line, idx) => {
                    const isActive = idx === currentLineIdx;
                    const isBino = ['leo', 'vbace', 'bino'].some(k => line.characterName?.toLowerCase().includes(k));

                    return (
                      <div
                        key={line.id || idx}
                        ref={el => (lineRefs.current[idx] = el)}
                        onClick={() => {
                          if (isPlaying) speechService.stop();
                          playLineAt(currentLessonIdx, idx, playSessionTokenRef.current);
                        }}
                        className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-[#0071e3]/60 dark:border-sky-500 shadow-sm ring-1 ring-[#0071e3]/30 border-l-[4px] border-l-[#0071e3]'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 border-l-[3px] border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                isBino ? 'bg-[#0071e3] text-white' : 'bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-slate-300'
                              }`}>
                                {line.characterName}
                              </span>
                              {isActive && isPlaying && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#0071e3] dark:text-sky-400">
                                  <Volume2 size={11} className="animate-pulse" /> Đang đọc
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              "{line.englishText}"
                            </p>

                            {showVietsub && line.vietnameseText && (
                              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-vietsub font-medium">
                                ({line.vietnameseText})
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className={`p-1.5 rounded-lg shrink-0 cursor-pointer ${
                              isActive ? 'text-[#0071e3]' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Media Controls Bar */}
                {/* 1. Mobile Native Controls Bar (block sm:hidden) */}
                <div className="block sm:hidden p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md space-y-2 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    {/* Speed Cycle Button */}
                    <button
                      type="button"
                      onClick={handleCycleSpeed}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <Headphones size={12} className="text-[#0071e3]" />
                      <span>{audioSpeed}x</span>
                    </button>

                    {/* Main playback buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => playPrevLesson()}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-transform cursor-pointer"
                        title="Bài trước đó"
                      >
                        <SkipBack size={18} />
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0071e3] to-sky-600 hover:from-[#0077ed] hover:to-sky-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform cursor-pointer"
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                      </button>

                      <button
                        onClick={() => playNextLesson()}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-transform cursor-pointer"
                        title="Bài tiếp theo"
                      >
                        <SkipForward size={18} />
                      </button>
                    </div>

                    {/* Repeat Cycle Button */}
                    <button
                      type="button"
                      onClick={handleCycleRepeat}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 active:scale-95 shadow-2xs transition-colors cursor-pointer ${
                        repeatMode === 'all'
                          ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-300 border border-blue-500/30'
                          : repeatMode === 'one'
                          ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-300 border border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {repeatMode === 'one' ? <Repeat1 size={13} /> : <Repeat size={13} />}
                      <span>{repeatMode === 'all' ? 'Toàn bộ' : repeatMode === 'one' ? '1 bài' : 'Dừng'}</span>
                    </button>
                  </div>

                  {/* Mobile Quick Action Link to dialogue detail page */}
                  {currentLesson?.id && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                      <button
                        onClick={() => {
                          setMinimized(true);
                          navigate(`/communication/dialogue/${currentLesson.id}`);
                        }}
                        className="text-[11px] font-bold text-[#0071e3] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>📖 Mở trang học chi tiết bài này</span>
                        <ArrowRight size={11} />
                      </button>

                      <button
                        onClick={() => setIsVoiceSettingsOpen(true)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} className="text-[#0071e3]" />
                        <span>Giọng AI</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Desktop Controls Bar (hidden sm:flex) */}
                <div className="hidden sm:flex p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shrink-0 flex-row flex-wrap items-center justify-between gap-3 shadow-inner">
                  {/* Desktop Speed Presets */}
                  <div className="flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar rounded-xl bg-white dark:bg-slate-800 p-1 text-[11px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm gap-0.5">
                    {SPEECH_SPEED_PRESETS.map((preset) => {
                      const isSelected = Math.abs(audioSpeed - preset.value) < 0.02;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleChangeSpeed(preset.value)}
                          title={preset.desc}
                          className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                            isSelected
                              ? preset.isSlow
                                ? 'bg-emerald-600 text-white shadow-sm font-black'
                                : 'bg-[#0071e3] text-white shadow-sm font-black'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          {preset.isSlow && <Headphones size={10} className={isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />}
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {/* Main Playback Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => playPrevLesson()}
                        className="p-2 sm:p-2.5 rounded-xl bg-white sm:bg-transparent dark:bg-slate-800 sm:dark:bg-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-90 cursor-pointer"
                        title="Bài trước đó"
                      >
                        <SkipBack size={17} />
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                        <span>{isPlaying ? 'Tạm Dừng' : 'Tiếp Tục'}</span>
                      </button>

                      <button
                        onClick={() => playNextLesson()}
                        className="p-2 sm:p-2.5 rounded-xl bg-white sm:bg-transparent dark:bg-slate-800 sm:dark:bg-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-90 cursor-pointer"
                        title="Bài tiếp theo"
                      >
                        <SkipForward size={17} />
                      </button>
                    </div>

                    {/* Repeat Mode Switch */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm">
                      <button
                        onClick={() => setRepeatMode('all')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          repeatMode === 'all' ? 'bg-[#0071e3] text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Lặp lại toàn bộ danh sách"
                      >
                        <Repeat size={13} />
                        <span className="hidden sm:inline">Toàn bộ</span>
                      </button>

                      <button
                        onClick={() => setRepeatMode('one')}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          repeatMode === 'one' ? 'bg-[#0071e3] text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Lặp lại 1 bài này liên tục"
                      >
                        <Repeat1 size={14} />
                        <span className="hidden sm:inline">1 bài</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
    </div>
  );
}
