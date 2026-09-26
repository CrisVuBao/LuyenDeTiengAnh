import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  HelpCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  const fetchStats = () => {
    setLoading(true);
    dashboardApi
      .getAdminStats()
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch((err) => console.error('Lỗi lấy thống kê admin:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickApprove = async (student) => {
    try {
      setProcessingId(student.userId);
      const res = await dashboardApi.approveStudent(student.userId, true);
      toast.success(res?.message || `Đã duyệt tài khoản ${student.fullName}!`);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Không thể duyệt tài khoản');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <PageLoader />;

  const pendingCount = stats?.pendingStudentsCount || 0;
  const approvedCount = stats?.approvedStudentsCount || 0;

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
            Theo dõi tổng quan học viên, phê duyệt tài khoản mới, khóa học Bino và đề thi TOEIC
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/students')}
            className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <UserCheck size={16} /> Duyệt Học Viên ({pendingCount} chờ)
          </button>
          <button
            onClick={() => navigate('/admin/tests')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus size={16} /> Quản Lý Đề Thi
          </button>
        </div>
      </div>

      {/* Pending Approval Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                Có {pendingCount} tài khoản học viên mới đang chờ Admin phê duyệt
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                Tài khoản đăng ký mới chỉ có thể đăng nhập sau khi được bạn phê duyệt.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/students')}
            className="px-4 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            Mở trang duyệt tài khoản <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Học Viên</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalStudents || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-600 font-bold">{approvedCount} đã duyệt</span> ·{' '}
              <span className="text-amber-600 font-bold">{pendingCount} chờ duyệt</span>
            </p>
          </div>
        </div>

        {/* Bino Course Stats */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chém Tiếng Anh Bino</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Headphones size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalBinoDialogues || 72} bài
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.totalBinoCompletedLessons || 0} lượt hoàn thành bài hội thoại
            </p>
          </div>
        </div>

        {/* Total Tests */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kho Đề Thi TOEIC</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalTests || 0} đề
            </h3>
            <p className="text-xs text-slate-500 mt-1">{stats?.totalQuestions || 0} câu hỏi trong hệ thống</p>
          </div>
        </div>

        {/* Total Interactions */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tương Tác Học Tập</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalStudyInteractions || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tổng bài Bino & câu TOEIC đã luyện</p>
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
                <UserCheck size={20} className="text-[#0071e3]" /> Học Viên Mới Đăng Ký
              </h3>
              <p className="text-xs text-slate-400">
                Duyệt nhanh tài khoản mới và xem tiến độ học Bino / TOEIC
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/students')}
              className="text-xs font-bold text-[#0071e3] hover:underline dark:text-blue-400 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Học viên</th>
                  <th className="py-3 px-2 text-center">Trạng thái</th>
                  <th className="py-3 px-2 text-center">Bino</th>
                  <th className="py-3 px-2 text-center">TOEIC</th>
                  <th className="py-3 px-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {stats?.recentStudents?.map((s) => (
                  <tr key={s.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0 ${
                            s.isApproved ? 'bg-[#0071e3]' : 'bg-amber-500'
                          }`}
                        >
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {s.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {s.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCircle2 size={11} /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          <Clock size={11} /> Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-[#0071e3] dark:text-blue-400">
                      {s.binoCompletedLessons ?? 0}/72 bài
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                      {s.testsEnrolled} đề · {s.confidentQuestions} câu
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {!s.isApproved ? (
                        <button
                          onClick={() => handleQuickApprove(s)}
                          disabled={processingId === s.userId}
                          className="px-3 py-1 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold transition-all disabled:opacity-50"
                        >
                          {processingId === s.userId ? 'Đang duyệt...' : '✓ Duyệt ngay'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đã kích hoạt</span>
                      )}
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
            <ShieldCheck size={18} className="text-[#0071e3]" /> Tác Vụ Quản Trị Nhanh
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/students')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-[#0071e3] dark:hover:border-blue-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#0071e3] transition-colors">
                    Duyệt & Quản Lý Học Viên
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Phê duyệt tài khoản đăng ký & theo dõi tiến độ
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/bino')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-[#0071e3] dark:hover:border-blue-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0071e3] flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#0071e3] transition-colors">
                    Quản Lý Khóa Học Bino
                  </h4>
                  <p className="text-[11px] text-slate-400">12 chương, 72 bài hội thoại & audio</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/tests')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-[#0071e3] dark:hover:border-blue-500 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#0071e3] transition-colors">
                    Quản Lý Đề Thi TOEIC
                  </h4>
                  <p className="text-[11px] text-slate-400">Import JSON đề mới, xóa, sửa</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
