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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/vocab')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Tất Cả 60 Chủ Đề</span>
        </button>

        <div className="flex items-center gap-2">
          {prevTopic && (
            <button
              onClick={() => {
                navigate(`/vocab/${prevTopic.id}`);
                setActiveTab('flashcard');
              }}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title={`Chủ đề trước: ${prevTopic.title}`}
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Chủ đề {prevTopic.id}</span>
            </button>
          )}

          {nextTopic && (
            <button
              onClick={() => {
                navigate(`/vocab/${nextTopic.id}`);
                setActiveTab('flashcard');
              }}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title={`Chủ đề kế tiếp: ${nextTopic.title}`}
            >
              <span className="hidden sm:inline">Chủ đề {nextTopic.id}</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Topic Header Card (Glassmorphic) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase">
              <Sparkles size={12} />
              <span>Chủ Đề {topic.id} / 60</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {topic.title}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Tổng cộng <strong>{words.length} từ vựng</strong> thiết yếu trong giao tiếp hàng ngày
            </p>
          </div>

          {/* Mastered Progress Widget */}
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 min-w-[145px] text-center">
            <div className="text-left sm:text-center">
              <span className="text-[11px] font-semibold text-blue-100 block">Đã ghi nhớ</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                {masteredCount}/{words.length} từ
              </span>
            </div>
            <div className="w-24 sm:w-full h-2 rounded-full bg-black/20 overflow-hidden">
              <div 
                className="h-full bg-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {masteredCount > 0 && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="mt-0.5 px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-white/20"
                title="Đặt lại toàn bộ từ vựng chủ đề này để học lại từ đầu"
              >
                <RotateCcw size={12} />
                <span>Học lại từ đầu</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Mode Tabs (Apple-style Pills) */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
        {[
          { id: 'flashcard', label: 'Flashcard 3D', icon: Layers },
          { id: 'quiz', label: 'Trắc Nghiệm Nhanh', icon: Zap },
          { id: 'spelling', label: 'Gõ Chính Tả', icon: PenTool },
          { id: 'list', label: `Danh Sách (${words.length})`, icon: ListOrdered }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
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
