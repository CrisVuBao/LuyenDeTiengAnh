import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, HelpCircle, Activity, 
  TrendingUp, ArrowRight, ShieldCheck, UserCheck, Plus, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.getAdminStats()
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch((err) => console.error('Lỗi lấy thống kê admin:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Admin Portal
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Trung Tâm Quản Trị Hệ Thống
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tổng quan dữ liệu học viên, đề thi TOEIC và hoạt động toàn sàn VBaceEnglish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tests')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
          >
            <Plus size={16} /> Thêm Đề Thi Mới
          </button>
          <button
            onClick={() => navigate('/toeic')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Sparkles size={16} className="text-amber-500" /> Trải Nghiệm Thi Thử
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Students */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Học Viên</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalStudents || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tài khoản học viên kích hoạt</p>
          </div>
        </div>

        {/* Total Tests */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Đề Thi</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalTests || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Đề thi trong SQL Server</p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Câu Hỏi</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalQuestions || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Gồm 7 Part TOEIC</p>
          </div>
        </div>

        {/* Total Interactions */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lượt Tương Tác Học</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalStudyInteractions || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Lần bấm nhớ / trả lời câu</p>
          </div>
        </div>

      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Students Table (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck size={20} className="text-blue-500" /> Học Viên Mới Tham Gia
              </h3>
              <p className="text-xs text-slate-400">Danh sách các học viên mới đăng ký gần đây</p>
            </div>
            <button
              onClick={() => navigate('/admin/students')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Học viên</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2 text-center">Đề đã học</th>
                  <th className="py-3 px-2 text-center">Câu đã nhớ</th>
                  <th className="py-3 px-2 text-center">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {stats?.recentStudents?.map((s) => (
                  <tr key={s.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {s.fullName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{s.fullName}</span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-500">{s.email}</td>
                    <td className="py-3.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{s.testsEnrolled}</td>
                    <td className="py-3.5 px-2 text-center font-bold text-green-600">{s.confidentQuestions}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {s.masteryRate}%
                      </span>
                    </td>
                  </tr>
                ))}

                {(!stats?.recentStudents || stats.recentStudents.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có học viên nào đăng ký tài khoản.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Shortcuts (1 Col) */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" /> Tác Vụ Quản Trị Nhanh
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/tests')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                    Quản Lý Đề Thi TOEIC
                  </h4>
                  <p className="text-[11px] text-slate-400">Import JSON đề mới, xóa, sửa</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/students')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                    Danh Sách Học Viên
                  </h4>
                  <p className="text-[11px] text-slate-400">Xem tiến độ học tập từng người</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/toeic')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                    Luyện Đề (Chế độ Học Viên)
                  </h4>
                  <p className="text-[11px] text-slate-400">Kiểm tra trải nghiệm thi thật</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300">
            💡 <strong>Mẹo quản trị:</strong> Sau khi tải lên bộ đề thi JSON mới, hãy truy cập vào <em>"Luyện Đề"</em> để duyệt và chạy thử các Part 1 - 7 trước khi mở cho học viên.
          </div>
        </div>

      </div>

    </div>
  );
}
