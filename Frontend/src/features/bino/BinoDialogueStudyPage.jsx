import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Volume2, Bookmark, CheckCircle2, 
  RotateCcw, Sparkles, Mic, Eye, EyeOff, BookOpen, MessageSquare, 
  HelpCircle, ChevronRight, Layers, Award, FileText, Check, Copy, Settings
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

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

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      speechService.stop();
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
      speed: speed || audioSpeed
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

  // Play dialogue lines in sequence with dramatized character voices
  const playAllLines = () => {
    if (!lesson?.dialogueLines?.length) return;
    if (isPlayingAll) {
      speechService.stop();
      setIsPlayingAll(false);
      setActiveLineIndex(null);
      return;
    }

    setIsPlayingAll(true);
    let index = 0;

    const playNext = () => {
      if (index >= lesson.dialogueLines.length) {
        setIsPlayingAll(false);
        setActiveLineIndex(null);
        return;
      }

      setActiveLineIndex(index);
      const line = lesson.dialogueLines[index];
      speechService.speakLine({
        text: line.englishText,
        characterName: line.characterName,
        speed: audioSpeed,
        onEnd: () => {
          index++;
          setTimeout(playNext, 500);
        },
        onError: () => {
          setIsPlayingAll(false);
          setActiveLineIndex(null);
        }
      });
    };

    playNext();
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
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-blue-50/50 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={playAllLines}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
              isPlayingAll
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
            }`}
          >
            {isPlayingAll ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            <span>{isPlayingAll ? 'Tạm Dừng Nghe' : 'Nghe Toàn Bài Hội Thoại'}</span>
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
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-serif italic">
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
                    className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : isBino
                        ? 'bg-orange-50/40 dark:bg-slate-800/80 border-orange-200/60 dark:border-slate-700/80'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
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
                        </div>

                        {/* English Line */}
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          "{line.englishText}"
                        </p>

                        {/* Vietnamese Translation (Styled in reddish-italic as in book) */}
                        {showVietsub && line.vietnameseText && (
                          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-serif italic leading-relaxed">
                            ({line.vietnameseText})
                          </p>
                        )}
                      </div>

                      {/* Line Audio Play Button */}
                      <button
                        onClick={() => speakText(line.englishText, line.characterName)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
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
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 italic mt-1 font-serif">
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
                <p className="text-xs text-red-600 italic font-serif">
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
