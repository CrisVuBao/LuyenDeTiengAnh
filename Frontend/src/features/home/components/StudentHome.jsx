import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, BookOpen, ArrowRight, Flame, CheckCircle2, 
  HelpCircle, TrendingUp, Clock, Target, Award, Play 
} from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import useAuthStore from '../../../store/authStore';
import PageLoader from '../../../components/PageLoader';

export default function StudentHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch((err) => console.error('Lỗi lấy thống kê:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const recentTests = stats?.recentTests || [];

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto">
      
      {/* Hero Welcome Banner */}
      <div className="glass-card p-6 md:p-10 rounded-3xl relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-200/60 dark:border-blue-900/40">
        <div className="relative z-10 max-w-2xl">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold mb-4 shadow-sm">
            <Flame size={14} className="text-orange-500" />
            <span>Chuỗi ngày học: {stats?.currentStreakDays || 3} ngày liên tục</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Chào mừng trở lại, <span className="text-gradient">{user?.fullName || 'Học viên'}</span>! 👋
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Hôm nay bạn đã sẵn sàng luyện phản xạ cùng bộ đề TOEIC format mới nhất chưa? Hãy tiếp tục ôn luyện để nâng cao tốc độ phản xạ và ghi nhớ câu hỏi nhé.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/toeic')}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center gap-2.5 transition-all active:scale-95 text-sm"
            >
              <Play size={17} fill="currentColor" /> Vào Luyện Đề TOEIC Ngay
            </button>

            <button
              onClick={() => navigate('/progress')}
              className="px-5 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95 text-sm"
            >
              <TrendingUp size={17} className="text-emerald-500" /> Xem Quá Trình Học
            </button>
          </div>

        </div>
      </div>

      {/* Primary Feature Showcase: TOEIC Practice */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" /> Luyện Đề TOEIC Format Mới
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Luyện trọn bộ 7 Part (Part 1 - 7), giao diện Paper Exam chuẩn phòng thi, phân tích ngữ pháp & AI Tutor
            </p>
          </div>

          <button
            onClick={() => navigate('/toeic')}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xem tất cả đề thi <ArrowRight size={14} />
          </button>
        </div>

        {/* Big Action Card */}
        <div 
          onClick={() => navigate('/toeic')}
          className="glass-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer group transition-all shadow-sm hover:shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Format Chuẩn ETS 2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                  Đã Tích Hợp AI Tutor
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Luyện Phản Xạ Nhanh & Thuộc Làu Câu Hỏi TOEIC
              </h3>

              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-300 leading-relaxed">
                Phương pháp Hack-Speed độc quyền giúp bạn phản xạ đáp án ngay trong 3-5 giây, học từ vựng ngữ cảnh, bẫy đề thi và tự động lưu lại những câu chưa chắc để ôn tập.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-2">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  ✓ Part 1 - 4: Luyện Nghe & Bắt Key
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  ✓ Part 5 - 7: Quét Dẫn Chứng & Ngữ Pháp
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <button className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex items-center justify-center gap-2">
                <span>Vào Làm Bài Ngay</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Recent Tests & Quick Progress Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Tests */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-500" /> Đề Thi Gần Đây Của Bạn
            </h3>
            <button
              onClick={() => navigate('/toeic')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Xem tất cả
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTests.map((test) => (
              <div 
                key={test.toeicTestId}
                onClick={() => navigate(`/toeic?test=${test.testId}`)}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 p-2 rounded-2xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {test.testId}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{test.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Đã nhớ: <strong className="text-green-600">{test.confidentQuestions}/{test.totalQuestions} câu</strong></span>
                    <span>•</span>
                    <span>Tỷ lệ: <strong className="text-blue-600">{test.percentCompleted}%</strong></span>
                  </div>
                </div>

                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-end sm:self-center">
                  <span>Làm tiếp</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}

            {recentTests.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-xs">
                Bạn chưa có tiến độ ở đề thi nào. Hãy bấm "Vào Luyện Đề TOEIC Ngay" để bắt đầu!
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Action Cards */}
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-indigo-500" /> Lối Tắt Cá Nhân
            </h3>
            <p className="text-xs text-slate-400 mt-1">Truy cập nhanh các khu vực theo dõi học tập</p>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => navigate('/progress')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    Câu Hỏi Chưa Chắc
                  </h4>
                  <p className="text-[11px] text-slate-400">Xem lại các câu đánh dấu "?"</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>

            <div
              onClick={() => navigate('/dashboard')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                    Biểu Đồ Tiến Độ
                  </h4>
                  <p className="text-[11px] text-slate-400">Xem phân tích điểm số</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-purple-600/10 border border-blue-200 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300">
            💡 Bạn có thể bấm vào <strong>Ảnh đại diện (Avatar)</strong> ở góc trên bên phải thanh Menu bất kỳ lúc nào để chuyển đổi nhanh giữa các trang!
          </div>
        </div>

      </div>

    </div>
  );
}
