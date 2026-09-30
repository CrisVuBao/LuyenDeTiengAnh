import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, BookOpen, MessageSquare, FileText
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import { invalidateStatsCache } from '../../api/dashboardAndAiApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import { useBinoPlayerStore } from './components/BinoPlaylistModal';
import BinoLearningGuideModal from './components/BinoLearningGuideModal';
import speechService from '../../utils/speechService';
import { startSmartSpeechSession } from '../../utils/smartSpeechRecognition';
import { evaluateSentenceAttempt } from '../reflex50/store/useReflex50Store';
import useAuthStore from '../../store/authStore';
import useGamificationStore from '../gamification/store/useGamificationStore';
import SeoMeta from '../../components/SeoMeta';
import toast from 'react-hot-toast';

import BinoAudioControlBar from './components/BinoAudioControlBar';
import BinoKeyVocabSection from './components/BinoKeyVocabSection';
import BinoDialogueLinesSection from './components/BinoDialogueLinesSection';
import BinoRoleplaySection from './components/BinoRoleplaySection';
import BinoDictationSection from './components/BinoDictationSection';

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

  // Audio state
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
    if (typeof speechService.subscribeRateChange === 'function') {
      return speechService.subscribeRateChange((newRate) => {
        setAudioSpeed(newRate);
        audioSpeedRef.current = newRate;
      });
    }
    return undefined;
  }, []);

  const handleChangeSpeed = (newSpeed) => {
    setAudioSpeed(newSpeed);
    audioSpeedRef.current = newSpeed;
    speechService.setLiveSpeed(newSpeed);
    toast.success(`🎧 Đã chuyển tốc độ: ${newSpeed}x`, { id: 'bino-speed-toast' });
  };

  // Repeat state
  const [repeatCount, setRepeatCount] = useState(() => {
    const saved = localStorage.getItem('bino_repeat_count');
    if (checkIsInfinite(saved)) return 'infinite';
    return parseInt(saved) || 1;
  });
  const [repeatScope, setRepeatScope] = useState(() => localStorage.getItem('bino_repeat_scope') || 'all');
  const [currentLoopCycle, setCurrentLoopCycle] = useState(1);
  const [currentLineRepeat, setCurrentLineRepeat] = useState(1);

  const repeatCountRef = useRef(repeatCount);
  const repeatScopeRef = useRef(repeatScope);
  const currentLoopCycleRef = useRef(1);
  const currentLineRepeatRef = useRef(1);
  const isPlayingRef = useRef(false);
  const currentLineIndexRef = useRef(0);
  const timeoutTimerRef = useRef(null);
  const playSessionTokenRef = useRef(0);
  const stepTokenRef = useRef(0);

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

  // Scroll to active line
  useEffect(() => {
    if (activeLineIndex !== null && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  // Stop playback completely
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

  // Handoff to floating player on unmount
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
  const rewardedCompleteRef = useRef({});
  const rewardedRoleplayLinesRef = useRef({});
  const rewardedRoleplayFinishRef = useRef({});
  const rewardedDictationLinesRef = useRef({});

  useEffect(() => {
    lastListenLineRef.current = {};
    if (lesson?.isCompleted) {
      rewardedCompleteRef.current[id] = true;
    }
  }, [id, lesson?.isCompleted]);

  const recordBinoListen = (lineKey) => {
    if (!lineKey || lastListenLineRef.current[lineKey]) return;
    lastListenLineRef.current[lineKey] = true;
    try {
      useGamificationStore.getState().earnXP(1, 'bino_listen', `Nghe câu thoại bài #${id}`);
    } catch {}
  };

  // Speech synthesis
  const speakText = (text, characterName = 'LEO', speed = null) => {
    recordBinoListen(text);
    speechService.speakLine({
      text,
      characterName,
      speed: speed || audioSpeedRef.current || audioSpeed,
      forceCancel: true,
      onEnd: () => {
        if (!isPlayingRef.current) setActiveLineIndex(null);
      },
      onError: () => {
        if (!isPlayingRef.current) setActiveLineIndex(null);
      }
    });
  };

  const speakVocab = (word, speed = null) => {
    speechService.speakWord(word, speed || audioSpeedRef.current || audioSpeed);
  };

  // Toggle flashcard SRS
  const handleAddToSRS = async (vocab) => {
    if (!vocab?.id) return;
    const currentlyAdded = !!addedVocabs[vocab.id];
    const nextState = !currentlyAdded;

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
        // preserve local
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
        if (!rewardedCompleteRef.current[id]) {
          rewardedCompleteRef.current[id] = true;
          useGamificationStore.getState().earnXP(20, 'bino_complete', `Hoàn thành bài #${id}: ${lesson?.title || ''}`);
        }
      } else {
        toast('Đã bỏ đánh dấu hoàn thành');
      }
    } catch {
      setIsCompleted(!newState);
      toast.error('Không thể cập nhật tiến độ');
    }
  };

  // Loop cycle execution
  const startDialogueCycle = (cycleNumber) => {
    if (!isPlayingRef.current) return;
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

  const playLineAtIndex = (index, cycleNumber, sessionToken) => {
    if (!isPlayingRef.current) return;
    if (sessionToken !== playSessionTokenRef.current) return;

    const lines = lesson?.dialogueLines;
    if (!lines?.length) {
      stopPlayback();
      return;
    }

    if (index >= lines.length) {
      const isInfinite = checkIsInfinite(repeatCountRef.current) || checkIsInfinite(repeatCount);
      const maxCycles = isInfinite ? Infinity : (parseInt(repeatCountRef.current) || 1);

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

  // Smart Speech Recognition for Roleplay
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
          const lineKey = `${id}_rp_${roleplayStep}`;
          if (evalRes.score >= 70 && !rewardedRoleplayLinesRef.current[lineKey]) {
            rewardedRoleplayLinesRef.current[lineKey] = true;
            const rpXp = evalRes.score >= 90 ? 5 : 3;
            useGamificationStore.getState().earnXP(
              rpXp,
              'bino_roleplay',
              `Đóng vai phát âm đạt ${evalRes.score}% (Bài #${id} câu ${roleplayStep + 1})`
            );
            toast.success(`🎙️ Phát âm đạt ${evalRes.score}% (+${rpXp} XP): "${bestText}"`, {
              id: 'bino-speech-result'
            });
          } else {
            toast.success(`🎙️ Phát âm đạt ${evalRes.score}%: "${bestText}"`, {
              id: 'bino-speech-result'
            });
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

  // Inline Line Speech Recognition
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

  return (
    <div className="space-y-3.5 sm:space-y-6 max-w-5xl mx-auto pb-12 sm:pb-16">
      <SeoMeta
        title={`${lesson.title || 'Bài Học Hội Thoại'} — Giao Tiếp`}
        description={lesson.situationDescription || lesson.titleVi || 'Luyện nói tiếng Anh giao tiếp thực tế với phương pháp Shadowing và nhận diện giọng nói.'}
      />
      
      {/* 1. TOP BREADCRUMB & COMPLETION TOGGLE */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/communication')}
            className="p-2.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Quay về danh sách chương"
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              <span className="truncate">Chương {lesson.chapterNumber < 10 ? `0${lesson.chapterNumber}` : lesson.chapterNumber}: {lesson.chapterTitle}</span>
              <span>•</span>
              <span className="shrink-0 text-[#0071e3] dark:text-sky-400 font-bold">Bài {lesson.dialogueNumber}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-950 dark:text-white tracking-[-0.025em] leading-snug line-clamp-2 sm:line-clamp-none">
              {lesson.title}
            </h1>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleToggleComplete}
          className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-white/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 size={14} className={isCompleted ? 'text-emerald-500' : 'text-slate-400'} />
          <span className="hidden sm:inline">{isCompleted ? 'Đã Hoàn Thành ✓' : 'Đánh Dấu Hoàn Thành'}</span>
          <span className="sm:hidden">{isCompleted ? 'Đã Xong ✓' : 'Hoàn thành'}</span>
        </motion.button>
      </motion.div>

      {/* 2. STUDIO AUDIO TOOLBAR */}
      <BinoAudioControlBar
        isPlayingAll={isPlayingAll}
        playAllLines={playAllLines}
        stopPlayback={stopPlayback}
        activeLineIndex={activeLineIndex}
        lesson={lesson}
        repeatCount={repeatCount}
        setRepeatCount={setRepeatCount}
        repeatScope={repeatScope}
        setRepeatScope={setRepeatScope}
        currentLoopCycle={currentLoopCycle}
        showVietsub={showVietsub}
        setShowVietsub={setShowVietsub}
        audioSpeed={audioSpeed}
        handleChangeSpeed={handleChangeSpeed}
        openPlaylist={openPlaylist}
        book={book}
        setIsVoiceSettingsOpen={setIsVoiceSettingsOpen}
        setIsGuideModalOpen={setIsGuideModalOpen}
      />

      {/* 3. SEGMENTED INTERACTIVE STUDY TABS (Apple Segmented Capsule) */}
      <div className="relative p-1.5 bg-slate-100/90 dark:bg-white/[0.05] rounded-full grid grid-cols-3 gap-1.5 border border-slate-200/80 dark:border-white/[0.08]">
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
              className={`relative flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBinoTab"
                  className="absolute inset-0 bg-[#0071e3] rounded-full shadow-[0_4px_16px_rgba(0,113,227,0.35)]"
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

      {/* TAB 1: BÀI HỌC & TỪ KHÓA */}
      {activeTab === 'lesson' && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5 sm:space-y-8"
        >
          <BinoKeyVocabSection
            vocabularies={lesson.vocabularies}
            addedVocabs={addedVocabs}
            handleAddToSRS={handleAddToSRS}
            togglingVocabId={togglingVocabId}
            speakVocab={speakVocab}
            audioSpeed={audioSpeed}
          />

          <BinoDialogueLinesSection
            dialogueLines={lesson.dialogueLines}
            activeLineIndex={activeLineIndex}
            setActiveLineIndex={setActiveLineIndex}
            lineRefs={lineRefs}
            isPlayingAll={isPlayingAll}
            stopPlayback={stopPlayback}
            repeatCount={repeatCount}
            repeatScope={repeatScope}
            currentLoopCycle={currentLoopCycle}
            currentLineRepeat={currentLineRepeat}
            showVietsub={showVietsub}
            speakText={speakText}
            audioSpeed={audioSpeed}
            inlineSpeakIndex={inlineSpeakIndex}
            setInlineSpeakIndex={setInlineSpeakIndex}
            isListening={isListening}
            inlineSpeakTranscript={inlineSpeakTranscript}
            setInlineSpeakTranscript={setInlineSpeakTranscript}
            inlineSpeakEval={inlineSpeakEval}
            setInlineSpeakEval={setInlineSpeakEval}
            startInlineLineSpeech={startInlineLineSpeech}
          />
        </motion.div>
      )}

      {/* TAB 2: LUYỆN PHẢN XẠ 1:1 */}
      {activeTab === 'roleplay' && (
        <BinoRoleplaySection
          lesson={lesson}
          id={id}
          availableRoles={availableRoles}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          roleplayStep={roleplayStep}
          setRoleplayStep={setRoleplayStep}
          showVietsub={showVietsub}
          audioSpeed={audioSpeed}
          isListening={isListening}
          userTranscript={userTranscript}
          setUserTranscript={setUserTranscript}
          roleplayEval={roleplayEval}
          setRoleplayEval={setRoleplayEval}
          startSpeechRecognition={startSpeechRecognition}
          speakText={speakText}
          rewardedRoleplayLinesRef={rewardedRoleplayLinesRef}
          rewardedRoleplayFinishRef={rewardedRoleplayFinishRef}
          consumeElapsedSeconds={consumeElapsedSeconds}
        />
      )}

      {/* TAB 3: CHÉP CHÍNH TẢ */}
      {activeTab === 'dictation' && (
        <BinoDictationSection
          lesson={lesson}
          id={id}
          dictationIndex={dictationIndex}
          setDictationIndex={setDictationIndex}
          dictationInput={dictationInput}
          setDictationInput={setDictationInput}
          dictationChecked={dictationChecked}
          setDictationChecked={setDictationChecked}
          speakText={speakText}
          consumeElapsedSeconds={consumeElapsedSeconds}
          rewardedDictationLinesRef={rewardedDictationLinesRef}
        />
      )}

      {/* Modals */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      <BinoLearningGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
