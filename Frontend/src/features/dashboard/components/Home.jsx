import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Flame, BookOpen, Target, 
  ArrowRight, Award, TrendingUp, Sparkles, Clock 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import useAuthStore from '../../../store/authStore';
import PageLoader from '../../../components/PageLoader';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch((err) => console.error("Lỗi lấy thống kê:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const recentTests = stats?.recentTests || [];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <Sparkles size={14} /> Chế độ Hack-Speed 3 Ngày
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Chào mừng trở lại, <span className="text-gradient">{user?.fullName || 'Chiến binh TOEIC'}</span>!
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Hôm nay hãy tiếp tục duy trì chuỗi phản xạ nhanh để chinh phục mốc điểm TOEIC mong muốn trước kỳ thi nhé.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/toeic')}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center gap-2.5 transition-all active:scale-95 text-sm"
          >
            <BookOpen size={18} /> Luyện Đề TOEIC <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="px-5 py-3.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95 text-sm"
          >
            <TrendingUp size={18} className="text-emerald-500" /> Quá Trình Học
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        <div className="glass-card p-5 md:p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Số Đề Thi</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stats?.totalTests || 2}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đề chuẩn format ETS</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-green-600 dark:text-green-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Đã Nhớ Chắc</span>
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-green-600 dark:text-green-400">{stats?.totalConfidentQuestions || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Câu hỏi đã thuộc làu</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Độ Thành Thục</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stats?.overallMasteryRate || 0}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tiến độ toàn bộ kho đề</p>
          </div>
        </div>

        <div className="glass-card p-5 md:p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-500 dark:text-orange-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chuỗi Ngày Học</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center">
              <Flame size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-orange-500">{stats?.currentStreakDays || 3} ngày</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Duy trì phản xạ hàng ngày</p>
          </div>
        </div>

      </div>

      {/* Progress Chart & Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tiến Độ Ghi Nhớ Từng Đề</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ phần trăm câu đã nhớ của mỗi đề thi</p>
            </div>
            <Target size={20} className="text-blue-500" />
          </div>

          <div className="h-64 w-full">
            {recentTests.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentTests}>
                  <XAxis dataKey="testId" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} 
                  />
                  <Bar dataKey="percentCompleted" radius={[8, 8, 0, 0]}>
                    {recentTests.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <BookOpen size={32} className="mb-2 opacity-50" />
                Chưa có dữ liệu học. Hãy bắt đầu luyện đề đầu tiên!
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Resume List */}
        <div className="glass-card p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Đề Thi Gần Đây
          </h3>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentTests.length > 0 ? (
              recentTests.map((test) => (
                <div 
                  key={test.toeicTestId}
                  onClick={() => navigate(`/toeic?test=${test.testId}`)}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{test.testId}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">
                      {test.confidentQuestions}/{test.totalQuestions} câu ({test.percentCompleted}%)
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Bạn chưa có lịch sử học đề nào.
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/toeic')}
            className="w-full mt-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors text-center"
          >
            Xem tất cả đề thi →
          </button>
        </div>

      </div>

    </div>
  );
}
