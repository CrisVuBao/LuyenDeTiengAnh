import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Play, Pause, Volume2, Bookmark, CheckCircle2, 
  RotateCcw, Sparkles, Mic, Eye, EyeOff, BookOpen, MessageSquare, 
  HelpCircle, ChevronRight, Layers, Award, FileText, Check, Copy, Settings,
  Repeat, Repeat1, Infinity as InfinityIcon, ChevronDown, X, ListMusic,
  Share2, ZoomIn, Lightbulb, Headphones, Gauge
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import { invalidateStatsCache } from '../../api/dashboardAndAiApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import { useBinoPlayerStore } from './components/BinoPlaylistModal';
import BinoSentenceExpansionCard from './components/BinoSentenceExpansionCard';
import BinoLearningGuideModal from './components/BinoLearningGuideModal';
import { getExpansionsForLine } from './data/binoSentenceExpansions';
import speechService, { SPEECH_SPEED_PRESETS } from '../../utils/speechService';
import { startSmartSpeechSession } from '../../utils/smartSpeechRecognition';
import { evaluateSentenceAttempt } from '../reflex50/store/useReflex50Store';
import useAuthStore from '../../store/authStore';
import useGamificationStore from '../gamification/store/useGamificationStore';
import toast from 'react-hot-toast';

const getLocalFlashcardKey = () => {
  const uid = useAuthStore.getState().user?.id || 'guest';
  return `vbace_local_flashcard_ids_v1_u_${uid}`;
};

const getLocalFlashcardMap = () => {
  try {
    const raw = localStorage.getItem(getLocalFlashcardKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setLocalFlashcardState = (vocabId, isAdded) => {
  try {
    const current = getLocalFlashcardMap();
    if (isAdded) {
      current[vocabId] = true;
    } else {
      delete current[vocabId];
    }
    localStorage.setItem(getLocalFlashcardKey(), JSON.stringify(current));
  } catch {
    // ignore
  }
};

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
  const [lesson, setLesson] = useState(() => binoApi.peekDialogueDetail(id));
  const [book, setBook] = useState(() => binoApi.peekBookOverview());
  const [loading, setLoading] = useState(() => !binoApi.peekDialogueDetail(id));
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson', 'roleplay', 'dictation'
  const [showVietsub, setShowVietsub] = useState(true);
  const [addedVocabs, setAddedVocabs] = useState(() => getLocalFlashcardMap());
  const [togglingVocabId, setTogglingVocabId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const openPlaylist = useBinoPlayerStore((state) => state.openPlaylist);
  const handOffSingleLesson = useBinoPlayerStore((state) => state.handOffSingleLesson);
  const closeGlobalPlayer = useBinoPlayerStore((state) => state.closePlayer);

  useEffect(() => {
    binoApi.getBookOverview().then(res => {
      if (res?.data) setBook(res.data);
    }).catch(() => {});
  }, []);

  // Audio state (Đồng bộ tốc độ mặc định từ speechService)
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(null);
  const [audioSpeed, setAudioSpeed] = useState(() => speechService.preferences?.rate || 0.95);
  const lineRefs = useRef({});
  const lessonRef = useRef(lesson);
  const audioSpeedRef = useRef(audioSpeed);

  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

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

  // Cập nhật đồng bộ tức thì cho chế độ lặp
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

  // Dừng phát âm thanh hoàn toàn và reset an toàn
  const stopPlayback = (stopKeepAlive = false) => {
    playSessionTokenRef.current += 1;
    stepTokenRef.current += 1;
    isPlayingRef.current = false;
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    speechService.stop(stopKeepAlive);
    setIsPlayingAll(false);
    setActiveLineIndex(null);
    currentLoopCycleRef.current = 1;
    setCurrentLoopCycle(1);
    currentLineRepeatRef.current = 1;
    setCurrentLineRepeat(1);
  };

  // Khi chuyển sang trang khác lúc đang phát bài hội thoại -> Tự động chuyển sang Mini Floating Player toàn cục, KHÔNG tắt nhạc!
  useEffect(() => {
    return () => {
      if (isPlayingRef.current && lessonRef.current) {
        const activeLesson = lessonRef.current;
        const activeIdx = currentLineIndexRef.current || 0;
        const speed = audioSpeedRef.current || 0.95;
        if (timeoutTimerRef.current) {
          clearTimeout(timeoutTimerRef.current);
          timeoutTimerRef.current = null;
        }
        isPlayingRef.current = false;
        handOffSingleLesson({
          lesson: activeLesson,
          lineIdx: activeIdx,
          speed,
          repeatMode: 'one',
        });
      }
    };
  }, [handOffSingleLesson]);

  // Roleplay & Inline Speaking state
  const [selectedRole, setSelectedRole] = useState('');
  const [roleplayStep, setRoleplayStep] = useState(0);
  const [roleplayRunning, setRoleplayRunning] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [roleplayEval, setRoleplayEval] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [inlineSpeakIndex, setInlineSpeakIndex] = useState(null);
  const [inlineSpeakTranscript, setInlineSpeakTranscript] = useState('');
  const [inlineSpeakEval, setInlineSpeakEval] = useState(null);
  const speechSessionRef = useRef(null);

  // Dynamic roles extraction from real dialogue lines
  const availableRoles = useMemo(() => {
    if (!lesson?.dialogueLines?.length) return ['BẠN BÈ / ĐỒNG NGHIỆP'];
    const roles = [...new Set(lesson.dialogueLines.map(l => l.characterName?.trim()).filter(Boolean))];
    const nonMain = roles.filter(r => {
      const upper = r.toUpperCase();
      return !upper.includes('LEO') && !upper.includes('VBACE') && !upper.includes('BINO');
    });
    return nonMain.length > 0 ? nonMain : roles;
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
    const localMap = getLocalFlashcardMap();
    const cached = binoApi.peekDialogueDetail(id);
    if (cached) {
      setLesson(cached);
      setIsCompleted(!!cached.isCompleted);
      const vocabMap = { ...localMap };
      cached.vocabularies?.forEach(v => {
        if (v.isInFlashcards) vocabMap[v.id] = true;
      });
      setAddedVocabs(vocabMap);
      setLoading(false);
    } else {
      setLoading(true);
    }

    binoApi.getDialogueDetail(id)
      .then((res) => {
        if (res?.data) {
          setLesson(res.data);
          setIsCompleted(res.data.isCompleted);
          const freshLocalMap = getLocalFlashcardMap();
          const vocabMap = { ...freshLocalMap };
          res.data.vocabularies?.forEach(v => {
            if (v.isInFlashcards) {
              vocabMap[v.id] = true;
              setLocalFlashcardState(v.id, true);
            }
          });
          setAddedVocabs(vocabMap);
          if (res.data.dialogueLines?.length) {
            speechService.preloadDialogueLines(res.data.dialogueLines, 0, 3);
          }
          // Tự động tải trước bài học kế tiếp vào RAM để bấm "Bài tiếp" trong 0ms
          const nextId = Number(id) + 1;
          if (nextId <= 72) {
            binoApi.prefetchDialogue(nextId);
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy bài học:', err);
        if (!cached) toast.error('Không thể tải bài học');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const lastListenLineRef = useRef({});
  const recordBinoListen = (lineKey) => {
    const now = Date.now();
    const last = lastListenLineRef.current[lineKey] || 0;
    if (now - last > 4000) {
      lastListenLineRef.current[lineKey] = now;
      try {
        useGamificationStore.getState().earnXP(3, 'bino_listen', 'Luyện nghe câu thoại Giao Tiếp 72');
      } catch {}
    }
  };

  // Speech synthesis for pronunciation
  const speakText = (text, characterName = 'LEO', speed = null) => {
    recordBinoListen(text);
    speechService.speakLine({
      text,
      characterName,
      speed: speed || audioSpeedRef.current || audioSpeed,
      forceCancel: true
    });
  };

  const speakVocab = (word, speed = null) => {
    speechService.speakWord(word, speed || audioSpeedRef.current || audioSpeed);
  };

  // Toggle từ vựng trong bộ Flashcard SRS (Bấm lần 1: Thêm vào Flashcard • Bấm lần 2: Thoát/Gỡ khỏi Flashcard — Phản hồi 0ms)
  const handleAddToSRS = async (vocab) => {
    if (!vocab?.id) return;
    const currentlyAdded = !!addedVocabs[vocab.id];
    const nextState = !currentlyAdded;

    // Optimistic UI update ngay lập tức (0ms, cực kỳ mượt mà)
    setTogglingVocabId(vocab.id);
    setAddedVocabs(prev => {
      const next = { ...prev };
      if (nextState) {
        next[vocab.id] = true;
      } else {
        delete next[vocab.id];
      }
      return next;
    });
    setLocalFlashcardState(vocab.id, nextState);

    if (nextState) {
      toast.success(`Đã lưu "${vocab.word}" vào Flashcard! (Bấm lần nữa để bỏ)`, {
        id: `srs-${vocab.id}`,
        duration: 2000,
      });
      try {
        await binoApi.addWordToSRS(vocab.id);
      } catch {
        // Giữ nguyên trong localStorage để người dùng vẫn trải nghiệm trơn tru
      } finally {
        setTogglingVocabId(null);
      }
    } else {
      toast(`Đã thoát "${vocab.word}" khỏi + Flashcard`, {
        id: `srs-${vocab.id}`,
        icon: '↩️',
        duration: 1800,
      });
      try {
        await binoApi.removeWordFromSRS(vocab.id);
      } catch {
        // ignore
      } finally {
        setTogglingVocabId(null);
      }
    }
  };

  const sessionStartRef = useRef(Date.now());
  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, [id]);

  const consumeElapsedSeconds = () => {
    const now = Date.now();
    const elapsed = Math.max(5, Math.min(1800, Math.round((now - sessionStartRef.current) / 1000)));
    sessionStartRef.current = now;
    return elapsed;
  };

  // Mark completion
  const handleToggleComplete = async () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    try {
      await binoApi.markProgress({
        dialogueLessonId: parseInt(id),
        isCompleted: newState,
        timeSpentSeconds: consumeElapsedSeconds()
      });
      invalidateStatsCache();
      if (newState) {
        toast.success('Đã hoàn thành bài hội thoại này! 🎉');
        useGamificationStore.getState().earnXP(25, 'bino_dialogue', 'Hoàn thành bài hội thoại Giao Tiếp 72');
      }
    } catch {
      toast.error('Lỗi lưu tiến độ');
    }
  };

  // Bắt đầu một vòng lặp hội thoại mới
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

      // Tự động ghi nhận đã nghe hết bài hội thoại vào tiến độ học tập
      binoApi.markProgress({
        dialogueLessonId: parseInt(id),
        hasWatchedVideo: true,
        timeSpentSeconds: consumeElapsedSeconds()
      }).then(() => invalidateStatsCache()).catch(() => {});

      if (isInfinite || cycleNumber < maxCycles) {
        const nextCycle = cycleNumber + 1;
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          startDialogueCycle(nextCycle);
        }, 800);
        return;
      } else {
        stopPlayback();
        toast.success(`Đã hoàn thành toàn bộ bài nghe (${cycleNumber} vòng)! 🎉`, {
          duration: 3500
        });
        return;
      }
    }

    currentLineIndexRef.current = index;
    setActiveLineIndex(index);

    const line = lines[index];
    const currentStep = ++stepTokenRef.current;
    recordBinoListen(line.englishText);

    // Tải trước (pre-fetch) 3 câu tiếp theo vào RAM để chuyển câu phát tức thì 0ms
    speechService.preloadDialogueLines(lines, index + 1, 3);

    speechService.speakLine({
      text: line.englishText,
      characterName: line.characterName,
      speed: audioSpeedRef.current || audioSpeed,
      metadata: {
        title: `${line.characterName}: "${line.englishText}"`,
        artist: `Chương ${lesson.chapterNumber} • Bài ${lesson.dialogueNumber}: ${lesson.title}`,
        album: 'Giao Tiếp Thực Chiến — VBaceEnglish'
      },
      onEnd: () => {
        if (!isPlayingRef.current) return;
        if (sessionToken !== playSessionTokenRef.current) return;
        if (stepTokenRef.current !== currentStep) return;

        if (repeatScopeRef.current === 'line') {
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
            currentLineRepeatRef.current = 1;
            setCurrentLineRepeat(1);
            timeoutTimerRef.current = setTimeout(() => {
              if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
              playLineAtIndex(index + 1, cycleNumber, sessionToken);
            }, 500);
            return;
          }
        } else {
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
        timeoutTimerRef.current = setTimeout(() => {
          if (!isPlayingRef.current || sessionToken !== playSessionTokenRef.current) return;
          playLineAtIndex(index + 1, cycleNumber, sessionToken);
        }, 600);
      }
    });
  };

  // Play dialogue lines sequence
  const playAllLines = () => {
    if (!lesson?.dialogueLines?.length) return;
    if (isPlayingAll) {
      stopPlayback(true);
      return;
    }

    closeGlobalPlayer();
    stopPlayback(false);
    isPlayingRef.current = true;
    setIsPlayingAll(true);

    speechService.startBackgroundSession(
      {
        title: lesson.title,
        artist: `Chương ${lesson.chapterNumber} • Bài ${lesson.dialogueNumber} (VBace)`,
        album: 'Giao Tiếp Thực Chiến — VBaceEnglish'
      },
      {
        onPlay: () => {
          if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            setIsPlayingAll(true);
            playLineAtIndex(currentLineIndexRef.current || 0, currentLoopCycleRef.current || 1, playSessionTokenRef.current);
          }
        },
        onPause: () => stopPlayback(false),
        onPrev: () => {
          const prevIdx = Math.max(0, (currentLineIndexRef.current || 0) - 1);
          playLineAtIndex(prevIdx, currentLoopCycleRef.current || 1, playSessionTokenRef.current);
        },
        onNext: () => {
          const nextIdx = (currentLineIndexRef.current || 0) + 1;
          playLineAtIndex(nextIdx, currentLoopCycleRef.current || 1, playSessionTokenRef.current);
        },
        onStop: () => stopPlayback(true)
      }
    );

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

  // Smart Speech Recognition for Roleplay (Hỗ trợ cả Máy tính & Điện thoại + Chuẩn hóa giọng Việt-Anh)
  const startSpeechRecognition = (customTargetText = null) => {
    if (isListening && speechSessionRef.current) {
      speechSessionRef.current.stop();
      return;
    }

    if (isPlayingAll) stopPlayback();

    const currentLine = lesson?.dialogueLines?.[roleplayStep];
    const targetText = customTargetText || currentLine?.englishText || '';

    setUserTranscript('');
    setRoleplayEval(null);

    const session = startSmartSpeechSession({
      targetText,
      onStart: () => {
        setIsListening(true);
      },
      onInterimResult: (smartText) => {
        setUserTranscript(smartText);
      },
      onFinalResult: ({ smartTranscript, hasSpoken }) => {
        setIsListening(false);
        speechSessionRef.current = null;
        if (smartTranscript && hasSpoken) {
          const evalRes = evaluateSentenceAttempt(smartTranscript, targetText, {
            isSpeech: true
          });
          const bestText = evalRes.smartTranscript || smartTranscript;
          setUserTranscript(bestText);
          setRoleplayEval(evalRes);
          toast.success(`🎙️ Phát âm đạt ${evalRes.score}%: "${bestText}"`, {
            id: 'bino-speech-result'
          });
        }
      },
      onError: (_code, message) => {
        setIsListening(false);
        speechSessionRef.current = null;
        if (message) toast.error(message, { id: 'bino-speech-err' });
      }
    });

    speechSessionRef.current = session;
  };

  // Luyện nói trực tiếp trên từng câu thoại ở Tab 1 (Bài Học)
  const startInlineLineSpeech = (line, idx) => {
    if (isListening && speechSessionRef.current) {
      speechSessionRef.current.stop();
      if (inlineSpeakIndex === idx) return;
    }

    if (isPlayingAll) stopPlayback();

    setInlineSpeakIndex(idx);
    setInlineSpeakTranscript('');
    setInlineSpeakEval(null);

    const targetText = line?.englishText || '';
    const session = startSmartSpeechSession({
      targetText,
      onStart: () => {
        setIsListening(true);
      },
      onInterimResult: (smartText) => {
        setInlineSpeakTranscript(smartText);
      },
      onFinalResult: ({ smartTranscript, hasSpoken }) => {
        setIsListening(false);
        speechSessionRef.current = null;
        if (smartTranscript && hasSpoken) {
          const evalRes = evaluateSentenceAttempt(smartTranscript, targetText, {
            isSpeech: true
          });
          const bestText = evalRes.smartTranscript || smartTranscript;
          setInlineSpeakTranscript(bestText);
          setInlineSpeakEval(evalRes);
          if (evalRes.score >= 80) {
            toast.success(`🎙️ Phát âm chuẩn ${evalRes.score}%!`, { id: 'bino-inline-speech' });
          }
        }
      },
      onError: (_code, message) => {
        setIsListening(false);
        speechSessionRef.current = null;
        if (message) toast.error(message, { id: 'bino-speech-err' });
      }
    });

    speechSessionRef.current = session;
  };

  if (loading) return <PageLoader />;
  if (!lesson) return <div className="p-8 text-center text-slate-500">Không tìm thấy bài học</div>;

  const currentDictationLine = lesson?.dialogueLines?.[dictationIndex];

  return (
    <div className="space-y-3.5 sm:space-y-6 max-w-5xl mx-auto pb-12 sm:pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & COMPLETION TOGGLE */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-3.5"
      >
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/bino')}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all shadow-sm shrink-0 mt-0.5 sm:mt-0 cursor-pointer"
            title="Quay về danh sách chương"
          >
            <ArrowLeft size={17} />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
              <span className="truncate">Chương {lesson.chapterNumber < 10 ? `0${lesson.chapterNumber}` : lesson.chapterNumber}: {lesson.chapterTitle}</span>
              <span>•</span>
              <span className="shrink-0">Bài {lesson.dialogueNumber}</span>
            </div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 sm:line-clamp-none">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Complete Toggle - Compact pill on mobile so it sits on the same top row! */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleToggleComplete}
          className={`shrink-0 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-sm cursor-pointer ${
            isCompleted
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
          }`}
        >
          <CheckCircle2 size={15} className={isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
          <span className="hidden sm:inline">{isCompleted ? 'Đã Hoàn Thành ✓' : 'Đánh Dấu Hoàn Thành'}</span>
          <span className="sm:hidden">{isCompleted ? 'Đã Xong ✓' : 'Hoàn thành'}</span>
        </motion.button>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. STUDIO AUDIO TOOLBAR - MOBILE-FIRST SLEEK REDESIGN */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg space-y-2.5 bg-gradient-to-br from-amber-500/10 via-white to-blue-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 relative ${
          isRepeatMenuOpen ? 'z-40' : 'z-20'
        }`}
      >
        {/* TẦNG 1: NÚT PLAY/PAUSE CHÍNH & LIVE SOUNDWAVE */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          
          {/* Main Big Play/Pause Button with Pulse Glow */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={playAllLines}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 sm:gap-3 transition-all shadow-md cursor-pointer ${
              isPlayingAll
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 animate-pulse-glow'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isPlayingAll ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            </div>

            <div className="text-left flex-1 sm:flex-none min-w-0">
              <div className="text-xs font-black tracking-wide truncate">
                {isPlayingAll ? 'TẠM DỪNG BÀI HỘI THOẠI' : 'NGHE TOÀN BỘ HỘI THOẠI'}
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold opacity-90 truncate">
                {isPlayingAll
                  ? activeLineIndex !== null
                    ? `Đang đọc câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0} • ${checkIsInfinite(repeatCount) ? `Vòng ${currentLoopCycle}/∞` : `Vòng ${currentLoopCycle}/${repeatCount}`}`
                    : 'Đang đọc...'
                  : `${lesson?.dialogueLines?.length || 0} lượt thoại • Giọng kịch tính Studio AI`}
              </div>
            </div>

            {/* Equalizer Wave animated when playing */}
            {isPlayingAll && (
              <div className="flex items-end gap-0.5 h-4 ml-1 shrink-0">
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            )}
          </motion.button>

          {/* Quick Info & Playlist Shortcut on the right */}
          <div className="grid grid-cols-2 sm:flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Vietsub Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVietsub(prev => !prev)}
              className={`px-3 py-2 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                showVietsub 
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title={showVietsub ? 'Tắt dịch tiếng Việt' : 'Bật dịch tiếng Việt'}
            >
              {showVietsub ? <Eye size={14} className="text-rose-500 shrink-0" /> : <EyeOff size={14} className="shrink-0" />}
              <span className="font-vietsub truncate">{showVietsub ? 'Vietsub: Bật' : 'Vietsub: Tắt'}</span>
            </motion.button>

            {/* Continuous Playlist Modal Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isPlayingAll) stopPlayback(false);
                openPlaylist({
                  ids: lesson ? [lesson.id] : null,
                  autoStart: false,
                  minimized: false,
                  book
                });
              }}
              className="px-3 py-2 rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Mở trình phát liên tục tất cả các bài"
            >
              <ListMusic size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">Phát Nhiều Bài 🎧</span>
            </motion.button>
          </div>
        </div>

        {/* TẦNG 2: THANH ACTION CHUYÊN NGHIỆP (Tốc độ cuộn ngang 1 dòng + Lặp, Giọng AI, Cách học) */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            {/* Speed selector - Single horizontal scrollable line on mobile */}
            <div className="flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-bold border border-slate-200/60 dark:border-slate-700 gap-0.5">
              <span className="text-[10px] text-slate-400 px-1.5 font-extrabold uppercase shrink-0 flex items-center gap-1">
                Tốc độ:
              </span>
              {SPEECH_SPEED_PRESETS.map((preset) => {
                const isSelected = Math.abs(audioSpeed - preset.value) < 0.02;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleChangeSpeed(preset.value)}
                    title={preset.desc}
                    className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? preset.isSlow
                          ? 'bg-emerald-600 text-white shadow-sm font-black'
                          : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset.isSlow && <Headphones size={11} className={isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />}
                    <span>{preset.label}</span>
                    {isSelected && (
                      <span className="text-[10px] hidden md:inline opacity-90">
                        ({preset.shortTag})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secondary Controls Row: Repeat + Voice AI + 4-Step Guide in 1 clean row on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Repeat Selector Popover */}
              <div className="relative z-50 shrink-0" ref={repeatMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRepeatMenuOpen(prev => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs border cursor-pointer ${
                    checkIsInfinite(repeatCount)
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                      : repeatCount !== 1
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {checkIsInfinite(repeatCount) ? (
                    <InfinityIcon size={14} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
                  ) : (
                    <Repeat size={12} className={repeatCount !== 1 ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-slate-400 shrink-0'} />
                  )}
                  <span className="whitespace-nowrap">
                    {checkIsInfinite(repeatCount)
                      ? 'Lặp: ∞'
                      : `Lặp: ${repeatCount}x`}
                  </span>
                  {(checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                    <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200">
                      {repeatScope === 'all' ? 'Toàn bài' : 'Từng câu'}
                    </span>
                  )}
                  <ChevronDown size={12} className={`text-slate-400 transition-transform shrink-0 ${isRepeatMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Repeat Popover Dropdown */}
                {isRepeatMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in ring-1 ring-black/10 dark:ring-white/10">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Repeat size={16} className="text-amber-500" />
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Cài Đặt Lặp Lại Hội Thoại
                        </span>
                      </div>
                      <button
                        onClick={() => setIsRepeatMenuOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Scope: Lặp toàn bài vs Lặp từng câu */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kiểu lặp lại:</span>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                          onClick={() => handleSelectRepeatScope('all')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            repeatScope === 'all'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
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
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Repeat1 size={13} />
                          <span>Lặp Từng Câu</span>
                        </button>
                      </div>
                    </div>

                    {/* Presets */}
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
                              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                                isSelected
                                  ? opt.isSpecial
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40'
                                    : 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                              }`}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} />}
                              {opt.label}
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
                            if (e.key === 'Enter') handleApplyCustomRepeat();
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

                    {/* Done button */}
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
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Xong & Đóng Menu</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Studio AI Voice Modal */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVoiceSettingsOpen(true)}
                className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer truncate"
                title="Tùy chỉnh giọng đọc Studio Neural"
              >
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                <span className="truncate">Giọng AI 🎙️</span>
              </motion.button>

              {/* 4-Step Learning Guide Modal Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsGuideModalOpen(true)}
                className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-400/80 dark:border-amber-700 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer truncate"
                title="Xem cẩm nang hướng dẫn phương pháp học 4 bước VBace Flow"
              >
                <Lightbulb size={12} className="text-white shrink-0" />
                <span className="truncate">Cách Học 💡</span>
              </motion.button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-bold hidden md:block">
            VBace Drama Mode • Giọng kịch tính & Ngắt nghỉ tự nhiên
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 3. SEGMENTED INTERACTIVE STUDY TABS (Framer Motion spring physics) */}
      {/* ========================================================================= */}
      <div className="relative p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl grid grid-cols-3 gap-1 border border-slate-200/60 dark:border-slate-700/60">
        {[
          { id: 'lesson', label: 'Bài Học & Từ Khóa', shortLabel: 'Bài Học', icon: BookOpen },
          { id: 'roleplay', label: 'Luyện Phản Xạ 1:1', shortLabel: 'Phản Xạ 1:1', icon: MessageSquare },
          { id: 'dictation', label: 'Chép Chính Tả', shortLabel: 'Chính Tả', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBinoTab"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md shadow-orange-500/25"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1 sm:gap-1.5 truncate">
                <Icon size={14} className="shrink-0" />
                <span className="hidden sm:inline truncate">{tab.label}</span>
                <span className="sm:hidden truncate">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BÀI HỌC & TỪ KHÓA (GIAO DIỆN SÁCH SỐ HÓA ULTRA SHARP) */}
      {/* ========================================================================= */}
      {activeTab === 'lesson' && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5 sm:space-y-8"
        >
          
          {/* 1. KEY WORDS (TỪ KHÓA GHIM NOTE PHONG CÁCH VBACE) */}
          {lesson?.vocabularies?.length > 0 && (
            <div className="relative p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 dark:from-amber-950/40 dark:via-slate-850 dark:to-slate-850 border-2 border-dashed border-amber-300 dark:border-amber-800/80 shadow-md">
              {/* Decorative Pin / Clip Icon */}
              <div className="absolute -top-3 left-4 sm:left-8 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-amber-400 text-amber-950 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <span>📎 Note Ghi Nhớ</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-3 sm:mb-4 pt-1">
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <span>Key words (Từ khóa)</span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      • {lesson.vocabularies.length} từ
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 font-medium">
                    Bấm loa nghe phát âm hoặc bấm "+" lưu vào bộ Flashcard ôn tập!
                  </p>
                </div>
              </div>

              {/* Vocabularies List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                {lesson.vocabularies.map((v) => {
                  const isAdded = addedVocabs[v.id];
                  return (
                    <motion.div
                      key={v.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex items-center justify-between gap-2.5 group hover:border-amber-400 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {v.word}
                          </span>
                          {v.phonetic && (
                            <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 font-vietsub font-medium">
                              {v.phonetic}
                            </span>
                          )}
                          {v.wordType && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                              ({v.wordType})
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 font-vietsub">
                          {v.meaning}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          onClick={() => speakVocab(v.word)}
                          className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors cursor-pointer"
                          title={`Nghe phát âm (${audioSpeed}x)`}
                        >
                          <Volume2 size={15} />
                        </button>

                        <button
                          onClick={() => speakVocab(v.word, 0.65)}
                          className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/70 dark:border-emerald-800/60 transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                          title="Nghe phát âm chậm rãi từng âm tiết (0.65x)"
                        >
                          <Headphones size={11} />
                          <span>0.65x</span>
                        </button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.91 }}
                          onClick={() => handleAddToSRS(v)}
                          title={isAdded ? 'Bấm lần nữa để thoát / bỏ khỏi Flashcard' : 'Bấm để thêm vào bộ Flashcard ôn tập'}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all select-none shadow-sm border cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500 hover:bg-rose-500 text-white border-emerald-500 hover:border-rose-500 group/btn shadow-emerald-500/20'
                              : 'bg-amber-100 hover:bg-amber-500 hover:text-white dark:bg-amber-900/60 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/70'
                          } ${togglingVocabId === v.id ? 'opacity-90' : ''}`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={12} strokeWidth={3} className="group-hover/btn:hidden" />
                              <X size={12} strokeWidth={3} className="hidden group-hover/btn:inline" />
                              <span className="text-[10px] sm:text-[11px] group-hover/btn:hidden">Đã lưu</span>
                              <span className="text-[10px] sm:text-[11px] hidden group-hover/btn:inline">Bỏ lưu</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm leading-none font-black">+</span>
                              <span className="text-[10px] sm:text-[11px] hidden sm:inline">Flashcard</span>
                              <span className="text-[10px] sm:hidden">Thẻ</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. KHUNG HỘI THOẠI SONG NGỮ (TRANSCRIPT THEO LƯỢT THOẠI) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kịch Bản Hội Thoại Song Ngữ</span>
                <span className="text-xs text-slate-400 font-semibold">({lesson.dialogueLines?.length || 0} lượt thoại)</span>
              </h3>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {lesson.dialogueLines?.map((line, idx) => {
                const isActive = activeLineIndex === idx;
                const upperChar = (line.characterName || '').toUpperCase();
                const isBino = upperChar.includes('LEO') || upperChar.includes('VBACE') || upperChar.includes('BINO');

                return (
                  <motion.div
                    key={line.id}
                    ref={(el) => { if (el) lineRefs.current[idx] = el; }}
                    layout
                    transition={{ duration: 0.2 }}
                    className={`p-3.5 sm:p-5 rounded-2xl transition-all duration-300 border relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-50/95 via-white to-amber-50/70 dark:from-amber-950/60 dark:via-slate-800 dark:to-slate-800 border-amber-400 dark:border-amber-600 shadow-xl ring-2 ring-amber-400/40 animate-pulse-glow'
                        : isBino
                        ? 'bg-orange-50/30 dark:bg-slate-800/80 border-orange-200/50 dark:border-slate-700/80 hover:border-orange-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500" />
                    )}

                    {/* Top Row: Character Badge + Live Status + Audio Buttons on the same row so text below gets 100% width! */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                          isBino
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {line.characterName}
                        </span>

                        {/* Equalizer when this specific line is being spoken */}
                        {isActive && isPlayingAll && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-[10px] font-black">
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                            </div>
                            <span>Đang đọc</span>
                          </div>
                        )}

                        {/* Repeat counter badge */}
                        {isActive && isPlayingAll && (checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-sm flex items-center gap-1">
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

                      {/* Line Audio Play & Speaking Practice Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startInlineLineSpeech(line, idx)}
                          className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all active:scale-90 flex items-center gap-1 cursor-pointer ${
                            isListening && inlineSpeakIndex === idx
                              ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/25'
                              : 'text-blue-700 dark:text-sky-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/70'
                          }`}
                          title="Bấm Micro để luyện đọc câu này (Hỗ trợ cả Máy tính & Điện thoại)"
                        >
                          <Mic size={12} />
                          <span>{isListening && inlineSpeakIndex === idx ? 'Đang nghe...' : 'Nói'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (isPlayingAll) stopPlayback();
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName, 0.7);
                          }}
                          className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/70 transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                          title="Nghe chậm rãi câu này (0.7x) để nghe kỹ từng từ"
                        >
                          <Headphones size={12} />
                          <span>Chậm</span>
                        </button>

                        <button
                          onClick={() => {
                            if (isPlayingAll) stopPlayback();
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName);
                          }}
                          className={`p-2 rounded-xl transition-all shrink-0 active:scale-90 cursor-pointer ${
                            isActive
                              ? 'text-white bg-amber-500 shadow-md shadow-amber-500/25'
                              : 'text-slate-500 bg-slate-100/80 dark:bg-slate-700/60 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={`Nghe riêng câu này theo giọng nhân vật (${audioSpeed}x)`}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Full-width Dialogue Text (English + Vietnamese) */}
                    <div className="space-y-1.5">
                      <p className="text-[15px] sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed tracking-tight">
                        "{line.englishText}"
                      </p>

                      {showVietsub && line.vietnameseText && (
                        <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-semibold leading-relaxed tracking-normal">
                          ({line.vietnameseText})
                        </p>
                      )}
                    </div>

                    {/* Kết quả Luyện nói trực tiếp trên câu thoại này */}
                    {inlineSpeakIndex === idx && (isListening || inlineSpeakTranscript || inlineSpeakEval) && (
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            🎙️ {isListening ? 'Đang nghe giọng đọc của bạn...' : 'Giọng đọc nhận diện:'}{' '}
                            <strong className="text-[#0071e3] dark:text-sky-400">
                              "{inlineSpeakTranscript || '...'}"
                            </strong>
                          </span>
                          <button
                            onClick={() => {
                              setInlineSpeakIndex(null);
                              setInlineSpeakTranscript('');
                              setInlineSpeakEval(null);
                            }}
                            className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>

                        {inlineSpeakEval && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span
                                className={`text-xs font-extrabold ${
                                  inlineSpeakEval.isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                Điểm phát âm: {inlineSpeakEval.score}% — {inlineSpeakEval.feedback}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {inlineSpeakEval.wordDiffs.map((wd, wIdx) => (
                                <button
                                  key={wIdx}
                                  onClick={() => speakText(wd.cleanWord || wd.word, line.characterName, 0.7)}
                                  className={`px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer ${
                                    wd.status === 'correct'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                                  }`}
                                  title="Bấm để nghe phát âm từ này chậm 0.7x"
                                >
                                  {wd.word}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VBACE SENTENCE PATTERN SUBSTITUTION (VẬN DỤNG THỰC TẾ) */}
                    <BinoSentenceExpansionCard
                      expansionData={getExpansionsForLine(line.englishText, idx)}
                      lineIndex={idx}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LUYỆN PHẢN XẠ 1:1 (ROLEPLAY VỚI LEO) */}
      {/* ========================================================================= */}
      {activeTab === 'roleplay' && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl"
        >
          <div className="max-w-xl space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>Luyện Phản Xạ Đóng Vai 1:1 Cùng Leo</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Hệ thống sẽ đóng vai <strong>LEO</strong> và đọc thoại trước. Đến lượt thoại của bạn, hãy đọc to câu thoại bằng tiếng Anh để luyện phản xạ tự nhiên không cần dịch ngầm!
            </p>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500">Bạn muốn đóng vai:</span>
            {availableRoles.map(r => (
              <button
                key={r}
                onClick={() => { setSelectedRole(r); setRoleplayStep(0); setUserTranscript(''); setRoleplayEval(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === r
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Interactive Roleplay Step Box */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 to-blue-50/60 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Lượt thoại {roleplayStep + 1} / {lesson.dialogueLines?.length || 8}</span>
              <button
                onClick={() => { setRoleplayStep(0); setUserTranscript(''); setRoleplayEval(null); }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                  <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                    "{lesson.dialogueLines[roleplayStep].englishText}"
                  </p>
                  {showVietsub && (
                    <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-semibold mt-1.5">
                      ({lesson.dialogueLines[roleplayStep].vietnameseText})
                    </p>
                  )}
                </div>

                {/* Microphone / Speech & Audio Buttons (Luôn cho phép bấm Mic nói ở cả lượt mình lẫn nhại theo lượt của Leo!) */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      {isListening && (
                        <div className="absolute inset-0 rounded-2xl bg-red-500 animate-radar pointer-events-none" />
                      )}
                      <button
                        onClick={() => startSpeechRecognition(lesson.dialogueLines[roleplayStep].englishText)}
                        className={`relative z-10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                        }`}
                      >
                        <Mic size={16} />
                        <span>
                          {isListening
                            ? 'Đang nghe bạn nói... (Bấm dừng)'
                            : lesson.dialogueLines[roleplayStep].characterName === selectedRole
                              ? 'Bấm Nói Câu Này (Speech AI)'
                              : 'Bấm Nhại Theo Câu Này'}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={() => speakText(lesson.dialogueLines[roleplayStep].englishText, lesson.dialogueLines[roleplayStep].characterName)}
                      className="px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Volume2 size={15} className="text-[#0071e3]" />
                      <span>Nghe mẫu ({audioSpeed}x)</span>
                    </button>

                    <button
                      onClick={() => speakText(lesson.dialogueLines[roleplayStep].englishText, lesson.dialogueLines[roleplayStep].characterName, 0.7)}
                      className="px-4 py-2.5 sm:py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Headphones size={15} />
                      <span>Nghe chậm (0.7x)</span>
                    </button>
                  </div>

                  {(isListening || userTranscript || roleplayEval) && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          🎙️ {isListening ? 'Đang nghe bạn đọc: ' : 'Giọng đọc nhận diện: '}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          "{userTranscript || '...'}"
                        </span>
                      </div>

                      {roleplayEval && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                          <div className="text-xs font-extrabold">
                            <span className={roleplayEval.isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                              Điểm phản xạ phát âm: {roleplayEval.score}% — {roleplayEval.feedback}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold">
                            Chi tiết từng từ (Bấm vào từ bất kỳ để nghe phát âm chậm 0.7x):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {roleplayEval.wordDiffs.map((wd, wIdx) => (
                              <button
                                key={wIdx}
                                onClick={() => speakText(wd.cleanWord || wd.word, lesson.dialogueLines[roleplayStep].characterName, 0.7)}
                                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
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
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation in roleplay */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-slate-700">
                  <button
                    disabled={roleplayStep === 0}
                    onClick={() => { setRoleplayStep(prev => prev - 1); setUserTranscript(''); setRoleplayEval(null); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    Câu Trước
                  </button>

                  <button
                    onClick={() => {
                      if (roleplayStep < lesson.dialogueLines.length - 1) {
                        useGamificationStore.getState().earnXP(10, 'bino_roleplay', 'Luyện đối đáp 1 câu Giao Tiếp Thực Chiến');
                        setRoleplayStep(prev => prev + 1);
                        setUserTranscript('');
                        setRoleplayEval(null);
                      } else {
                        binoApi.markProgress({
                          dialogueLessonId: parseInt(id),
                          roleplayCompleted: true,
                          timeSpentSeconds: consumeElapsedSeconds()
                        }).then(() => invalidateStatsCache()).catch(() => {});
                        toast.success('Xuất sắc! Đã ghi nhận hoàn thành luyện đóng vai 1:1 cho bài này! 🎉');
                        useGamificationStore.getState().earnXP(30, 'bino_roleplay', 'Hoàn thành lượt đóng vai 1:1');
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>{roleplayStep < lesson.dialogueLines.length - 1 ? 'Câu Tiếp Theo' : 'Hoàn Thành! 🎉'}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHÉP CHÍNH TẢ (DICTATION) */}
      {/* ========================================================================= */}
      {activeTab === 'dictation' && currentDictationLine && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl"
        >
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              <span>Luyện Nghe & Chép Chính Tả (Dictation)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Bấm nghe câu thoại và gõ lại đúng từng từ tiếng Anh để luyện khả năng nghe âm nối và nhớ chính tả.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-400">
                Câu {dictationIndex + 1} / {lesson.dialogueLines.length}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.95)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Volume2 size={15} /> Nghe Tự Nhiên (0.95x)
                </button>

                <button
                  onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.75)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Headphones size={15} />
                  <span>Nghe Chậm Rãi (0.75x)</span>
                </button>

                <button
                  onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.6)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Gauge size={15} />
                  <span>Rất Chậm (0.6x)</span>
                </button>
              </div>
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
                onClick={() => {
                  setDictationChecked(true);
                  const normalizeWords = (str) =>
                    (str || '')
                      .toLowerCase()
                      .replace(/[^a-z0-9'\s]/g, ' ')
                      .split(/\s+/)
                      .filter(Boolean);
                  const targetWords = normalizeWords(currentDictationLine.englishText);
                  const typedWords = normalizeWords(dictationInput);
                  const typedSet = new Set(typedWords);
                  const matched = targetWords.filter(w => typedSet.has(w)).length;
                  const score = targetWords.length > 0
                    ? Math.min(100, Math.round((matched / targetWords.length) * 100))
                    : 0;
                  binoApi.markProgress({
                    dialogueLessonId: parseInt(id),
                    dictationScore: score,
                    timeSpentSeconds: consumeElapsedSeconds()
                  }).then(() => {
                    invalidateStatsCache();
                    const xp = score >= 80 ? 20 : (score >= 35 ? 10 : 5);
                    const msg = score >= 80 ? `Chép chính tả xuất sắc ${score}%` : `Luyện chép chính tả (${score}%)`;
                    useGamificationStore.getState().earnXP(xp, 'bino_dictation', msg);
                  }).catch(() => {});
                }}
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
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <span className="text-xs font-bold text-slate-400 block uppercase">Đáp án chuẩn:</span>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {currentDictationLine.englishText}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-vietsub font-semibold">
                  ({currentDictationLine.vietnameseText})
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}



      {/* Studio Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      {/* 4-Step Learning Guide Modal */}
      <BinoLearningGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

    </div>
  );
}
