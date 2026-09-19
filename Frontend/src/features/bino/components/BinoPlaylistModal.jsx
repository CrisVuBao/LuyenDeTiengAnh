import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, 
  Sparkles, X, Minimize2, Maximize2, Check, CheckSquare, Square, 
  ListMusic, BookOpen, Layers, Clock, ArrowRight, ChevronDown, 
  ChevronRight, Repeat, Repeat1, Eye, EyeOff, Settings,
  Music, Sliders
} from 'lucide-react';
import binoApi from '../../../api/binoApi';
import speechService from '../../../utils/speechService';
import VoiceSettingsModal from '../../../components/VoiceSettingsModal';
import toast from 'react-hot-toast';

export default function BinoPlaylistModal({
  isOpen,
  onClose,
  book,
  initialSelectedIds = null,
  autoStart = false
}) {
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
  const [audioSpeed, setAudioSpeed] = useState(0.95);
  const [repeatMode, setRepeatMode] = useState('all'); // 'all' (lặp toàn playlist), 'one' (lặp 1 bài), 'none' (phát xong dừng)
  const [showVietsub, setShowVietsub] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeView, setActiveView] = useState('player'); // 'player' hoặc 'selector'
  const [expandedChapters, setExpandedChapters] = useState({});
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Refs chống race-condition và stale closures
  const isPlayingRef = useRef(false);
  const playSessionTokenRef = useRef(0);
  const stepTokenRef = useRef(0);
  const currentLessonIdxRef = useRef(0);
  const currentLineIdxRef = useRef(0);
  const playlistRef = useRef([]);
  const timeoutTimerRef = useRef(null);
  const lineRefs = useRef({});

  // Cập nhật selectedIds khi initialSelectedIds thay đổi từ bên ngoài
  useEffect(() => {
    if (initialSelectedIds?.length) {
      setSelectedIds(initialSelectedIds);
    } else if (allDialogueIds.length && selectedIds.length === 0) {
      setSelectedIds(allDialogueIds);
    }
  }, [initialSelectedIds, allDialogueIds]);

  // Tải dữ liệu kịch bản các bài thoại khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    if (selectedIds.length === 0) return;

    setLoading(true);
    const idsParam = selectedIds.length === allDialogueIds.length ? null : selectedIds.join(',');

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
            }, 300);
          }
        }
      })
      .catch(err => {
        console.error('Lỗi tải playlist:', err);
        toast.error('Không thể tải danh sách bài học');
      })
      .finally(() => setLoading(false));
  }, [isOpen, selectedIds.join(',')]);

  // Cuộn mượt đến câu thoại đang phát
  useEffect(() => {
    if (currentLineIdx !== null && lineRefs.current[currentLineIdx]) {
      lineRefs.current[currentLineIdx].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIdx]);

  // Dừng phát âm thanh an toàn
  const stopPlayback = () => {
    playSessionTokenRef.current += 1;
    stepTokenRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    speechService.stop();
  };

  // Khi đóng Modal hoàn toàn
  const handleClose = () => {
    stopPlayback();
    onClose();
  };

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Bắt đầu phát bài học tại vị trí lessonIdx, câu lineIdx
  const startPlayback = (lessonIdx = currentLessonIdxRef.current, lineIdx = 0, currentList = playlistRef.current) => {
    if (!currentList?.length) return;
    stopPlayback();

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

    playLineAt(boundedLessonIdx, lineIdx, sessionToken, currentList);
  };

  // Phát một câu thoại cụ thể
  const playLineAt = (lessonIdx, lineIdx, sessionToken, currentList = playlistRef.current) => {
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

    speechService.speakLine({
      text: line.englishText,
      characterName: line.characterName,
      speed: audioSpeed,
      onEnd: () => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;

        // Nghỉ 450ms rồi chuyển câu tiếp theo trong bài
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAt(lessonIdx, lineIdx + 1, sessionToken, currentList);
        }, 450);
      },
      onError: (err) => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;
        console.warn('[Playlist] Lỗi đọc câu thoại, tự động chuyển tiếp:', err);

        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAt(lessonIdx, lineIdx + 1, sessionToken, currentList);
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
      toast('Đang lặp lại bài hiện tại... 🔁', { icon: '🔂' });
      timeoutTimerRef.current = setTimeout(() => {
        if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
        playLineAt(lessonIdx, 0, sessionToken, currentList);
      }, 1000);
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
      }, 1200);
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
      }, 1500);
    } else {
      stopPlayback();
      toast.success(`Đã hoàn thành toàn bộ ${currentList.length} bài hội thoại trong danh sách! 🎉`, { duration: 4000 });
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
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
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)]"
      >
        <div className="glass-card p-4 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl bg-gradient-to-r from-amber-500/10 via-white to-blue-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 space-y-2.5 animate-pulse-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5 text-amber-500 shrink-0">
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                </div>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              )}
              <div className="truncate">
                <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 truncate">
                  {currentLesson ? `Chương ${currentLesson.chapterNumber} • Bài ${currentLesson.dialogueNumber}` : 'Đang tải...'}
                </p>
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {currentLesson?.title || 'Trình phát hội thoại'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-all"
                title="Mở rộng trình phát"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all"
                title="Đóng trình phát"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {currentLine && (
            <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-xs">
              <p className="font-bold text-slate-900 dark:text-white line-clamp-1 font-vietsub">
                <span className="text-amber-600 dark:text-amber-400 mr-1.5 font-black uppercase text-[10px]">
                  {currentLine.characterName}:
                </span>
                "{currentLine.englishText}"
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-black text-slate-400">
              Bài {currentLessonIdx + 1}/{playlist.length}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => playPrevLesson()}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-90"
              >
                <SkipBack size={15} />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white shadow-md shadow-amber-500/25 transition-all active:scale-90"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              </button>

              <button
                onClick={() => playNextLesson()}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-90"
              >
                <SkipForward size={15} />
              </button>
            </div>
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
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
      >
        
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-gradient-to-r from-amber-500/10 via-white to-blue-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <ListMusic size={20} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Playlist Hội Thoại Bino
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                  Studio AI 🎙️
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Phát liên tục các bài hội thoại đã chọn • Tự động chuyển bài mượt mà
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Tab Switch on Mobile */}
            <div className="flex sm:hidden p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveView('player')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeView === 'player' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Đang phát
              </button>
              <button
                onClick={() => setActiveView('selector')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeView === 'selector' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Chọn ({selectedIds.length})
              </button>
            </div>

            <button
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs font-bold hidden sm:flex items-center gap-1.5"
              title="Cài đặt giọng đọc"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Giọng đọc</span>
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
              title="Thu nhỏ xuống góc màn hình"
            >
              <Minimize2 size={16} />
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-all active:scale-95"
              title="Đóng trình phát"
            >
              <X size={16} />
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
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                                  : isSelected
                                  ? 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {isSelected ? (
                                  <CheckSquare size={14} className="text-blue-600 shrink-0" />
                                ) : (
                                  <Square size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <span className="truncate">
                                  {dialogue.dialogueNumber}. {dialogue.title}
                                </span>
                              </div>

                              {isCurrentlyPlaying && isPlaying && (
                                <div className="flex items-end gap-0.5 h-3 text-amber-600 dark:text-amber-400 shrink-0">
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
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  selectedIds.length > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600'
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
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95"
                >
                  Chọn tất cả 34 bài
                </button>
              </div>
            ) : (
              <>
                {/* Lesson Header Banner */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <span>Chương {currentLesson?.chapterNumber < 10 ? `0${currentLesson?.chapterNumber}` : currentLesson?.chapterNumber}: {currentLesson?.chapterTitle}</span>
                      <span>•</span>
                      <span>Hội thoại {currentLesson?.dialogueNumber}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {currentLesson?.title}
                    </h2>
                    {currentLesson?.titleVi && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-vietsub">
                        {currentLesson.titleVi}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Bài {currentLessonIdx + 1}/{playlist.length}
                    </span>
                    <button
                      onClick={() => setShowVietsub(!showVietsub)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                        showVietsub
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {showVietsub ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span className="hidden sm:inline">Vietsub</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Large Speaking Line Box */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 via-white to-blue-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  {currentLine ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          currentLine.characterName?.toLowerCase().includes('bino')
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}>
                          {currentLine.characterName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Câu {currentLineIdx + 1}/{currentLesson?.dialogueLines?.length || 0}
                        </span>
                        {isPlaying && (
                          <div className="flex items-end gap-0.5 h-3 text-amber-500 ml-1">
                            <span className="equalizer-bar" />
                            <span className="equalizer-bar" />
                            <span className="equalizer-bar" />
                          </div>
                        )}
                      </div>

                      <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                        "{currentLine.englishText}"
                      </p>

                      {showVietsub && currentLine.vietnameseText && (
                        <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-semibold">
                          ({currentLine.vietnameseText})
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sẵn sàng phát hội thoại...</p>
                  )}
                </div>

                {/* Scrollable Dialogue Lines List */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 custom-scrollbar">
                  {currentLesson?.dialogueLines?.map((line, idx) => {
                    const isActive = idx === currentLineIdx;
                    const isBino = line.characterName?.toLowerCase().includes('bino');

                    return (
                      <div
                        key={line.id || idx}
                        ref={el => (lineRefs.current[idx] = el)}
                        onClick={() => {
                          if (isPlaying) speechService.stop();
                          playLineAt(currentLessonIdx, idx, playSessionTokenRef.current);
                        }}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-md ring-2 ring-amber-400/30'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                isBino ? 'bg-orange-500 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              }`}>
                                {line.characterName}
                              </span>
                              {isActive && isPlaying && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  <Volume2 size={11} className="animate-pulse" /> Đang đọc
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              "{line.englishText}"
                            </p>

                            {showVietsub && line.vietnameseText && (
                              <p className="text-xs text-rose-600 dark:text-rose-400 font-vietsub font-medium">
                                ({line.vietnameseText})
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isActive ? 'text-amber-600' : 'text-slate-300 hover:text-slate-500'
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
                <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  {/* Speed selector */}
                  <div className="flex items-center rounded-xl bg-white dark:bg-slate-800 p-1 text-[11px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                    {[0.8, 0.95, 1.1].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setAudioSpeed(speed)}
                        className={`px-2 py-0.5 rounded-lg transition-colors ${
                          Math.abs(audioSpeed - speed) < 0.01
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Main Playback Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playPrevLesson()}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-90"
                      title="Bài trước đó"
                    >
                      <SkipBack size={18} />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                      <span>{isPlaying ? 'Tạm Dừng' : 'Tiếp Tục'}</span>
                    </button>

                    <button
                      onClick={() => playNextLesson()}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-90"
                      title="Bài tiếp theo"
                    >
                      <SkipForward size={18} />
                    </button>
                  </div>

                  {/* Repeat Mode Switch */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm">
                    <button
                      onClick={() => setRepeatMode('all')}
                      className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        repeatMode === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Lặp lại toàn bộ danh sách"
                    >
                      <Repeat size={13} />
                      <span className="hidden sm:inline">Toàn bộ</span>
                    </button>

                    <button
                      onClick={() => setRepeatMode('one')}
                      className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        repeatMode === 'one' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Lặp lại 1 bài này liên tục"
                    >
                      <Repeat1 size={14} />
                      <span className="hidden sm:inline">1 bài</span>
                    </button>
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
