import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  UserCheck,
  UserX,
  Trash2,
  ShieldCheck,
  Headphones,
  BookmarkCheck
} from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved'

  const fetchStudents = () => {
    setLoading(true);
    dashboardApi
      .getAdminStudents()
      .then((res) => {
        if (res?.data) setStudents(res.data);
      })
      .catch((err) => {
        console.error('Lỗi lấy danh sách học viên:', err);
        toast.error('Không thể tải danh sách học viên');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleApproveToggle = async (student, isApproved) => {
    try {
      setProcessingId(student.userId);
      const res = await dashboardApi.approveStudent(student.userId, isApproved);
      toast.success(
        res?.message ||
          (isApproved
            ? `Đã phê duyệt tài khoản ${student.fullName}`
            : `Đã chuyển tài khoản ${student.fullName} về trạng thái chờ duyệt`)
      );
      setStudents((prev) =>
        prev.map((s) =>
          s.userId === student.userId
            ? { ...s, isApproved, approvedAt: isApproved ? new Date().toISOString() : null }
            : s
        )
      );
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái duyệt');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingCount = students.filter((s) => !s.isApproved).length;
    if (pendingCount === 0) return;

    try {
      setApprovingAll(true);
      const res = await dashboardApi.approveAllPendingStudents();
      toast.success(res?.message || `Đã phê duyệt tất cả ${pendingCount} học viên!`);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Không thể phê duyệt hàng loạt');
    } finally {
      setApprovingAll(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tài khoản học viên "${student.fullName}" (${student.email})?`
    );
    if (!confirmed) return;

    try {
      setProcessingId(student.userId);
      const res = await dashboardApi.deleteStudent(student.userId);
      toast.success(res?.message || `Đã xóa tài khoản ${student.fullName}`);
      setStudents((prev) => prev.filter((s) => s.userId !== student.userId));
    } catch (err) {
      toast.error(err.message || 'Không thể xóa tài khoản học viên');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = students.filter((s) => !s.isApproved).length;
  const approvedCount = students.filter((s) => s.isApproved).length;

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phoneNumber && s.phoneNumber.includes(searchTerm));

    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return !s.isApproved;
    if (statusFilter === 'approved') return s.isApproved;
    return true;
  });

  return (
    <div className="space-y-7 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Quản Trị Học Viên & Duyệt Tài Khoản
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Duyệt Học Viên & Quản Lý Tiến Độ
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chỉ những tài khoản được Admin phê duyệt mới có thể đăng nhập học Chém Tiếng Anh Bino & Luyện đề TOEIC
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAllPending}
              disabled={approvingAll}
              className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck size={15} />
              {approvingAll ? 'Đang duyệt...' : `Duyệt tất cả (${pendingCount} chờ duyệt)`}
            </button>
          )}
          <button
            onClick={fetchStudents}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Pending Alert Callout if any */}
      {pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                Có {pendingCount} tài khoản học viên mới đang chờ phê duyệt
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                Học viên đã đăng ký nhưng chưa thể đăng nhập cho đến khi bạn bấm &ldquo;Duyệt tài khoản&rdquo;.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className="px-3.5 py-2 rounded-full bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold hover:bg-amber-100/60 transition-all"
            >
              Xem danh sách chờ ({pendingCount})
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={13} />
            Chờ phê duyệt
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                pendingCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={13} />
            Đã duyệt ({approvedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên, email hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* Students Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="py-12">
            <PageLoader />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3.5 px-5">Học Viên</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Tiến Độ Bino (72 Bài)</th>
                  <th className="py-3.5 px-4 text-center">Tiến Độ TOEIC</th>
                  <th className="py-3.5 px-4 text-center">Đăng Nhập Gần Nhất</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.map((student) => {
                  const isBusy = processingId === student.userId;
                  const binoLessons = student.binoCompletedLessons ?? 0;
                  const binoPct = student.binoCompletionPercentage ?? 0;
                  const binoCards = student.binoSavedFlashcards ?? 0;
                  const binoMins = student.binoTotalStudyMinutes ?? 0;

                  return (
                    <tr
                      key={student.userId}
                      className={`transition-colors ${
                        !student.isApproved
                          ? 'bg-amber-50/40 dark:bg-amber-950/15 hover:bg-amber-50/70 dark:hover:bg-amber-950/25'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Student Info + Contact */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0 ${
                              student.isApproved ? 'bg-[#0071e3]' : 'bg-amber-500'
                            }`}
                          >
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {student.fullName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" /> {student.email}
                              </span>
                              {student.phoneNumber && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" /> {student.phoneNumber}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Đăng ký: {new Date(student.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-4 px-4 text-center">
                        {student.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <CheckCircle2 size={12} /> Đã duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/60 animate-pulse">
                            <Clock size={12} /> Chờ duyệt
                          </span>
                        )}
                      </td>

                      {/* Bino Progress */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-blue-300">
                              {binoLessons}/72 bài ({binoPct}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-0.5">
                              <BookmarkCheck size={11} className="text-emerald-500" /> {binoCards} từ
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Headphones size={11} className="text-blue-500" /> {binoMins} phút
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TOEIC Progress */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {student.testsEnrolled} đề · {student.confidentQuestions} câu
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Award size={11} /> Ghi nhớ {student.masteryRate}%
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 text-center text-slate-400 text-xs">
                        {student.lastLoginAt
                          ? new Date(student.lastLoginAt).toLocaleString('vi-VN', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          : 'Chưa đăng nhập'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {!student.isApproved ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApproveToggle(student, true)}
                              className="px-3.5 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <UserCheck size={13} />
                              {isBusy ? 'Đang xử lý...' : 'Duyệt tài khoản'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApproveToggle(student, false)}
                              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/50 text-slate-600 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                              title="Chuyển về trạng thái chờ phê duyệt (tạm khóa đăng nhập)"
                            >
                              <UserX size={13} />
                              Khóa duyệt
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                            title="Xóa tài khoản học viên"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
