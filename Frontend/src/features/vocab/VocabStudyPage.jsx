import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Layers, Zap, PenTool, ListOrdered, 
  ChevronLeft, ChevronRight, Trophy, Sparkles, CheckCircle2
} from 'lucide-react';
import useVocabStore from './store/useVocabStore';
import VocabFlashcardMode from './components/VocabFlashcardMode';
import VocabQuizMode from './components/VocabQuizMode';
import VocabSpellingMode from './components/VocabSpellingMode';
import VocabListMode from './components/VocabListMode';

export default function VocabStudyPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flashcard'); // 'flashcard', 'quiz', 'spelling', 'list'

  const { 
    topics, 
    masteredWords, 
    topicScores, 
    fetchProgress, 
    setLastStudiedTopic 
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
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 min-w-[140px] text-center">
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
                topic={topic} 
                onSwitchToQuiz={() => setActiveTab('quiz')} 
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
    </div>
  );
}
