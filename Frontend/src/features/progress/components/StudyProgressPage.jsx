import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, CheckCircle2, HelpCircle, BookOpen, RotateCcw, 
  Search, Filter, Sparkles, Clock, ChevronRight, ChevronDown,
  Headphones, Mic, FileText, Layers, Flame, Play
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import progressApi from '../../../api/progressApi';
import binoApi from '../../../api/binoApi';
import { dashboardApi, invalidateStatsCache } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import toast from 'react-hot-toast';

export default function StudyProgressPage() {
  // Chế độ chính: 'bino' (Khóa học Chém Tiếng Anh Bino - Mặc định) | 'toeic' (Luyện đề TOEIC)
  const [courseMode, setCourseMode] = useState('bino');

  // Bino state
  const [binoSummary, setBinoSummary] = useState(null);
  const [binoSubTab, setBinoSubTab] = useState('chapters'); // 'chapters' | 'recent'
  const [chapterStatusFilter, setChapterStatusFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'unstarted'
  const [binoSearch, setBinoSearch] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({ 1: true });

  // TOEIC state
  const [activeToeicTab, setActiveToeicTab] = useState('unsure'); // 'unsure' | 'tests'
  const [stats, setStats] = useState(null);
  const [testSummaries, setTestSummaries] = useState([]);
  const [unsureQuestions, setUnsureQuestions] = useState([]);
  const [selectedPartFilter, setSelectedPartFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [binoRes, statsRes, summariesRes, unsureRes] = await Promise.allSettled([
        binoApi.getProgressSummary(true),
        dashboardApi.getStats(true),
        progressApi.getAllSummaries(),
        progressApi.getUnsureQuestions()
      ]);

      if (binoRes.status === 'fulfilled' && binoRes.value?.data) {
        const data = binoRes.value.data;
        setBinoSummary(data);
        // Tự động mở rộng chương đầu tiên có bài đã học hoặc Chương 1
        const activeChap = data.chaptersProgress?.find(
          (c) => c.completedLessons > 0 && c.completedLessons < c.totalLessons
        ) || data.chaptersProgress?.[0];
        if (activeChap) {
          setExpandedChapters((prev) => ({ ...prev, [activeChap.chapterNumber]: true }));
        }
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (summariesRes.status === 'fulfilled' && summariesRes.value?.data) {
        setTestSummaries(summariesRes.value.data);
      }
      if (unsureRes.status === 'fulfilled' && unsureRes.value?.data) {
        setUnsureQuestions(unsureRes.value.data);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu tiến độ học tập:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpandChapter = (chapterNumber) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterNumber]: !prev[chapterNumber]
    }));
  };

  const handleToggleBinoLessonComplete = async (dialogue) => {
    const nextState = !dialogue.isCompleted;
    try {
      await binoApi.markProgress({
        dialogueLessonId: dialogue.dialogueLessonId,
        isCompleted: nextState,
        timeSpentSeconds: 0
      });
      invalidateStatsCache();
      toast.success(
        nextState
          ? `Đã đánh dấu hoàn thành "${dialogue.title}"`
          : `Đã chuyển "${dialogue.title}" về chưa hoàn thành`
      );
      const fresh = await binoApi.getProgressSummary(true);
      if (fresh?.data) setBinoSummary(fresh.data);
    } catch {
      toast.error('Không thể cập nhật trạng thái bài học');
    }
  };

  const handleResetBinoChapter = async (chapterNumber, chapterTitle) => {
    const label = chapterNumber
      ? `Chương ${chapterNumber < 10 ? `0${chapterNumber}` : chapterNumber}: ${chapterTitle}`
      : 'toàn bộ 12 chương khóa học Bino';

    if (!window.confirm(`Bạn có chắc chắn muốn đặt lại tiến độ của ${label} về 0?`)) {
      return;
    }

    try {
      const res = await binoApi.resetProgress(chapterNumber);
      invalidateStatsCache();
      toast.success(res?.message || 'Đã đặt lại tiến độ thành công');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi đặt lại tiến độ: ' + (err.message || ''));
    }
  };

  const handleResetTest = async (testId, testTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn làm lại từ đầu đề "${testTitle}"? Mọi lịch sử ghi nhớ của đề này sẽ được đặt lại về 0.`)) {
      return;
    }

    try {
      await progressApi.resetProgress({ toeicTestId: testId, partNumber: 0 });
      invalidateStatsCache();
      toast.success(`Đã làm lại từ đầu đề "${testTitle}"`);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi reset đề: ' + err.message);
    }
  };

  if (loading) return <PageLoader />;

  const chaptersProgress = binoSummary?.chaptersProgress || [];
  const recentBinoDialogues = binoSummary?.recentStudiedDialogues || [];

  const filteredChapters = chaptersProgress.filter((ch) => {
    if (chapterStatusFilter === 'completed' && ch.completedLessons < ch.totalLessons) return false;
    if (chapterStatusFilter === 'active' && (ch.completedLessons === 0 && ch.audioListenedCount === 0 && ch.roleplayCount === 0 && ch.dictationCount === 0)) return false;
    if (chapterStatusFilter === 'unstarted' && (ch.completedLessons > 0 || ch.audioListenedCount > 0)) return false;

    if (binoSearch.trim()) {
      const q = binoSearch.toLowerCase();
      const matchChap =
        ch.title?.toLowerCase().includes(q) ||
        ch.titleVi?.toLowerCase().includes(q) ||
        `chương ${ch.chapterNumber}`.includes(q);
      const matchLesson = ch.dialogues?.some(
        (d) => d.title?.toLowerCase().includes(q) || d.titleVi?.toLowerCase().includes(q)
      );
      return matchChap || matchLesson;
    }
    return true;
  });

  const chartData = chaptersProgress.map((ch) => ({
    name: `Ch.${ch.chapterNumber < 10 ? `0${ch.chapterNumber}` : ch.chapterNumber}`,
    percent: ch.progressPercent,
    completed: ch.completedLessons,
    total: ch.totalLessons
  }));

  const filteredUnsure = unsureQuestions.filter((item) => {
    const matchPart = selectedPartFilter === 'all' || item.partNumber.toString() === selectedPartFilter;
    const matchSearch = !searchTerm || 
      (item.questionText && item.questionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.translation && item.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.questionNumber.toString().includes(searchTerm);
    return matchPart && matchSearch;
  });

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0 phút';
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} giờ ${rem} phút` : `${hrs} giờ`;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* ===================================================================== */}
      {/* HEADER & APPLE SEGMENTED SWITCHER (BINO vs TOEIC)                     */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
            Theo dõi số liệu thực tế
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Quản Lý Quá Trình Học Tập
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Số liệu đồng bộ chính xác 100% theo từng bài hội thoại Bino, thẻ Flashcard SRS và đề thi TOEIC.
          </p>
        </div>

        {/* Apple Segmented Course Switcher */}
        <div className="inline-flex p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 self-stretch sm:self-auto">
          <button
            onClick={() => setCourseMode('bino')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              courseMode === 'bino'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Chém Tiếng Anh Bino</span>
          </button>

          <button
            onClick={() => setCourseMode('toeic')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              courseMode === 'toeic'
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Luyện Đề TOEIC</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: QUẢN LÝ QUÁ TRÌNH HỌC TẬP "CHÉM TIẾNG ANH BINO"              */}
      {/* ===================================================================== */}
      {courseMode === 'bino' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* 4 Apple Bento KPI Cards for Bino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Tiến độ bài hội thoại */}
            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Hội thoại hoàn thành
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {binoSummary?.completedLessons ?? 0}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    / {binoSummary?.totalLessons ?? 72} bài ({binoSummary?.progressPercentage ?? 0}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hoàn tất {binoSummary?.completedChapters ?? 0}/{binoSummary?.totalChapters ?? 12} chương • Đang học {binoSummary?.inProgressLessons ?? 0} bài
                </p>
              </div>
            </div>

            {/* KPI 2: Kỹ năng phản xạ (Nghe • Roleplay • Dictation) */}
            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Luyện phản xạ 3 kỹ năng
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Mic size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {binoSummary?.roleplayCompletedCount ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    bài đóng vai 1:1
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đã nghe: <strong>{binoSummary?.audioListenedCount ?? 0}</strong> bài • Chính tả: <strong>{binoSummary?.dictationPracticedCount ?? 0}</strong> bài ({binoSummary?.averageDictationScore ?? 0}%)
                </p>
              </div>
            </div>

            {/* KPI 3: Từ vựng Flashcard SRS */}
            <div
              onClick={() => navigate('/bino/flashcards')}
              className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-[#0071e3]/40 cursor-pointer shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Từ vựng Flashcard SRS
                </span>
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Layers size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {binoSummary?.savedFlashcardsCount ?? 0}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    / {binoSummary?.totalBookVocabularies ?? 427} từ khóa
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thuộc sâu: <strong>{binoSummary?.masteredFlashcardsCount ?? 0}</strong> từ • Đến hạn ôn: <strong className="text-[#0071e3] dark:text-sky-400">{binoSummary?.dueFlashcardsCount ?? 0}</strong> thẻ
                </p>
              </div>
            </div>

            {/* KPI 4: Thời lượng & Chuỗi ngày học */}
            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Thời gian & Chuỗi ngày
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {binoSummary?.currentStreakDays ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    ngày học liên tiếp
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tổng thời gian luyện Bino: <strong>{formatDuration(binoSummary?.totalTimeSpentSeconds ?? 0)}</strong>
                </p>
              </div>
            </div>

          </div>

          {/* Biểu Đồ Tiến Độ 12 Chương Bino */}
          <div className="p-6 sm:p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Biểu Đồ Hoàn Thành 12 Chương Sách Bino
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tỷ lệ phần trăm bài hội thoại đã hoàn thành ở từng chương (Chương 01 – Chương 12)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/bino')}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Học tiếp Bino</span>
                </button>
                <button
                  onClick={() => handleResetBinoChapter(null, '')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đặt lại toàn bộ tiến độ Bino"
                >
                  <RotateCcw size={13} />
                  <span>Reset toàn bộ</span>
                </button>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}% (${props.payload.completed}/${props.payload.total} bài)`,
                      'Tiến độ'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '14px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="percent" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`bino-bar-${idx}`}
                        fill={entry.percent === 100 ? '#10b981' : '#0071e3'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bino Sub-Navigation Tabs: Chi tiết 12 chương vs Lịch sử học gần đây */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBinoSubTab('chapters')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  binoSubTab === 'chapters'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Chi Tiết 12 Chương & 72 Bài Học
              </button>

              <button
                onClick={() => setBinoSubTab('recent')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  binoSubTab === 'recent'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Lịch Sử Học Gần Đây ({recentBinoDialogues.length})
              </button>
            </div>

            {binoSubTab === 'chapters' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Tất cả (12)' },
                  { id: 'active', label: 'Đang học / Đã học' },
                  { id: 'completed', label: 'Hoàn tất 100%' },
                  { id: 'unstarted', label: 'Chưa học' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setChapterStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      chapterStatusFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={binoSearch}
                    onChange={(e) => setBinoSearch(e.target.value)}
                    placeholder="Tìm chương hoặc bài học..."
                    className="pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SUB-TAB 1: CHI TIẾT TỪNG CHƯƠNG & TỪNG BÀI HỘI THOẠI */}
          {binoSubTab === 'chapters' && (
            <div className="space-y-4">
              {filteredChapters.map((chap) => {
                const isExpanded = !!expandedChapters[chap.chapterNumber];
                return (
                  <div
                    key={chap.chapterId}
                    className="rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-[0_2px_12px_rgb(0,0,0,0.02)]"
                  >
                    {/* Chapter Header Row */}
                    <div
                      onClick={() => toggleExpandChapter(chap.chapterNumber)}
                      className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/15 dark:text-sky-400 text-xs font-semibold">
                            Chương {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {chap.title}
                          </h3>
                          {chap.titleVi && (
                            <span className="text-xs text-slate-400 font-vietsub">
                              — {chap.titleVi}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Hoàn thành: <strong className="text-slate-800 dark:text-slate-200">{chap.completedLessons}/{chap.totalLessons} bài</strong> ({chap.progressPercent}%)
                          </span>
                          <span>•</span>
                          <span>Đã nghe: <strong>{chap.audioListenedCount}</strong></span>
                          <span>•</span>
                          <span>Đóng vai 1:1: <strong>{chap.roleplayCount}</strong></span>
                          <span>•</span>
                          <span>Chính tả: <strong>{chap.dictationCount}</strong></span>
                          <span>•</span>
                          <span>Flashcard đã lưu: <strong>{chap.savedVocabCount}/{chap.totalVocabCount} từ</strong></span>
                          {chap.timeSpentSeconds > 0 && (
                            <>
                              <span>•</span>
                              <span>Thời gian: <strong>{formatDuration(chap.timeSpentSeconds)}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end lg:self-center">
                        <div className="w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              chap.progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#0071e3]'
                            }`}
                            style={{ width: `${Math.max(4, chap.progressPercent)}%` }}
                          />
                        </div>

                        {(chap.completedLessons > 0 || chap.audioListenedCount > 0 || chap.roleplayCount > 0 || chap.dictationCount > 0) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetBinoChapter(chap.chapterNumber, chap.title);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Làm lại chương này từ đầu"
                          >
                            <RotateCcw size={12} />
                            <span>Làm lại</span>
                          </button>
                        )}

                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded 6 Dialogue Lessons Table/List */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="border-t border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/40 dark:bg-slate-900/50"
                        >
                          {chap.dialogues?.map((dl) => (
                            <div
                              key={dl.dialogueLessonId}
                              className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <button
                                  onClick={() => handleToggleBinoLessonComplete(dl)}
                                  className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                                    dl.isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-[#0071e3]'
                                  }`}
                                  title={dl.isCompleted ? 'Bấm để bỏ đánh dấu hoàn thành' : 'Bấm để đánh dấu hoàn thành'}
                                >
                                  <CheckCircle2 size={14} />
                                </button>

                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400">
                                      Bài {dl.dialogueNumber}
                                    </span>
                                    <h4
                                      onClick={() => navigate(`/bino/dialogue/${dl.dialogueLessonId}`)}
                                      className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#0071e3] dark:hover:text-sky-400 cursor-pointer truncate"
                                    >
                                      {dl.title}
                                    </h4>
                                  </div>

                                  {/* Skill Badges */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                                        dl.hasWatchedVideo
                                          ? 'bg-blue-50 text-[#0071e3] dark:bg-sky-950/70 dark:text-sky-300'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                      }`}
                                    >
                                      <Headphones size={11} />
                                      {dl.hasWatchedVideo ? 'Đã nghe' : 'Chưa nghe'}
                                    </span>

                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                                        dl.roleplayCompleted
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                      }`}
                                    >
                                      <Mic size={11} />
                                      {dl.roleplayCompleted ? 'Đã đóng vai 1:1' : 'Chưa đóng vai'}
                                    </span>

                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                                        dl.dictationScore !== null && dl.dictationScore !== undefined
                                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                      }`}
                                    >
                                      <FileText size={11} />
                                      {dl.dictationScore !== null && dl.dictationScore !== undefined
                                        ? `Chính tả: ${dl.dictationScore}%`
                                        : 'Chưa chép chính tả'}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                      Flashcard: {dl.savedVocabularyCount}/{dl.vocabularyCount} từ
                                    </span>

                                    {dl.timeSpentSeconds > 0 && (
                                      <span className="text-[11px] text-slate-400">
                                        • {formatDuration(dl.timeSpentSeconds)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 shrink-0">
                                {dl.lastAccessedAt && (
                                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                                    Học lúc: {new Date(dl.lastAccessedAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                                <button
                                  onClick={() => navigate(`/bino/dialogue/${dl.dialogueLessonId}`)}
                                  className="px-3.5 py-1.5 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3] text-[#0071e3] hover:text-white dark:bg-sky-500/15 dark:text-sky-400 dark:hover:bg-[#0071e3] dark:hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>{dl.isCompleted ? 'Ôn lại' : 'Vào học'}</span>
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-TAB 2: LỊCH SỬ HỌC BINO GẦN ĐÂY */}
          {binoSubTab === 'recent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentBinoDialogues.map((dl) => (
                <div
                  key={dl.dialogueLessonId}
                  onClick={() => navigate(`/bino/dialogue/${dl.dialogueLessonId}`)}
                  className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 text-[11px] font-semibold">
                        Chương {dl.chapterNumber} • Bài {dl.dialogueNumber}
                      </span>
                      {dl.isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-semibold">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0071e3] transition-colors">
                      {dl.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Truy cập gần nhất: {dl.lastAccessedAt ? new Date(dl.lastAccessedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''} • Đã học {formatDuration(dl.timeSpentSeconds)}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#0071e3] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}

              {recentBinoDialogues.length === 0 && (
                <div className="col-span-full py-16 text-center rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-2">
                  <Sparkles size={32} className="mx-auto text-[#0071e3] opacity-70" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Bạn chưa có lịch sử học bài hội thoại Bino nào.
                  </p>
                  <p className="text-xs">
                    Hãy vào mục &ldquo;Chém Tiếng Anh Bino&rdquo; để bắt đầu bài hội thoại đầu tiên nhé!
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: QUẢN LÝ QUÁ TRÌNH HỌC TẬP "LUYỆN ĐỀ TOEIC"                    */}
      {/* ===================================================================== */}
      {courseMode === 'toeic' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* KPI Overview Cards for TOEIC */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Câu Đã Nhớ</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-emerald-600">
                  {stats?.totalConfidentQuestions || 0}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Đã ghi nhớ sâu</p>
              </div>
            </div>

            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cần Ôn Tập</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <HelpCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-amber-600">
                  {unsureQuestions.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Đánh dấu chưa chắc</p>
              </div>
            </div>

            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đã Hoàn Thành</span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalQuestionsLearned || 0}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Lượt câu đã thực hiện</p>
              </div>
            </div>

            <div className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Độ Thuần Thục</span>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Award size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl md:text-3xl font-bold text-[#0071e3]">
                  {stats?.overallMasteryRate || 0}%
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ nhớ toàn bài</p>
              </div>
            </div>
          </div>

          {/* TOEIC Tabs Control */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveToeicTab('unsure')}
              className={`px-4 py-2 rounded-full font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeToeicTab === 'unsure'
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <HelpCircle size={14} /> Câu Hỏi Chưa Chắc ({unsureQuestions.length})
            </button>

            <button
              onClick={() => setActiveToeicTab('tests')}
              className={`px-4 py-2 rounded-full font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeToeicTab === 'tests'
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen size={14} /> Lịch Sử Đề Thi ({testSummaries.length})
            </button>
          </div>

          {/* TAB CONTENT: Câu Hỏi Chưa Chắc */}
          {activeToeicTab === 'unsure' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Filter size={13} /> Part:
                  </span>
                  {['all', '1', '2', '3', '5', '6', '7'].map((part) => (
                    <button
                      key={part}
                      onClick={() => setSelectedPartFilter(part)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        selectedPartFilter === part
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {part === 'all' ? 'Tất cả' : `Part ${part}`}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm nội dung câu hỏi..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnsure.map((q) => (
                  <div
                    key={`${q.toeicTestId}-${q.partNumber}-${q.questionNumber}`}
                    className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                          Câu {q.questionNumber} • Part {q.partNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{q.testCode}</span>
                      </div>

                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-3">
                        {q.questionText || `Câu hỏi số ${q.questionNumber}`}
                      </h4>

                      {q.translation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2">
                          Dịch: {q.translation}
                        </p>
                      )}

                      {q.correctAnswer && (
                        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ Đáp án đúng: <strong>{q.correctAnswer}</strong>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Lưu lúc: {new Date(q.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                      <button
                        onClick={() => navigate(`/toeic?test=${q.testCode}`)}
                        className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0071e3] hover:text-white rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Làm lại <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredUnsure.length === 0 && (
                  <div className="col-span-full py-16 text-center rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-2">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Tuyệt vời! Không có câu hỏi TOEIC nào đang ở trạng thái chưa chắc.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Lịch Sử Đề Thi */}
          {activeToeicTab === 'tests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {testSummaries.map((summary) => (
                <div 
                  key={summary.toeicTestId}
                  className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400">
                        {summary.testId}
                      </span>
                      <button
                        onClick={() => handleResetTest(summary.toeicTestId, summary.title)}
                        className="px-2.5 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} /> Làm lại từ đầu
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {summary.title}
                    </h3>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Tỷ lệ nhớ:</span>
                        <span className="text-[#0071e3] dark:text-sky-400">{summary.percentCompleted}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-[#0071e3] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, summary.percentCompleted)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-400 block font-medium">Đã nhớ</span>
                        <strong className="text-emerald-600 font-bold text-sm">{summary.confidentQuestions}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-400 block font-medium">Đã làm</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold text-sm">{summary.completedQuestions}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-[10px] text-slate-400 block font-medium">Tổng câu</span>
                        <strong className="text-slate-600 dark:text-slate-400 font-bold text-sm">{summary.totalQuestions}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/toeic?test=${summary.testId}`)}
                    className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Tiếp tục luyện đề này <ChevronRight size={14} />
                  </button>
                </div>
              ))}

              {testSummaries.length === 0 && (
                <div className="col-span-full py-16 text-center rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-sm">
                  Bạn chưa bắt đầu đề thi TOEIC nào.
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
