import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Volume2, Bookmark, CheckCircle2, 
  RotateCcw, Sparkles, Mic, Eye, EyeOff, BookOpen, MessageSquare, 
  HelpCircle, ChevronRight, Layers, Award, FileText, Check, Copy, Settings,
  Repeat, Repeat1, Infinity, ChevronDown, X
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

// Chuẩn hóa và kiểm tra chính xác chế độ Lặp Vô Hạn (∞)
const checkIsInfinite = (val) => {
  if (val === 'infinite' || val === 'Infinity' || val === Infinity || val === '∞') return true;
  if (val === 0 || val === '0' || val === -1 || val === '-1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'infinite' || s === 'infinity' || s === '∞' || s.includes('inf') || s.includes('vô hạn') || s === '0' || s === 'all';
  }
  return false;
};

export default function BinoDialogueStudyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson', 'roleplay', 'dictation', 'scan'
  const [showVietsub, setShowVietsub] = useState(true);
  const [addedVocabs, setAddedVocabs] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Audio state
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(null);
  const [audioSpeed, setAudioSpeed] = useState(0.95);
  const lineRefs = useRef({});

  // Repeat state & settings
  const [repeatCount, setRepeatCount] = useState(() => {
    const saved = localStorage.getItem('bino_repeat_count');
    if (checkIsInfinite(saved)) return 'infinite';
    const num = parseInt(saved);
    return num > 0 ? num : 1;
  });
  const [repeatScope, setRepeatScope] = useState(() => {
    return localStorage.getItem('bino_repeat_scope') || 'all'; // 'all' (lặp toàn bài) hoặc 'line' (lặp từng câu)
  });
  const [currentLoopCycle, setCurrentLoopCycle] = useState(1);
  const [currentLineRepeat, setCurrentLineRepeat] = useState(1);
  const [isRepeatMenuOpen, setIsRepeatMenuOpen] = useState(false);
  const [customRepeatInput, setCustomRepeatInput] = useState('');

  // Tracking refs to avoid async stale closures & race conditions
  const isPlayingRef = useRef(false);
  const playSessionTokenRef = useRef(0);
  const stepTokenRef = useRef(0);
  const repeatCountRef = useRef(repeatCount);
  const repeatScopeRef = useRef(repeatScope);
  const currentLoopCycleRef = useRef(1);
  const currentLineRepeatRef = useRef(1);
  const currentLineIndexRef = useRef(0);
  const timeoutTimerRef = useRef(null);
  const repeatMenuRef = useRef(null);

  // Cập nhật đồng bộ tức thì cho chế độ lặp (tránh trễ do async state)
  const handleSelectRepeatCount = (val) => {
    const isInf = checkIsInfinite(val);
    const finalVal = isInf ? 'infinite' : (parseInt(val) || 1);
    setRepeatCount(finalVal);
    repeatCountRef.current = finalVal;
    localStorage.setItem('bino_repeat_count', finalVal.toString());
    setCustomRepeatInput('');
    if (isInf) {
      toast.success('Đã chọn: Lặp Vô Hạn (∞) ✨', { icon: '♾️' });
    } else if (finalVal === 1) {
      toast('Đã chọn: Không lặp (1 lần)', { icon: '⏹️' });
    } else {
      toast.success(`Đã chọn: Lặp ${finalVal} lần!`);
    }
  };

  const handleApplyCustomRepeat = () => {
    const trimmed = customRepeatInput.trim();
    if (!trimmed) {
      setIsRepeatMenuOpen(false);
      if (checkIsInfinite(repeatCountRef.current)) {
        toast.success('Đã áp dụng: Lặp Vô Hạn (∞) ✨', { icon: '♾️' });
      } else {
        toast.success(`Đã áp dụng: Lặp ${repeatCountRef.current} lần!`);
      }
      return;
    }

    if (checkIsInfinite(trimmed)) {
      handleSelectRepeatCount('infinite');
      setIsRepeatMenuOpen(false);
      return;
    }

    const val = parseInt(trimmed);
    if (val > 0) {
      handleSelectRepeatCount(val);
      setIsRepeatMenuOpen(false);
    } else {
      toast.error('Vui lòng nhập số lớn hơn 0 hoặc "vô hạn"');
    }
  };

  const handleSelectRepeatScope = (scope) => {
    setRepeatScope(scope);
    repeatScopeRef.current = scope;
    localStorage.setItem('bino_repeat_scope', scope);
  };

  useEffect(() => {
    const isInf = checkIsInfinite(repeatCount);
    const finalVal = isInf ? 'infinite' : (parseInt(repeatCount) || 1);
    repeatCountRef.current = finalVal;
    localStorage.setItem('bino_repeat_count', finalVal.toString());
  }, [repeatCount]);

  useEffect(() => {
    repeatScopeRef.current = repeatScope;
    localStorage.setItem('bino_repeat_scope', repeatScope);
  }, [repeatScope]);

  // Click outside to close repeat popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (repeatMenuRef.current && !repeatMenuRef.current.contains(e.target)) {
        setIsRepeatMenuOpen(false);
      }
    };
    if (isRepeatMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRepeatMenuOpen]);

  // Tự động scroll mượt mà đến câu thoại tương ứng khi đang phát audio
  useEffect(() => {
    if (activeLineIndex !== null && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  // Dừng phát âm thanh hoàn toàn và reset trạng thái lặp an toàn
  const stopPlayback = () => {
    playSessionTokenRef.current += 1;
    stepTokenRef.current += 1;
    isPlayingRef.current = false;
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    speechService.stop();
    setIsPlayingAll(false);
    setActiveLineIndex(null);
    currentLoopCycleRef.current = 1;
    setCurrentLoopCycle(1);
    currentLineRepeatRef.current = 1;
    setCurrentLineRepeat(1);
  };

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Roleplay state
  const [selectedRole, setSelectedRole] = useState('');
  const [roleplayStep, setRoleplayStep] = useState(0);
  const [roleplayRunning, setRoleplayRunning] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Dynamic roles extraction from real dialogue lines
  const availableRoles = useMemo(() => {
    if (!lesson?.dialogueLines?.length) return ['BẠN BÈ / ĐỒNG NGHIỆP'];
    const roles = [...new Set(lesson.dialogueLines.map(l => l.characterName?.trim()).filter(Boolean))];
    const nonBino = roles.filter(r => !r.toUpperCase().includes('BINO'));
    return nonBino.length > 0 ? nonBino : roles;
  }, [lesson?.dialogueLines]);

  useEffect(() => {
    if (availableRoles.length > 0 && (!selectedRole || !availableRoles.includes(selectedRole))) {
      setSelectedRole(availableRoles[0]);
    }
  }, [availableRoles, selectedRole]);

  // Dictation state
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationInput, setDictationInput] = useState('');
  const [dictationChecked, setDictationChecked] = useState(false);

  useEffect(() => {
    binoApi.getDialogueDetail(id)
      .then((res) => {
        if (res?.data) {
          setLesson(res.data);
          setIsCompleted(res.data.isCompleted);
          const vocabMap = {};
          res.data.vocabularies?.forEach(v => {
            if (v.isInFlashcards) vocabMap[v.id] = true;
          });
          setAddedVocabs(vocabMap);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy bài học:', err);
        toast.error('Không thể tải bài học');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Speech synthesis for pronunciation (using speechService with natural neural voices)
  const speakText = (text, characterName = 'BINO', speed = null) => {
    speechService.speakLine({
      text,
      characterName,
      speed: speed || audioSpeed,
      forceCancel: true
    });
  };

  const speakVocab = (word) => {
    speechService.speakWord(word, audioSpeed);
  };

  // Add word to SRS
  const handleAddToSRS = async (vocab) => {
    try {
      await binoApi.addWordToSRS(vocab.id);
      setAddedVocabs(prev => ({ ...prev, [vocab.id]: true }));
      toast.success(`Đã thêm "${vocab.word}" vào Flashcard ôn tập!`);
    } catch {
      toast.error('Lỗi khi thêm từ vào Flashcard');
    }
  };

  // Mark completion
  const handleToggleComplete = async () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    try {
      await binoApi.markProgress({
        dialogueLessonId: parseInt(id),
        isCompleted: newState,
        timeSpentSeconds: 60
      });
      if (newState) toast.success('Đã hoàn thành bài hội thoại này! 🎉');
    } catch {
      toast.error('Lỗi lưu tiến độ');
    }
  };

  // Bắt đầu một vòng lặp hội thoại mới (Hỗ trợ lặp toàn bài hoặc lặp vô hạn)
  const startDialogueCycle = (cycleNumber) => {
    if (!isPlayingRef.current) return;
    const lines = lesson?.dialogueLines;
    if (!lines?.length) {
      stopPlayback();
      return;
    }

    const currentSession = playSessionTokenRef.current;
    const isInfinite = checkIsInfinite(repeatCountRef.current) || checkIsInfinite(repeatCount);
    const maxCycles = isInfinite ? Infinity : (parseInt(repeatCountRef.current) || 1);

    currentLoopCycleRef.current = cycleNumber;
    setCurrentLoopCycle(cycleNumber);
    currentLineIndexRef.current = 0;
    currentLineRepeatRef.current = 1;
    setCurrentLineRepeat(1);

    if (cycleNumber > 1) {
      toast(`Vòng lặp ${cycleNumber}${isInfinite ? ' (Vô hạn)' : `/${maxCycles}`}`, {
        icon: '🔄',
        duration: 2500
      });
    }

    playLineAtIndex(0, cycleNumber, currentSession);
  };

  // Phát câu thoại tại vị trí index trong vòng lặp cycleNumber
  const playLineAtIndex = (index, cycleNumber, sessionToken) => {
    if (!isPlayingRef.current) return;
    if (sessionToken !== playSessionTokenRef.current) return;

    const lines = lesson?.dialogueLines;
    if (!lines?.length) {
      stopPlayback();
      return;
    }

    // Đã hoàn thành toàn bộ các câu thoại trong bài của lượt này
    if (index >= lines.length) {
      const isInfinite = checkIsInfinite(repeatCountRef.current) || checkIsInfinite(repeatCount);
      const maxCycles = isInfinite ? Infinity : (parseInt(repeatCountRef.current) || 1);

      console.log('[playLineAtIndex] Đã kết thúc lượt nghe:', {
        cycleNumber,
        maxCycles,
        isInfinite,
        scope: repeatScopeRef.current
      });

      // Kiểm tra có cần tiếp tục lặp vòng mới không (Lặp Vô Hạn luôn luôn lặp tiếp)
      if (isInfinite || cycleNumber < maxCycles) {
        const nextCycle = cycleNumber + 1;
        // Nghỉ 800ms giữa 2 vòng để người nghe kịp chuẩn bị và giọng đọc ổn định
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          startDialogueCycle(nextCycle);
        }, 800);
        return;
      } else {
        // Đã hoàn thành đầy đủ tất cả các vòng lặp!
        stopPlayback();
        toast.success(`Đã hoàn thành toàn bộ bài nghe (${cycleNumber} vòng)! 🎉`, {
          duration: 3500
        });
        return;
      }
    }

    // Cập nhật câu thoại đang phát
    currentLineIndexRef.current = index;
    setActiveLineIndex(index);

    const line = lines[index];
    const currentStep = ++stepTokenRef.current;

    speechService.speakLine({
      text: line.englishText,
      characterName: line.characterName,
      speed: audioSpeed,
      onEnd: () => {
        if (!isPlayingRef.current) return;
        if (sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return; // Chặn double event / race condition

        if (repeatScopeRef.current === 'line') {
          // Chế độ lặp từng câu
          const isInfinite = checkIsInfinite(repeatCountRef.current) || checkIsInfinite(repeatCount);
          const maxLineRepeat = isInfinite ? Infinity : (parseInt(repeatCountRef.current) || 1);

          if (isInfinite || currentLineRepeatRef.current < maxLineRepeat) {
            currentLineRepeatRef.current += 1;
            setCurrentLineRepeat(currentLineRepeatRef.current);
            timeoutTimerRef.current = setTimeout(() => {
              if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
              playLineAtIndex(index, cycleNumber, sessionToken);
            }, 450);
            return;
          } else {
            // Câu hiện tại đã lặp đủ số lần -> chuyển câu tiếp theo
            currentLineRepeatRef.current = 1;
            setCurrentLineRepeat(1);
            timeoutTimerRef.current = setTimeout(() => {
              if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
              playLineAtIndex(index + 1, cycleNumber, sessionToken);
            }, 500);
            return;
          }
        } else {
          // Chế độ lặp toàn bài -> chuyển sang câu tiếp theo
          timeoutTimerRef.current = setTimeout(() => {
            if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
            playLineAtIndex(index + 1, cycleNumber, sessionToken);
          }, 450);
        }
      },
      onError: (err) => {
        if (!isPlayingRef.current) return;
        if (sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;
        console.warn('[playLineAtIndex] speech warning on line', index, err);
        // Tự động chuyển tiếp câu sau 600ms tránh kẹt
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAtIndex(index + 1, cycleNumber, sessionToken);
        }, 600);
      }
    });
  };

  // Play dialogue lines in sequence with dramatized character voices & repeat loops
  const playAllLines = () => {
    if (!lesson?.dialogueLines?.length) return;
    if (isPlayingAll) {
      stopPlayback();
      return;
    }

    stopPlayback();
    isPlayingRef.current = true;
    setIsPlayingAll(true);

    // Đồng bộ giá trị lặp từ state / localStorage
    const savedRepeatCount = localStorage.getItem('bino_repeat_count');
    if (checkIsInfinite(savedRepeatCount) || checkIsInfinite(repeatCount) || checkIsInfinite(repeatCountRef.current)) {
      repeatCountRef.current = 'infinite';
      setRepeatCount('infinite');
    } else {
      const parsed = parseInt(savedRepeatCount) || parseInt(repeatCount) || parseInt(repeatCountRef.current) || 1;
      repeatCountRef.current = parsed;
      setRepeatCount(parsed);
    }

    const savedRepeatScope = localStorage.getItem('bino_repeat_scope') || repeatScope || 'all';
    repeatScopeRef.current = savedRepeatScope;

    startDialogueCycle(1);
  };

  // Speech Recognition for Roleplay
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome nhé!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserTranscript(transcript);
      setIsListening(false);
      toast.success(`Đã nhận diện: "${transcript}"`);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Không nghe rõ, bác thử lại nhé!');
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (loading) return <PageLoader />;
  if (!lesson) return <div className="p-8 text-center text-slate-500">Không tìm thấy bài học</div>;

  const currentDictationLine = lesson?.dialogueLines?.[dictationIndex];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bino')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Chương {lesson.chapterNumber < 10 ? `0${lesson.chapterNumber}` : lesson.chapterNumber}: {lesson.chapterTitle}</span>
              <span>•</span>
              <span>Hội thoại {lesson.dialogueNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Complete Toggle */}
        <button
          onClick={handleToggleComplete}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
            isCompleted
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
          }`}
        >
          <CheckCircle2 size={16} className={isCompleted ? 'text-emerald-600' : 'text-slate-400'} />
          <span>{isCompleted ? 'Đã Hoàn Thành ✓' : 'Đánh Dấu Hoàn Thành'}</span>
        </button>
      </div>

      {/* Global Audio / Media Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 relative z-30 flex flex-wrap items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-blue-50/50 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Pause All Lines */}
          <button
            onClick={playAllLines}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
              isPlayingAll
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
            }`}
          >
            {isPlayingAll ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            <span>
              {isPlayingAll
                ? checkIsInfinite(repeatCount)
                  ? `Tạm Dừng (${activeLineIndex !== null ? `Câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0}` : 'Đang phát'} • Vòng ${currentLoopCycle}/∞)`
                  : repeatCount === 1
                  ? `Tạm Dừng (${activeLineIndex !== null ? `Câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0}` : 'Đang phát'})`
                  : repeatScope === 'all'
                  ? `Tạm Dừng (${activeLineIndex !== null ? `Câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0}` : 'Đang phát'} • Vòng ${currentLoopCycle}/${repeatCount})`
                  : `Tạm Dừng (${activeLineIndex !== null ? `Câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0}` : 'Đang phát'} • Lặp ${currentLineRepeat}/${repeatCount})`
                : 'Nghe Toàn Bài Hội Thoại'}
            </span>
          </button>

          {/* Speed selector */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-bold">
            {[0.8, 0.95, 1.1].map(speed => (
              <button
                key={speed}
                onClick={() => setAudioSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  Math.abs(audioSpeed - speed) < 0.01
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Repeat Selector Popover */}
          <div className="relative z-40" ref={repeatMenuRef}>
            <button
              onClick={() => setIsRepeatMenuOpen(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border ${
                checkIsInfinite(repeatCount)
                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                  : repeatCount !== 1
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
              title="Cài đặt số lần lặp lại khi nghe hội thoại"
            >
              {checkIsInfinite(repeatCount) ? (
                <Infinity size={15} className="text-purple-600 dark:text-purple-400" />
              ) : (
                <Repeat size={14} className={repeatCount !== 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
              )}
              <span>
                {checkIsInfinite(repeatCount)
                  ? 'Lặp: Vô Hạn (∞)'
                  : repeatCount === 1
                  ? 'Lặp: 1 lần'
                  : `Lặp: ${repeatCount} lần`}
              </span>
              {(checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-amber-200/90 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                  {repeatScope === 'all' ? 'Toàn bài' : 'Từng câu'}
                </span>
              )}
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isRepeatMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Repeat Popover Dropdown */}
            {isRepeatMenuOpen && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-amber-500" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Cài Đặt Lặp Lại Hội Thoại
                    </span>
                  </div>
                  <button
                    onClick={() => setIsRepeatMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Scope: Lặp toàn bài vs Lặp từng câu */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kiểu lặp lại:</span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    <button
                      onClick={() => handleSelectRepeatScope('all')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        repeatScope === 'all'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <RotateCcw size={12} />
                      <span>Lặp Toàn Bài</span>
                    </button>
                    <button
                      onClick={() => handleSelectRepeatScope('line')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        repeatScope === 'line'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Repeat1 size={13} />
                      <span>Lặp Từng Câu</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    {repeatScope === 'all'
                      ? '💡 Đọc từ đầu đến cuối bài rồi quay lại lặp tiếp vòng mới.'
                      : '💡 Mỗi câu thoại sẽ được đọc lặp lại xong rồi mới qua câu tiếp theo.'}
                  </p>
                </div>

                {/* Preset Count Options */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Số lần lặp lại:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: '1 lần', value: 1 },
                      { label: '2 lần', value: 2 },
                      { label: '3 lần', value: 3 },
                      { label: '5 lần', value: 5 },
                      { label: '10 lần', value: 10 },
                      { label: 'Vô hạn ∞', value: 'infinite', isSpecial: true },
                    ].map(opt => {
                      const isSelected = opt.isSpecial
                        ? checkIsInfinite(repeatCount)
                        : (!checkIsInfinite(repeatCount) && repeatCount === opt.value);
                      return (
                        <button
                          type="button"
                          key={String(opt.value)}
                          onClick={() => handleSelectRepeatCount(opt.value)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border relative ${
                            isSelected
                              ? opt.isSpecial
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30 ring-2 ring-purple-400/40'
                                : 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {isSelected && <Check size={11} strokeWidth={3} />}
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hoặc tự nhập số lần tùy thích:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ví dụ: 15, 20 hoặc vô hạn..."
                      value={customRepeatInput}
                      onChange={(e) => setCustomRepeatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCustomRepeat();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomRepeat}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Áp Dụng
                    </button>
                  </div>
                </div>

                {/* Explanation Banner */}
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  {checkIsInfinite(repeatCount) ? (
                    <p>
                      ✨ <strong>Đang chọn: Lặp Vô Hạn (∞)</strong> — Hội thoại sẽ phát lặp liên tục không dừng. Khi nào muốn dừng cậu chỉ cần bấm <strong>"Tạm Dừng"</strong>!
                    </p>
                  ) : (
                    <p>
                      🔁 <strong>Đang chọn: Lặp {repeatCount} lần</strong> — Máy sẽ phát lặp lại đúng {repeatCount} lần rồi tự động dừng.
                    </p>
                  )}
                </div>

                {/* Confirm & Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsRepeatMenuOpen(false);
                    if (checkIsInfinite(repeatCount)) {
                      toast.success('Đã lưu: Lặp Vô Hạn (∞) ✨', { icon: '♾️' });
                    } else {
                      toast.success(`Đã lưu: Lặp ${repeatCount} lần!`);
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Xong & Đóng Menu</span>
                </button>
              </div>
            )}
          </div>

          {/* Studio Voice Settings Button */}
          <button
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Tùy chỉnh giọng đọc Studio Neural"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Giọng Đọc Studio AI 🎙️</span>
          </button>
        </div>

        {/* Toggle vietsub */}
        <button
          onClick={() => setShowVietsub(prev => !prev)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          {showVietsub ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showVietsub ? 'Tắt Dịch Tiếng Việt' : 'Bật Dịch Tiếng Việt'}</span>
        </button>
      </div>

      {/* 4 Interactive Study Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'lesson', label: '📖 Bài Học & Từ Khóa', icon: BookOpen },
          { id: 'roleplay', label: '🗣️ Luyện Phản Xạ 1:1', icon: MessageSquare },
          { id: 'dictation', label: '🎧 Chép Chính Tả', icon: FileText },
          { id: 'scan', label: '🖼️ Xem Trang Sách Gốc', icon: Eye },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BÀI HỌC & TỪ KHÓA (Giao diện sách số hóa chuẩn phong cách Bino) */}
      {/* ========================================================================= */}
      {activeTab === 'lesson' && (
        <div className="space-y-8">
          
          {/* 1. KEY WORDS (TỪ KHÓA GHIM NOTE PHONG CÁCH SÁCH BINO) */}
          {lesson?.vocabularies?.length > 0 && (
            <div className="relative p-6 sm:p-8 rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-800/80 shadow-md">
              {/* Decorative Pin / Clip Icon */}
              <div className="absolute -top-3 left-8 px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <span>📎 Note Ghi Nhớ</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <span>Key words (Từ khóa)</span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      • {lesson.vocabularies.length} từ trong bài
                    </span>
                  </h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    Bấm vào loa để nghe phát âm chuẩn hoặc bấm "+" để lưu vào bộ Flashcard ôn tập hàng ngày!
                  </p>
                </div>
              </div>

              {/* Vocabularies List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {lesson.vocabularies.map((v) => {
                  const isAdded = addedVocabs[v.id];
                  return (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-amber-200 dark:border-amber-900/50 shadow-sm flex items-center justify-between gap-3 group hover:border-amber-400 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {v.word}
                          </span>
                          {v.phonetic && (
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-vietsub font-medium">
                              {v.phonetic}
                            </span>
                          )}
                          {v.wordType && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                              ({v.wordType})
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                          {v.meaning}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Speaker button */}
                        <button
                          onClick={() => speakVocab(v.word)}
                          className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                          title="Nghe phát âm chuẩn"
                        >
                          <Volume2 size={16} />
                        </button>

                        {/* Add to SRS button */}
                        <button
                          onClick={() => handleAddToSRS(v)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isAdded ? <Check size={13} /> : <span>+</span>}
                          <span className="text-[11px]">{isAdded ? 'Đã nhớ' : 'Flashcard'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. KHUNG HỘI THOẠI SONG NGỮ (TRANSCRIPT THEO LƯỢT THOẠI) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kịch Bản Hội Thoại Song Ngữ</span>
                <span className="text-xs text-slate-400 font-semibold">({lesson.dialogueLines?.length || 0} lượt thoại)</span>
              </h3>
            </div>

            <div className="space-y-3">
              {lesson.dialogueLines?.map((line, idx) => {
                const isActive = activeLineIndex === idx;
                const isBino = line.characterName.toUpperCase().includes('BINO');

                return (
                  <div
                    key={line.id}
                    ref={(el) => { if (el) lineRefs.current[idx] = el; }}
                    className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-400/40 scale-[1.01]'
                        : isBino
                        ? 'bg-orange-50/40 dark:bg-slate-800/80 border-orange-200/60 dark:border-slate-700/80 hover:border-orange-300'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        {/* Character Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            isBino
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}>
                            {line.characterName}
                          </span>
                          {isActive && isPlayingAll && (checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white animate-pulse shadow-sm flex items-center gap-1">
                              {repeatScope === 'all' ? (
                                <>
                                  <RotateCcw size={10} />
                                  <span>Vòng {currentLoopCycle}/{checkIsInfinite(repeatCount) ? '∞' : repeatCount}</span>
                                </>
                              ) : (
                                <>
                                  <Repeat1 size={11} />
                                  <span>Lần {currentLineRepeat}/{checkIsInfinite(repeatCount) ? '∞' : repeatCount}</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* English Line */}
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          "{line.englishText}"
                        </p>

                        {/* Vietnamese Translation (Chuẩn font Be Vietnam Pro, không lỗi dãn dấu 'đế m') */}
                        {showVietsub && line.vietnameseText && (
                          <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-medium leading-relaxed tracking-normal">
                            ({line.vietnameseText})
                          </p>
                        )}
                      </div>

                      {/* Line Audio Play Button */}
                      <button
                        onClick={() => {
                          if (isPlayingAll) {
                            stopPlayback();
                          }
                          setActiveLineIndex(idx);
                          speakText(line.englishText, line.characterName);
                        }}
                        className={`p-2 rounded-xl transition-colors shrink-0 ${
                          isActive
                            ? 'text-amber-600 bg-amber-100/80 dark:bg-amber-900/50'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="Nghe câu này theo giọng nhân vật"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LUYỆN PHẢN XẠ 1:1 (ROLEPLAY VỚI BINO) */}
      {/* ========================================================================= */}
      {activeTab === 'roleplay' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="max-w-xl space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>Luyện Phản Xạ Đóng Vai 1:1 Cùng Bino</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Máy sẽ đóng vai <strong>BINO</strong> và đọc thoại trước. Đến lượt thoại của bạn, hãy đọc to câu thoại bằng tiếng Anh để luyện phản xạ tự nhiên không cần động não!
            </p>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Bạn muốn đóng vai:</span>
            {availableRoles.map(r => (
              <button
                key={r}
                onClick={() => { setSelectedRole(r); setRoleplayStep(0); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === r
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Interactive Roleplay Step Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 to-blue-50/60 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Lượt thoại {roleplayStep + 1} / {lesson.dialogueLines?.length || 8}</span>
              <button
                onClick={() => { setRoleplayStep(0); setUserTranscript(''); }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <RotateCcw size={13} /> Làm lại từ đầu
              </button>
            </div>

            {lesson.dialogueLines?.[roleplayStep] && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                    lesson.dialogueLines[roleplayStep].characterName === selectedRole
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {lesson.dialogueLines[roleplayStep].characterName}
                    {lesson.dialogueLines[roleplayStep].characterName === selectedRole && ' (LƯỢT CỦA BẠN!)'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    "{lesson.dialogueLines[roleplayStep].englishText}"
                  </p>
                  {showVietsub && (
                    <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-medium mt-1">
                      ({lesson.dialogueLines[roleplayStep].vietnameseText})
                    </p>
                  )}
                </div>

                {/* Microphone / Speech button for user */}
                {lesson.dialogueLines[roleplayStep].characterName === selectedRole ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={startSpeechRecognition}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Mic size={15} />
                        <span>{isListening ? 'Đang lắng nghe...' : 'Bấm Nói Câu Này (Speech AI)'}</span>
                      </button>

                      <button
                        onClick={() => speakText(lesson.dialogueLines[roleplayStep].englishText, selectedRole)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                      >
                        <Volume2 size={14} /> Nghe mẫu
                      </button>
                    </div>

                    {userTranscript && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">Máy nghe được: </span>
                        <span className="italic">"{userTranscript}"</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => speakText(lesson.dialogueLines[roleplayStep].englishText, lesson.dialogueLines[roleplayStep].characterName)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <Volume2 size={15} /> Phát giọng {lesson.dialogueLines[roleplayStep].characterName}
                  </button>
                )}

                {/* Navigation in roleplay */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    disabled={roleplayStep === 0}
                    onClick={() => { setRoleplayStep(prev => prev - 1); setUserTranscript(''); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 disabled:opacity-40"
                  >
                    Câu Trước
                  </button>

                  <button
                    onClick={() => {
                      if (roleplayStep < lesson.dialogueLines.length - 1) {
                        setRoleplayStep(prev => prev + 1);
                        setUserTranscript('');
                      } else {
                        toast.success('Xuất sắc! Bác đã hoàn thành cuộc hội thoại!');
                      }
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1"
                  >
                    <span>{roleplayStep < lesson.dialogueLines.length - 1 ? 'Câu Tiếp Theo' : 'Hoàn Thành!'}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHÉP CHÍNH TẢ (DICTATION) */}
      {/* ========================================================================= */}
      {activeTab === 'dictation' && currentDictationLine && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              <span>Luyện Nghe & Chép Chính Tả (Dictation)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bấm nghe câu thoại và gõ lại đúng từng từ tiếng Anh để luyện khả năng nghe âm nối và nhớ chính tả.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Câu {dictationIndex + 1} / {lesson.dialogueLines.length}
              </span>

              <button
                onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.85)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Volume2 size={16} /> Nghe Lại (Tốc độ chậm)
              </button>
            </div>

            {/* Input area */}
            <textarea
              value={dictationInput}
              onChange={(e) => { setDictationInput(e.target.value); setDictationChecked(false); }}
              placeholder="Gõ lại câu tiếng Anh bác vừa nghe vào đây..."
              rows={3}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Check button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDictationChecked(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Kiểm Tra Đáp Án
              </button>

              <button
                onClick={() => {
                  if (dictationIndex < lesson.dialogueLines.length - 1) {
                    setDictationIndex(prev => prev + 1);
                    setDictationInput('');
                    setDictationChecked(false);
                  }
                }}
                disabled={dictationIndex >= lesson.dialogueLines.length - 1}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                Câu Kế Tiếp ➔
              </button>
            </div>

            {/* Verification Result */}
            {dictationChecked && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                <span className="text-xs font-bold text-slate-400 block uppercase">Đáp án chuẩn:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentDictationLine.englishText}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-vietsub font-medium">
                  ({currentDictationLine.vietnameseText})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: XEM TRANG SÁCH GỐC (ẢNH THỰC TẾ TRANG 15 & 16 CỦA USER) */}
      {/* ========================================================================= */}
      {activeTab === 'scan' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={20} className="text-amber-500" />
              <span>Bản Quét Trang Sách Gốc (Trang 15 & 16)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              So sánh trực tiếp giao diện số hóa với trang sách in thực tế của tác giả Bino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500">Trang 15: Chapter 01 - Hội thoại 3</span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                <img
                  src="/images/bino/page15.jpg"
                  alt="Trang 15 sách Bino"
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500">Trang 16: Chapter 01 - Hội thoại 4</span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                <img
                  src="/images/bino/page16.jpg"
                  alt="Trang 16 sách Bino"
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Studio Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

    </div>
  );
}
