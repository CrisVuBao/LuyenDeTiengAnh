import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Layers, Zap, PenTool, ListOrdered, 
  ChevronLeft, ChevronRight, Trophy, Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import useVocabStore from './store/useVocabStore';
import VocabFlashcardMode from './components/VocabFlashcardMode';
import VocabQuizMode from './components/VocabQuizMode';
import VocabSpellingMode from './components/VocabSpellingMode';
import VocabListMode from './components/VocabListMode';

export default function VocabStudyPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flashcard'); // 'flashcard', 'quiz', 'spelling', 'list'
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const { 
    topics, 
    masteredWords, 
    topicScores, 
    fetchProgress, 
    setLastStudiedTopic,
    resetTopicProgress 
  } = useVocabStore();

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const currentTopicId = parseInt(topicId) || 1;
  const topic = topics.find((t) => t.id === currentTopicId) || topics[0];

  useEffect(() => {
    if (topic) {
      setLastStudiedTopic(topic.id);
    }
  }, [topic, setLastStudiedTopic]);

  if (!topic) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <p className="text-slate-500">Không tìm thấy chủ đề từ vựng.</p>
        <Link to="/vocab" className="text-[#0071e3] font-bold hover:underline">
          Về danh sách 60 chủ đề
        </Link>
      </div>
    );
  }

  const words = topic.words || [];
  const masteredCount = words.filter((w) => masteredWords[w.id]).length;
  const progressPercent = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;
  const topicScore = topicScores[topic.id];

  const prevTopic = topics.find((t) => t.id === currentTopicId - 1);
  const nextTopic = topics.find((t) => t.id === currentTopicId + 1);

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
      
      {/* ========================================================
          1A. MOBILE APP TOP HEADER PAVILION (sm:hidden)
          ======================================================== */}
      <div className="sm:hidden flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <button
          onClick={() => navigate('/vocab')}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform shrink-0"
          title="Về danh sách 60 chủ đề"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="min-w-0 flex-1 px-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-sky-400">
              Chủ đề {topic.id}/60
            </span>
            <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate">
              {masteredCount}/{words.length} ({progressPercent}%)
            </span>
          </div>
          <h2 className="text-[13.5px] font-black text-slate-900 dark:text-white truncate leading-tight">
            {topic.title}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {prevTopic && (
            <button
              onClick={() => {
                navigate(`/vocab/${prevTopic.id}`);
                setActiveTab('flashcard');
              }}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95"
              title={`Chủ đề trước: ${prevTopic.title}`}
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {nextTopic && (
            <button
              onClick={() => {
                navigate(`/vocab/${nextTopic.id}`);
                setActiveTab('flashcard');
              }}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95"
              title={`Chủ đề tiếp: ${nextTopic.title}`}
            >
              <ChevronRight size={14} />
            </button>
          )}

          {masteredCount > 0 && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center active:scale-95 border border-amber-200/60 dark:border-amber-900/60"
              title="Đặt lại tiến độ chủ đề này"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          1B. DESKTOP HEADER & NAVIGATION (hidden sm:flex)
          Spacious, Elegant, Never-truncated Title + Progress + Prev/Next
          ======================================================== */}
      <div className="hidden sm:flex items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Left: Back Arrow + Topic Badge & FULL Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate('/vocab')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Về danh sách 60 chủ đề"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                Chủ đề {topic.id} / 60
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {words.length} từ vựng cốt lõi
              </span>
            </div>
            <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white truncate" title={topic.title}>
              {topic.title}
            </h1>
          </div>
        </div>

        {/* Right: Progress Pill + Reset + Prev/Next Navigation */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Đã thuộc</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 leading-tight">
                {masteredCount}/{words.length} <span className="text-[10px] text-slate-400 font-semibold">({progressPercent}%)</span>
              </span>
            </div>
            <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {masteredCount > 0 && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-900/40 transition-colors cursor-pointer"
              title="Đặt lại tiến độ chủ đề này để học lại từ đầu"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            {prevTopic && (
              <button
                onClick={() => {
                  navigate(`/vocab/${prevTopic.id}`);
                  setActiveTab('flashcard');
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={`Chủ đề trước: ${prevTopic.title}`}
              >
                <ChevronLeft size={15} />
              </button>
            )}

            {nextTopic && (
              <button
                onClick={() => {
                  navigate(`/vocab/${nextTopic.id}`);
                  setActiveTab('flashcard');
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={`Chủ đề kế tiếp: ${nextTopic.title}`}
              >
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. STUDY MODE TABS (Unified for Mobile & Desktop)
          Segmented control bar: Flashcard 3D | Trắc nghiệm | Chính tả | Danh sách
          ======================================================== */}
      <div className="grid grid-cols-4 items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {[
          { id: 'flashcard', label: 'Flashcard 3D', shortLabel: 'Flashcard', icon: Layers },
          { id: 'quiz', label: 'Trắc nghiệm', shortLabel: 'Trắc nghiệm', icon: Zap },
          { id: 'spelling', label: 'Gõ chính tả', shortLabel: 'Chính tả', icon: PenTool },
          { id: 'list', label: `Danh sách (${words.length})`, shortLabel: `Từ (${words.length})`, icon: ListOrdered }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 sm:px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="pt-0.5 sm:pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'flashcard' && (
              <VocabFlashcardMode 
                key={`${topic.id}-${resetKey}`}
                topic={topic} 
                onSwitchToQuiz={() => setActiveTab('quiz')} 
                onReset={() => setResetKey((k) => k + 1)}
              />
            )}

            {activeTab === 'quiz' && (
              <VocabQuizMode 
                topic={topic} 
                allTopics={topics}
                onSwitchToFlashcard={() => setActiveTab('flashcard')} 
              />
            )}

            {activeTab === 'spelling' && (
              <VocabSpellingMode 
                topic={topic}
                onSwitchToFlashcard={() => setActiveTab('flashcard')} 
              />
            )}

            {activeTab === 'list' && (
              <VocabListMode topic={topic} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modal xác nhận Đặt lại tiến độ chủ đề */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Đặt Lại Chủ Đề {topic.id}?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topic.title}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                Toàn bộ <strong className="text-amber-600 dark:text-amber-400 font-bold">{masteredCount} từ</strong> bạn đã đánh dấu thuộc trong chủ đề này sẽ được chuyển về trạng thái <strong>Chưa thuộc</strong> và vị trí học sẽ quay về thẻ số 1 để bạn luyện tập lại từ đầu.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetTopicProgress(topic.id);
                    setResetKey((k) => k + 1);
                    setShowResetModal(false);
                    toast.success(`Đã đặt lại Chủ đề ${topic.id}! Bạn có thể bắt đầu học từ đầu.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Xác Nhận Đặt Lại</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
