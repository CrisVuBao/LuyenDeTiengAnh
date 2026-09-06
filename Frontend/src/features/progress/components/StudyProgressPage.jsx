import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle2, HelpCircle, BookOpen, RotateCcw, 
  Search, Filter, ExternalLink, Sparkles, Clock, ChevronRight, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import progressApi from '../../../api/progressApi';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import toast from 'react-hot-toast';

export default function StudyProgressPage() {
  const [activeTab, setActiveTab] = useState('unsure'); // 'unsure' | 'parts' | 'tests'
  const [stats, setStats] = useState(null);
  const [testSummaries, setTestSummaries] = useState([]);
  const [unsureQuestions, setUnsureQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartFilter, setSelectedPartFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, summariesRes, unsureRes] = await Promise.all([
        dashboardApi.getStats(),
        progressApi.getAllSummaries(),
        progressApi.getUnsureQuestions()
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (summariesRes?.data) setTestSummaries(summariesRes.data);
      if (unsureRes?.data) setUnsureQuestions(unsureRes.data);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu tiến độ học tập:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetTest = async (testId, testTitle) => {
    if (!confirm(`Bạn có chắc chắn muốn làm lại từ đầu đề "${testTitle}"? Mọi lịch sử ghi nhớ của đề này sẽ được đặt lại về 0.`)) {
      return;
    }

    try {
      await progressApi.resetProgress({ toeicTestId: testId, partNumber: 0 });
      toast.success(`Đã làm lại từ đầu đề "${testTitle}"`);
      loadData();
    } catch (err) {
      toast.error('Lỗi khi reset đề: ' + err.message);
    }
  };

  const filteredUnsure = unsureQuestions.filter((item) => {
    const matchPart = selectedPartFilter === 'all' || item.partNumber.toString() === selectedPartFilter;
    const matchSearch = !searchTerm || 
      (item.questionText && item.questionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.translation && item.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.questionNumber.toString().includes(searchTerm);
    return matchPart && matchSearch;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              Khu Vực Học Viên
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Quản Lý Quá Trình Học Tập
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tỷ lệ ghi nhớ từng Part, danh sách câu hỏi chưa chắc và lịch sử làm bài
          </p>
        </div>

        <button
          onClick={() => navigate('/toeic')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
        >
          <Sparkles size={16} /> Tiếp Tục Luyện Đề
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        <div className="glass-card p-5 md:p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Câu Đã Nhớ</span>
            <div className="w-9 h-9 rounded-2xl bg-green-50 dark:bg-green-950/60 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-green-600">
              {stats?.totalConfidentQuestions || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Đã ghi nhớ sâu</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cần Ôn Tập</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-amber-600">
              {unsureQuestions.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Đánh dấu chưa chắc</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã Hoàn Thành</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalQuestionsLearned || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Lượt câu đã thực hiện</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Độ Thuần Thục</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl md:text-3xl font-black text-indigo-600">
              {stats?.overallMasteryRate || 0}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ nhớ toàn bài</p>
          </div>
        </div>

      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('unsure')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'unsure'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle size={15} /> Câu Hỏi Chưa Chắc ({unsureQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen size={15} /> Lịch Sử Đề Thi ({testSummaries.length})
        </button>
      </div>

      {/* TAB CONTENT: Câu Hỏi Chưa Chắc */}
      {activeTab === 'unsure' && (
        <div className="space-y-5">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter size={13} /> Part:
              </span>
              {['all', '1', '2', '3', '5', '6', '7'].map((part) => (
                <button
                  key={part}
                  onClick={() => setSelectedPartFilter(part)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedPartFilter === part
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* List of Unsure Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUnsure.map((q) => (
              <div
                key={`${q.toeicTestId}-${q.partNumber}-${q.questionNumber}`}
                className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200/60 dark:border-amber-900/60">
                      Câu {q.questionNumber} • Part {q.partNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{q.testCode}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-3">
                    {q.questionText || `Câu hỏi số ${q.questionNumber}`}
                  </h4>

                  {q.translation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2">
                      Dịch: {q.translation}
                    </p>
                  )}

                  {q.correctAnswer && (
                    <div className="mt-3 p-2.5 rounded-xl bg-green-50/70 dark:bg-green-950/30 text-xs text-green-700 dark:text-green-300 font-semibold">
                      ✓ Đáp án đúng: <strong className="font-black">{q.correctAnswer}</strong>
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Lưu lúc: {new Date(q.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    onClick={() => navigate('/toeic')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    Làm lại <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}

            {filteredUnsure.length === 0 && (
              <div className="col-span-full py-16 text-center glass-card rounded-3xl text-slate-400 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-green-500 opacity-60" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tuyệt vời! Không có câu hỏi nào đang ở trạng thái chưa chắc.</p>
                <p className="text-xs">Khi bạn làm đề và bấm nút "? Chưa chắc", các câu hỏi cần ôn lại sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: Lịch Sử Đề Thi */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testSummaries.map((summary) => (
              <div 
                key={summary.toeicTestId}
                className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                      {summary.testId}
                    </span>
                    <button
                      onClick={() => handleResetTest(summary.toeicTestId, summary.title)}
                      className="px-2.5 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Làm lại đề này từ đầu"
                    >
                      <RotateCcw size={12} /> Làm lại từ đầu
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {summary.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Tỷ lệ nhớ:</span>
                      <span className="text-blue-600 dark:text-blue-400">{summary.percentCompleted}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, summary.percentCompleted)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-semibold">Đã nhớ</span>
                      <strong className="text-green-600 font-bold text-sm">{summary.confidentQuestions}</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-semibold">Đã làm</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold text-sm">{summary.completedQuestions}</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tổng câu</span>
                      <strong className="text-slate-600 dark:text-slate-400 font-bold text-sm">{summary.totalQuestions}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/toeic')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
                >
                  Tiếp Tục Luyện Đề Này <ChevronRight size={14} />
                </button>
              </div>
            ))}

            {testSummaries.length === 0 && (
              <div className="col-span-full py-16 text-center glass-card rounded-3xl text-slate-400 text-sm">
                Bạn chưa bắt đầu bài thi nào. Hãy vào "Luyện Đề TOEIC" để bắt đầu bài học đầu tiên!
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
