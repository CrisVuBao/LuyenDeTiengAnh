import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  BookmarkCheck,
  UserPlus,
  Edit3,
  Key,
  Gift,
  Flame,
  Sparkles,
  Download,
  Eye,
  ShieldAlert,
  Check,
  X,
  ChevronRight,
  Star,
  Zap,
  TrendingUp,
  Layers,
  Lock,
  Unlock,
  Copy,
  SlidersHorizontal
} from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import toast from 'react-hot-toast';

// Chuyển đổi và định dạng thời gian chuẩn xác 100% theo giờ Việt Nam (GMT+7 - Asia/Ho_Chi_Minh)
export function formatVietnamDateTime(dateInput) {
  if (!dateInput) return null;
  try {
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      let dateStr = String(dateInput).trim();
      // Nếu là chuỗi ISO datetime có phần thời gian nhưng chưa có chỉ định múi giờ,
      // ta gắn thêm 'Z' vì SQL Server / EF Core lưu UTC nhưng serializer có thể thiếu 'Z'
      if (
        (dateStr.includes('T') || dateStr.includes(' ')) &&
        !dateStr.endsWith('Z') &&
        !dateStr.includes('+') &&
        !dateStr.slice(10).includes('-')
      ) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      }
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return null;

    // Nếu mốc thời gian bị lệch vượt quá hiện tại hơn 5 phút (do cộng lặp múi giờ +7h trước đó), tự động chuẩn hóa lại đúng giờ thực
    if (date.getTime() > Date.now() + 5 * 60 * 1000) {
      date = new Date(date.getTime() - 7 * 3600 * 1000);
    }

    // Ngày: DD/MM/YYYY
    const datePart = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);

    // Giờ đầy đủ: HH:mm:ss
    const timePart = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);

    // Giờ ngắn: HH:mm
    const timeShort = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);

    // Tính thời gian tương đối
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let relativeText = '';
    let isRecent = false;

    if (diffSec < 60) {
      // Bao gồm cả trường hợp chênh lệch nhỏ vài giây giữa server và client
      relativeText = 'Vừa truy cập';
      isRecent = true;
    } else if (diffMin < 60) {
      relativeText = `${diffMin} phút trước`;
      if (diffMin <= 10) isRecent = true;
    } else if (diffHour < 24) {
      relativeText = `${diffHour} giờ trước`;
    } else if (diffDay === 1) {
      relativeText = 'Hôm qua';
    } else if (diffDay < 7) {
      relativeText = `${diffDay} ngày trước`;
    } else {
      relativeText = datePart;
    }

    return {
      datePart,
      timePart,
      timeShort,
      relativeText,
      isRecent,
      fullText: `${timePart} ngày ${datePart} (Giờ VN)`
    };
  } catch {
    return null;
  }
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'admin' | 'locked'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'xp' | 'streak' | 'bino' | 'vocab'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalStudent, setEditModalStudent] = useState(null);
  const [resetPassStudent, setResetPassStudent] = useState(null);
  const [rewardStudent, setRewardStudent] = useState(null);
  const [dossierStudent, setDossierStudent] = useState(null);
  const [dossierDetail, setDossierDetail] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierTab, setDossierTab] = useState('overview'); // 'overview' | 'pillars' | 'security' | 'reward'

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'Student',
    isApproved: true
  });
  const [creating, setCreating] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Student',
    isApproved: true,
    isLocked: false
  });
  const [updating, setUpdating] = useState(false);

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const [rewardForm, setRewardForm] = useState({
    bonusXp: 100,
    reason: 'Thưởng học tập xuất sắc từ Admin',
    restoreStreakDays: ''
  });
  const [adjustingReward, setAdjustingReward] = useState(false);

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

  // Khóa cuộn trang nền khi bất kỳ popup nào đang mở
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      dossierStudent || createModalOpen || editModalStudent || resetPassStudent || rewardStudent
    );
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [dossierStudent, createModalOpen, editModalStudent, resetPassStudent, rewardStudent]);

  // Quick Approval Toggle
  const handleApproveToggle = async (student, isApproved) => {
    try {
      setProcessingId(student.userId);
      const res = await dashboardApi.approveStudent(student.userId, isApproved);
      toast.success(
        res?.message ||
          (isApproved
            ? `Đã phê duyệt tài khoản ${student.fullName}`
            : `Đã thu hồi phê duyệt đối với ${student.fullName}`)
      );
      setStudents((prev) =>
        prev.map((s) =>
          s.userId === student.userId
            ? { ...s, isApproved, approvedAt: isApproved ? new Date().toISOString() : null }
            : s
        )
      );
      if (dossierStudent?.userId === student.userId) {
        setDossierStudent((prev) => (prev ? { ...prev, isApproved } : null));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setProcessingId(null);
    }
  };

  // Approve All Pending
  const handleApproveAllPending = async () => {
    const pendingCount = students.filter((s) => !s.isApproved).length;
    if (pendingCount === 0) return;

    try {
      setApprovingAll(true);
      const res = await dashboardApi.approveAllPendingStudents();
      toast.success(res?.message || `Đã phê duyệt tất cả ${pendingCount} tài khoản!`);
      fetchStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi phê duyệt hàng loạt');
    } finally {
      setApprovingAll(false);
    }
  };

  // Delete User
  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `XÁC NHẬN XÓA TÀI KHOẢN:\n\nBạn có chắc chắn muốn xóa tài khoản "${student.fullName}" (${student.email})?\nToàn bộ dữ liệu điểm và tiến độ học sẽ bị xóa vĩnh viễn!`
    );
    if (!confirmed) return;

    try {
      setProcessingId(student.userId);
      const res = await dashboardApi.deleteStudent(student.userId);
      toast.success(res?.message || `Đã xóa tài khoản ${student.fullName}`);
      setStudents((prev) => prev.filter((s) => s.userId !== student.userId));
      if (dossierStudent?.userId === student.userId) {
        setDossierStudent(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể xóa tài khoản');
    } finally {
      setProcessingId(null);
    }
  };

  // Open 360 Dossier Modal
  const handleOpenDossier = (student) => {
    setDossierStudent(student);
    setDossierTab('overview');
    setLoadingDossier(true);
    dashboardApi
      .getStudentDetail(student.userId)
      .then((res) => {
        if (res?.data) {
          setDossierDetail(res.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải hồ sơ học viên:', err);
        toast.error('Không thể tải chi tiết hồ sơ');
      })
      .finally(() => setLoadingDossier(false));
  };

  // Create Student Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.');
      return;
    }
    if (createForm.password.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    try {
      setCreating(true);
      const res = await dashboardApi.createStudent(createForm);
      toast.success(res?.message || 'Đã tạo tài khoản thành công!');
      setCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'Student',
        isApproved: true
      });
      fetchStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể tạo tài khoản');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setEditModalStudent(student);
    setEditForm({
      fullName: student.fullName || '',
      email: student.email || '',
      phoneNumber: student.phoneNumber || '',
      role: student.role || 'Student',
      isApproved: student.isApproved ?? true,
      isLocked: student.isLocked ?? false
    });
  };

  // Edit Submit Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên và Email.');
      return;
    }

    try {
      setUpdating(true);
      const res = await dashboardApi.updateStudent(editModalStudent.userId, editForm);
      toast.success(res?.message || 'Đã cập nhật thông tin thành công!');
      setEditModalStudent(null);
      fetchStudents();
      if (dossierStudent?.userId === editModalStudent.userId) {
        handleOpenDossier({ ...editModalStudent, ...editForm });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể cập nhật tài khoản');
    } finally {
      setUpdating(false);
    }
  };

  // Reset Password Handler
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }

    try {
      setResettingPassword(true);
      const res = await dashboardApi.resetPassword(resetPassStudent.userId, newPasswordInput);
      toast.success(res?.message || `Đã đặt lại mật khẩu cho ${resetPassStudent.fullName}!`);
      setResetPassStudent(null);
      setNewPasswordInput('');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setResettingPassword(false);
    }
  };

  // Gamification Adjust Submit Handler
  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    const bonus = parseInt(rewardForm.bonusXp) || 0;
    const streak = rewardForm.restoreStreakDays ? parseInt(rewardForm.restoreStreakDays) : null;

    if (bonus <= 0 && (!streak || streak <= 0)) {
      toast.error('Vui lòng nhập số điểm XP thưởng hoặc số ngày Streak khôi phục.');
      return;
    }

    try {
      setAdjustingReward(true);
      const res = await dashboardApi.adjustGamification(rewardStudent.userId, {
        bonusXp: bonus,
        reason: rewardForm.reason || 'Thưởng từ Quản trị viên',
        restoreStreakDays: streak
      });
      toast.success(res?.message || `Đã điều chỉnh thành tích cho ${rewardStudent.fullName}!`);
      setRewardStudent(null);
      setRewardForm({ bonusXp: 100, reason: 'Thưởng học tập xuất sắc từ Admin', restoreStreakDays: '' });
      fetchStudents();
      if (dossierStudent?.userId === rewardStudent.userId) {
        handleOpenDossier(rewardStudent);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi điều chỉnh thành tích');
    } finally {
      setAdjustingReward(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!students.length) {
      toast.error('Không có dữ liệu để xuất file.');
      return;
    }

    const headers = [
      'User ID',
      'Họ Và Tên',
      'Email',
      'Số Điện Thoại',
      'Vai Trò',
      'Trạng Thái Duyệt',
      'Khóa Tài Khoản',
      'Cấp Độ',
      'Tổng XP',
      'Chuỗi Ngày (Streak)',
      '3000 Từ Vựng Đã Thuộc',
      'Giao Tiếp Thực Chiến Hoàn Thành',
      'Giao Tiếp Thực Chiến Tỷ Lệ %',
      'Giao Tiếp Thực Chiến Thẻ Lưu',
      'Giao Tiếp Thực Chiến Thời Gian Học (Phút)',
      'TOEIC Số Đề Tham Gia',
      'TOEIC Số Câu Ghi Nhớ',
      'TOEIC Tỷ Lệ Nhớ %',
      'Ngày Tạo',
      'Đăng Nhập Gần Nhất'
    ];

    const rows = filteredStudents.map((s) => [
      s.userId,
      `"${(s.fullName || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.phoneNumber || '').replace(/"/g, '""')}"`,
      s.role || 'Student',
      s.isApproved ? 'Đã duyệt' : 'Chờ duyệt',
      s.isLocked ? 'Bị khóa' : 'Hoạt động',
      s.level ?? 1,
      s.totalXp ?? 0,
      s.streakDays ?? 0,
      s.vocabMasteredWords ?? 0,
      s.binoCompletedLessons ?? 0,
      s.binoProgressPercent ?? 0,
      s.binoSavedFlashcards ?? 0,
      s.binoTimeSpentMinutes ?? 0,
      s.testsEnrolled ?? 0,
      s.confidentQuestions ?? 0,
      s.masteryRate ?? 0,
      s.createdAt ? (formatVietnamDateTime(s.createdAt)?.fullText || '') : '',
      s.lastLoginAt ? (formatVietnamDateTime(s.lastLoginAt)?.fullText || '') : 'Chưa đăng nhập'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `VBaceEnglish_HocVien_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã xuất danh sách học viên dạng file CSV Excel thành công!');
  };

  // Metrics computation
  const totalCount = students.length;
  const pendingCount = students.filter((s) => !s.isApproved).length;
  const approvedCount = students.filter((s) => s.isApproved).length;
  const adminCount = students.filter((s) => s.role === 'Admin').length;
  const lockedCount = students.filter((s) => s.isLocked).length;
  const totalXpSum = students.reduce((acc, s) => acc + (s.totalXp || 0), 0);
  const totalMasteredVocab = students.reduce((acc, s) => acc + (s.vocabMasteredWords || 0), 0);

  // Filtering & Sorting
  const filteredStudents = students
    .filter((s) => {
      const matchQuery =
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phoneNumber && s.phoneNumber.includes(searchTerm));

      if (!matchQuery) return false;

      if (statusFilter === 'pending') return !s.isApproved;
      if (statusFilter === 'approved') return s.isApproved && !s.isLocked;
      if (statusFilter === 'admin') return s.role === 'Admin';
      if (statusFilter === 'locked') return s.isLocked;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'xp') return (b.totalXp || 0) - (a.totalXp || 0);
      if (sortBy === 'streak') return (b.streakDays || 0) - (a.streakDays || 0);
      if (sortBy === 'bino') return (b.binoCompletedLessons || 0) - (a.binoCompletedLessons || 0);
      if (sortBy === 'vocab') return (b.vocabMasteredWords || 0) - (a.vocabMasteredWords || 0);
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      return 0;
    });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ===== HERO VIP COMMAND HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-2xl border border-blue-500/20">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
                <Sparkles size={13} className="text-slate-950" />
                VIP Admin Console
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-300 backdrop-blur-md border border-white/10">
                Toàn Diện 360°
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Quản Trị Người Dùng & Học Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-2xl leading-relaxed">
              Hệ thống quản lý tài khoản người dùng cao cấp: Phê duyệt tức thì, hồ sơ học tập 360°, theo dõi 4 trụ cột kiến thức (TOEIC, Giao Tiếp Thực Chiến, 3000 Từ vựng, 50 Phản xạ) và điều phối Gamification XP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Thêm Học Viên Mới
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 flex items-center gap-1.5 transition-all"
              title="Xuất bảng dữ liệu ra file CSV Excel"
            >
              <Download size={15} />
              Xuất CSV
            </button>

            {pendingCount > 0 && (
              <button
                onClick={handleApproveAllPending}
                disabled={approvingAll}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                {approvingAll ? 'Đang duyệt...' : `Duyệt Tất Cả (${pendingCount})`}
              </button>
            )}

            <button
              onClick={fetchStudents}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all"
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== 4 VIP STAT METRIC CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tổng người dùng */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Tài Khoản
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-500">người dùng</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{adminCount} Admin VIP</span>
            <span>•</span>
            <span>{totalCount - adminCount} Học viên</span>
          </div>
        </div>

        {/* Card 2: Đang hoạt động / Đã duyệt */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đang Hoạt Động
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
            <span className="text-[11px] font-semibold text-slate-500">
              ({totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {lockedCount > 0 ? (
              <span className="text-red-500 font-bold">{lockedCount} tài khoản đang bị khóa</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% tài khoản an toàn</span>
            )}
          </div>
        </div>

        {/* Card 3: Chờ duyệt */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chờ Phê Duyệt
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                pendingCount > 0
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                pendingCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {pendingCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">yêu cầu</span>
          </div>
          <div className="mt-2 text-[11px]">
            {pendingCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">Cần admin phê duyệt ngay</span>
            ) : (
              <span className="text-slate-400">Không có tài khoản chờ</span>
            )}
          </div>
        </div>

        {/* Card 4: Tổng tương tác & Gamification XP */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Điểm XP Toàn Hệ Thống
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {totalXpSum.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">XP</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {totalMasteredVocab.toLocaleString('vi-VN')}
            </span>
            <span>từ vựng đã thuộc</span>
          </div>
        </div>
      </div>

      {/* ===== ACTION TOOLBAR: FILTERS + SEARCH + SORT ===== */}
      <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={13} />
            Chờ duyệt
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={13} />
            Đã duyệt ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'admin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck size={13} />
            Admin ({adminCount})
          </button>

          {lockedCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('locked')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'locked'
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock size={13} />
              Đã khóa ({lockedCount})
            </button>
          )}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl">
            <SlidersHorizontal size={14} className="text-slate-400 ml-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 pr-3 py-1 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="dark:bg-slate-900">Mới nhất</option>
              <option value="oldest" className="dark:bg-slate-900">Cũ nhất</option>
              <option value="xp" className="dark:bg-slate-900">Điểm XP cao nhất</option>
              <option value="streak" className="dark:bg-slate-900">Streak cao nhất</option>
              <option value="bino" className="dark:bg-slate-900">Tiến độ Giao Tiếp Thực Chiến cao nhất</option>
              <option value="vocab" className="dark:bg-slate-900">3000 Từ vựng nhiều nhất</option>
              <option value="name" className="dark:bg-slate-900">Tên A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== STUDENTS MAIN TABLE ===== */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {loading ? (
          <div className="py-20">
            <PageLoader />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black text-[11px] tracking-wider">
                  <th className="py-4 px-5">Học Viên & Thông Tin</th>
                  <th className="py-4 px-3 text-center">Vai Trò / Trạng Thái</th>
                  <th className="py-4 px-3 text-center">Cấp Độ & XP</th>
                  <th className="py-4 px-3 text-center">Giao Tiếp Thực Chiến</th>
                  <th className="py-4 px-3 text-center">Từ Vựng & TOEIC</th>
                  <th className="py-4 px-4 text-center">Lần Cuối Truy Cập</th>
                  <th className="py-4 px-5 text-right">Thao Tác Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredStudents.map((student) => {
                  const isBusy = processingId === student.userId;
                  const binoLessons = student.binoCompletedLessons ?? 0;
                  const binoPct = student.binoProgressPercent ?? 0;
                  const binoCards = student.binoSavedFlashcards ?? 0;
                  const vocabWords = student.vocabMasteredWords ?? 0;
                  const isUserAdmin = student.role === 'Admin';

                  return (
                    <tr
                      key={student.userId}
                      className={`transition-colors ${
                        !student.isApproved
                          ? 'bg-amber-50/40 dark:bg-amber-950/15 hover:bg-amber-50/70 dark:hover:bg-amber-950/25'
                          : student.isLocked
                          ? 'bg-red-50/40 dark:bg-red-950/15 hover:bg-red-50/60 dark:hover:bg-red-950/25'
                          : isUserAdmin
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/15 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/25'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* 1. Student Avatar + Name + Contact */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          {/* Avatar with status indicator ring */}
                          <div className="relative">
                            <div
                              className={`w-11 h-11 rounded-2xl text-white font-black flex items-center justify-center text-sm shadow-md transition-transform group-hover:scale-105 ${
                                isUserAdmin
                                  ? 'bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 ring-2 ring-amber-400'
                                  : student.isLocked
                                  ? 'bg-red-500 ring-2 ring-red-400'
                                  : student.isApproved
                                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                                  : 'bg-amber-500 ring-2 ring-amber-400 animate-pulse'
                              }`}
                            >
                              {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>

                            {/* Mini Status Dot */}
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white ${
                                student.isLocked
                                  ? 'bg-red-500'
                                  : student.isApproved
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                            >
                              {student.isLocked ? '✕' : student.isApproved ? '✓' : '!'}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {student.fullName}
                              </h4>
                              {isUserAdmin && (
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                                  VIP Admin
                                </span>
                              )}
                              {student.isLocked && (
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  Đã khóa
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Mail size={11} className="text-slate-400" /> {student.email}
                              </span>
                              {student.phoneNumber && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" /> {student.phoneNumber}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Tham gia: {formatVietnamDateTime(student.createdAt)?.datePart || ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role / Approval Status */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          {student.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <Lock size={12} /> Bị khóa
                            </span>
                          ) : student.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              <CheckCircle2 size={12} /> Đã duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 animate-pulse">
                              <Clock size={12} /> Chờ duyệt
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-semibold">
                            {isUserAdmin ? 'Toàn quyền Admin' : 'Học viên tiêu chuẩn'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Level & XP & Streak */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                              Cấp {student.level ?? 1}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <Flame size={13} className="fill-amber-500 text-amber-500" />
                              {student.streakDays ?? 0}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {(student.totalXp ?? 0).toLocaleString('vi-VN')} XP
                          </span>
                        </div>
                      </td>

                      {/* 4. Bino 72 Progress */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300">
                            {binoLessons}/72 bài ({binoPct}%)
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-0.5">
                              <BookmarkCheck size={11} className="text-emerald-500" /> {binoCards} thẻ SRS
                            </span>
                            <span>·</span>
                            <span>{student.binoTimeSpentMinutes ?? 0}m học</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Vocab 3000 & TOEIC */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            📚 {vocabWords} từ thuộc
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            TOEIC: {student.testsEnrolled ?? 0} đề ({student.masteryRate ?? 0}%)
                          </span>
                        </div>
                      </td>

                      {/* 6. Last Login / Access Time (Chuẩn giờ Việt Nam GMT+7) */}
                      <td className="py-4 px-4 text-center">
                        {(() => {
                          const vn = formatVietnamDateTime(student.lastLoginAt);
                          if (!vn) {
                            return <span className="text-slate-400 italic text-xs">Chưa đăng nhập</span>;
                          }
                          return (
                            <div className="inline-flex flex-col items-center gap-1" title={vn.fullText}>
                              <div className="flex items-center gap-1.5">
                                {vn.isRecent ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 animate-pulse shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    {vn.relativeText}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {vn.relativeText}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock size={10} className="text-slate-400" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{vn.timeShort}</span>
                                <span>•</span>
                                <span>{vn.datePart}</span>
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 7. Action Cluster */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Hồ sơ 360 */}
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(student)}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                            title="Xem Hồ Sơ 360° Toàn Diện"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Phê duyệt nhanh */}
                          {!student.isApproved ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApproveToggle(student, true)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                              title="Duyệt tài khoản ngay"
                            >
                              <UserCheck size={14} />
                              <span className="hidden sm:inline">Duyệt</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApproveToggle(student, false)}
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50"
                              title="Thu hồi quyền duyệt (chuyển về chờ)"
                            >
                              <UserX size={15} />
                            </button>
                          )}

                          {/* Thưởng XP / Khôi phục Streak */}
                          <button
                            type="button"
                            onClick={() => {
                              setRewardStudent(student);
                              setRewardForm({
                                bonusXp: 100,
                                reason: 'Thưởng học tập xuất sắc từ Admin',
                                restoreStreakDays: ''
                              });
                            }}
                            className="p-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                            title="Thưởng điểm XP hoặc khôi phục Streak"
                          >
                            <Gift size={15} />
                          </button>

                          {/* Đặt lại mật khẩu */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPassStudent(student);
                              setNewPasswordInput('Vbace@2026');
                            }}
                            className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            title="Đặt lại mật khẩu mới"
                          >
                            <Key size={15} />
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            disabled={isBusy || isUserAdmin}
                            onClick={() => handleDeleteStudent(student)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isUserAdmin ? 'Không thể xóa Admin' : 'Xóa tài khoản'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={32} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">Không tìm thấy tài khoản người dùng nào phù hợp.</p>
                        <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc chuyển tab bộ lọc.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ===== PORTAL RENDERED POPUPS (FULL VIEWPORT COVERAGE, NO BOUNDARY BUG) ===== */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {/* MODAL 1: HỒ SƠ TOÀN DIỆN 360° */}
            {dossierStudent && (
              <motion.div
                key="modal-dossier"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setDossierStudent(null);
                }}
                className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-auto"
                >
                  {/* Header Hero Banner */}
                  <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-t-3xl overflow-hidden">
                    <button
                      onClick={() => setDossierStudent(null)}
                      className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-xl">
                        {dossierStudent.fullName ? dossierStudent.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black">{dossierStudent.fullName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-400 text-slate-950">
                            {dossierDetail?.role || dossierStudent.role || 'Student'}
                          </span>
                          {dossierStudent.isApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1">
                              <CheckCircle2 size={12} /> Đã phê duyệt
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1 animate-pulse">
                              <Clock size={12} /> Chờ phê duyệt
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                          <span className="inline-flex items-center gap-1">
                            <Mail size={12} /> {dossierStudent.email}
                          </span>
                          {dossierStudent.phoneNumber && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} /> {dossierStudent.phoneNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">
                            ID: #{dossierStudent.userId}
                          </span>
                          {(() => {
                            const lastVn = formatVietnamDateTime(dossierStudent.lastLoginAt);
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                                  lastVn?.isRecent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                                    : 'bg-white/10 text-slate-200 border border-white/15'
                                }`}
                                title={lastVn?.fullText || 'Chưa có hoạt động'}
                              >
                                {lastVn?.isRecent ? (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                ) : (
                                  <Clock size={12} className="text-slate-400" />
                                )}
                                <span>Truy cập: </span>
                                <span className="font-bold text-white">
                                  {lastVn ? `${lastVn.relativeText} (${lastVn.timeShort} • ${lastVn.datePart})` : 'Chưa đăng nhập'}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Dossier Tabs */}
                    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
                      <button
                        onClick={() => setDossierTab('overview')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          dossierTab === 'overview'
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        🏆 Tổng Quan & Cấp Độ
                      </button>
                      <button
                        onClick={() => setDossierTab('pillars')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          dossierTab === 'pillars'
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        📚 4 Trụ Cột Học Tập
                      </button>
                      <button
                        onClick={() => setDossierTab('security')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          dossierTab === 'security'
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        🛡️ Quyền & Bảo Mật
                      </button>
                    </div>
                  </div>

                  {/* Dossier Content Body */}
                  <div className="p-6 sm:p-8">
                    {loadingDossier ? (
                      <div className="py-16">
                        <PageLoader />
                      </div>
                    ) : (
                      <>
                        {/* TAB 1: OVERVIEW & GAMIFICATION */}
                        {dossierTab === 'overview' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                                  Cấp Độ
                                </span>
                                <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                                  Cấp {dossierDetail?.level ?? 1}
                                </div>
                                <span className="text-xs font-semibold text-purple-600/80">
                                  {dossierDetail?.levelTitle || 'Tân binh'}
                                </span>
                              </div>

                              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                  Tổng XP
                                </span>
                                <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                                  {(dossierDetail?.totalXp ?? 0).toLocaleString('vi-VN')}
                                </div>
                                <span className="text-xs font-semibold text-blue-600/80">điểm kinh nghiệm</span>
                              </div>

                              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                  Chuỗi Streak
                                </span>
                                <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                                  <Flame size={20} className="fill-amber-500 text-amber-500" />
                                  {dossierDetail?.currentStreak ?? 0}
                                </div>
                                <span className="text-xs font-semibold text-amber-600/80">
                                  Kỷ lục: {dossierDetail?.longestStreak ?? 0} ngày
                                </span>
                              </div>

                              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                  Chuyên Cần
                                </span>
                                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                                  {dossierDetail?.totalDaysStudied ?? 0}
                                </div>
                                <span className="text-xs font-semibold text-emerald-600/80">ngày hoàn thành</span>
                              </div>
                            </div>

                            {/* Unlocked Badges */}
                            <div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Award size={16} className="text-amber-500" />
                                Huy Hiệu Đã Mở Khóa ({dossierDetail?.badges?.length || 0})
                              </h4>
                              {dossierDetail?.badges?.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5">
                                  {dossierDetail.badges.map((badge, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs"
                                    >
                                      <Sparkles size={14} className="text-amber-500" />
                                      <span>{badge}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Học viên chưa mở khóa huy hiệu nào.</p>
                              )}
                            </div>

                            {/* Account & Activity Timestamps */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">📅 Ngày tham gia:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                                  {formatVietnamDateTime(dossierStudent.createdAt)?.fullText || 'Không rõ'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">⏱️ Lần cuối truy cập / học:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                                  {formatVietnamDateTime(dossierStudent.lastLoginAt)?.fullText || 'Chưa đăng nhập'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold mb-0.5">✅ Phê duyệt tài khoản:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {dossierStudent.isApproved
                                    ? `Đã duyệt ${dossierStudent.approvedAt ? `• ${formatVietnamDateTime(dossierStudent.approvedAt)?.datePart}` : ''}`
                                    : 'Chờ phê duyệt'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: 4 PILLARS OF LEARNING */}
                        {dossierTab === 'pillars' && (
                          <div className="space-y-6">
                            {/* 1. TOEIC Pillar */}
                            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                                    📘
                                  </div>
                                  <h4 className="font-extrabold text-sm">Trụ Cột 1: Luyện Đề TOEIC</h4>
                                </div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                  {dossierDetail?.toeicTestsCount ?? 0} đề đã làm
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-center my-3">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Số câu hoàn thành</span>
                                  <div className="text-lg font-black mt-0.5">{dossierDetail?.toeicCompletedQuestions ?? 0}</div>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Số câu tự tin</span>
                                  <div className="text-lg font-black text-emerald-600 mt-0.5">{dossierDetail?.toeicConfidentQuestions ?? 0}</div>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Tỷ lệ nhớ</span>
                                  <div className="text-lg font-black text-blue-600 mt-0.5">{dossierDetail?.toeicMasteryRate ?? 0}%</div>
                                </div>
                              </div>

                              {dossierDetail?.toeicSummaries?.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <span className="text-[11px] font-bold text-slate-500 uppercase">Danh sách đề thi:</span>
                                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                    {dossierDetail.toeicSummaries.map((ts, idx) => (
                                      <div
                                        key={idx}
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{ts.title}</span>
                                          {ts.lastAccessedAt && (
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                              <Clock size={10} />
                                              Lần cuối: {formatVietnamDateTime(ts.lastAccessedAt)?.fullText || ''}
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-mono text-emerald-600 font-extrabold shrink-0">{ts.percentCompleted}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. Giao Tiếp Thực Chiến Pillar */}
                            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                                    🎧
                                  </div>
                                  <h4 className="font-extrabold text-sm">Trụ Cột 2: Giao Tiếp Thực Chiến</h4>
                                </div>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {dossierDetail?.binoCompletedLessons ?? 0}/72 bài ({dossierDetail?.binoProgressPercent ?? 0}%)
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Bài hoàn thành</span>
                                  <div className="text-lg font-black text-indigo-600 mt-0.5">{dossierDetail?.binoCompletedLessons ?? 0} / 72</div>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Thẻ Flashcard SRS</span>
                                  <div className="text-lg font-black text-emerald-600 mt-0.5">{dossierDetail?.binoSavedFlashcards ?? 0} từ</div>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">Thời gian học</span>
                                  <div className="text-lg font-black text-blue-600 mt-0.5">{dossierDetail?.binoTimeSpentMinutes ?? 0} phút</div>
                                </div>
                              </div>
                            </div>

                            {/* 3. 3000 Vocab & 4. Reflex Pillars */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2.5 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                                    📚
                                  </div>
                                  <h4 className="font-extrabold text-sm">Trụ Cột 3: 3000 Từ Vựng</h4>
                                </div>
                                <div className="mt-3 space-y-1 text-xs">
                                  <p className="flex justify-between">
                                    <span className="text-slate-500">Từ đã thuộc:</span>
                                    <span className="font-black text-emerald-600">{dossierDetail?.vocabMasteredWords ?? 0} từ</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-500">Từ đánh dấu sao:</span>
                                    <span className="font-bold text-amber-500">{dossierDetail?.vocabStarredWords ?? 0} từ</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-500">Chủ đề gần nhất:</span>
                                    <span className="font-bold">Chủ đề {dossierDetail?.vocabLastStudiedTopic ?? 1}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2.5 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                                    ⚡
                                  </div>
                                  <h4 className="font-extrabold text-sm">Trụ Cột 4: 50 Phản Xạ</h4>
                                </div>
                                <div className="mt-3 space-y-1 text-xs">
                                  <p className="flex justify-between">
                                    <span className="text-slate-500">Bài đã hoàn thành:</span>
                                    <span className="font-black text-rose-600">{dossierDetail?.reflexUnitsDone ?? 0} / 50 bài</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span className="text-slate-500">Trạng thái:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                      {dossierDetail?.reflexUnitsDone > 0 ? 'Đang luyện tập' : 'Chưa bắt đầu'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: SECURITY & ADMIN ACTIONS */}
                        {dossierTab === 'security' && (
                          <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Quản Trị Quyền Hạn & Tài Khoản
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <button
                                  onClick={() => {
                                    setResetPassStudent(dossierStudent);
                                    setNewPasswordInput('Vbace@2026');
                                  }}
                                  className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                  <Key size={15} />
                                  Đặt Lại Mật Khẩu
                                </button>

                                <button
                                  onClick={() => handleOpenEdit(dossierStudent)}
                                  className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                  <Edit3 size={15} />
                                  Chỉnh Sửa Thông Tin
                                </button>

                                <button
                                  onClick={() => handleApproveToggle(dossierStudent, !dossierStudent.isApproved)}
                                  className={`p-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all text-white ${
                                    dossierStudent.isApproved ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                                  }`}
                                >
                                  {dossierStudent.isApproved ? <UserX size={15} /> : <UserCheck size={15} />}
                                  {dossierStudent.isApproved ? 'Thu Hồi Quyền Duyệt' : 'Phê Duyệt Tài Khoản'}
                                </button>

                                <button
                                  onClick={() => {
                                    setRewardStudent(dossierStudent);
                                    setRewardForm({
                                      bonusXp: 100,
                                      reason: 'Thưởng học tập xuất sắc từ Admin',
                                      restoreStreakDays: ''
                                    });
                                  }}
                                  className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                  <Gift size={15} />
                                  Thưởng Điểm / Cứu Streak
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* MODAL 2: THÊM NGƯỜI DÙNG MỚI */}
            {createModalOpen && (
              <motion.div
                key="modal-create"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setCreateModalOpen(false);
                }}
                className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-auto"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <UserPlus size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">Thêm Tài Khoản Mới</h3>
                        <p className="text-xs text-slate-500">Tạo tài khoản học viên hoặc phân quyền Quản trị viên</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubmit} className="space-y-4 mt-5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Họ Và Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Địa Chỉ Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="hocvien@gmail.com"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Số Điện Thoại
                      </label>
                      <input
                        type="tel"
                        value={createForm.phoneNumber}
                        onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                        placeholder="0912345678"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Mật Khẩu Ban Đầu <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, password: 'Vbace@' + Math.floor(100000 + Math.random() * 900000) })}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Tạo ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                          Vai Trò
                        </label>
                        <select
                          value={createForm.role}
                          onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Student">Học Viên</option>
                          <option value="Admin">Admin Quản Trị</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                          Trạng Thái Duyệt
                        </label>
                        <select
                          value={createForm.isApproved ? 'true' : 'false'}
                          onChange={(e) => setCreateForm({ ...createForm, isApproved: e.target.value === 'true' })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="true">Duyệt ngay</option>
                          <option value="false">Chờ phê duyệt</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCreateModalOpen(false)}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={creating}
                        className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 disabled:opacity-50"
                      >
                        {creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* MODAL 3: CHỈNH SỬA HỌC VIÊN */}
            {editModalStudent && (
              <motion.div
                key="modal-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setEditModalStudent(null);
                }}
                className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-auto"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Edit3 size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">Chỉnh Sửa Tài Khoản</h3>
                        <p className="text-xs text-slate-500">Cập nhật thông tin và quyền hạn của người dùng</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditModalStudent(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-4 mt-5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Họ Và Tên
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Địa Chỉ Email
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Số Điện Thoại
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                          Vai Trò
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Student">Học Viên</option>
                          <option value="Admin">Admin VIP</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                          Phê Duyệt
                        </label>
                        <select
                          value={editForm.isApproved ? 'true' : 'false'}
                          onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="true">Đã duyệt</option>
                          <option value="false">Chờ duyệt</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                          Khóa Tài Khoản
                        </label>
                        <select
                          value={editForm.isLocked ? 'true' : 'false'}
                          onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="false">Bình thường</option>
                          <option value="true">Khóa vĩnh viễn</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditModalStudent(null)}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={updating}
                        className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 disabled:opacity-50"
                      >
                        {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* MODAL 4: ĐẶT LẠI MẬT KHẨU */}
            {resetPassStudent && (
              <motion.div
                key="modal-reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setResetPassStudent(null);
                }}
                className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-auto"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Key size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">Đặt Lại Mật Khẩu</h3>
                        <p className="text-xs text-slate-500">Đặt lại mật khẩu truy cập mới cho tài khoản</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setResetPassStudent(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-3.5 my-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="text-slate-500">Tài khoản:</p>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                      {resetPassStudent.fullName}
                    </p>
                    <p className="font-mono text-slate-500">{resetPassStudent.email}</p>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Mật Khẩu Mới <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewPasswordInput('Vbace@' + Math.floor(100000 + Math.random() * 900000))}
                          className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                        >
                          Tạo ngẫu nhiên
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {newPasswordInput && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(newPasswordInput);
                              toast.success('Đã copy mật khẩu vào bộ nhớ tạm!');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Copy mật khẩu"
                          >
                            <Copy size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setResetPassStudent(null)}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={resettingPassword}
                        className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 disabled:opacity-50"
                      >
                        {resettingPassword ? 'Đang đặt lại...' : 'Cập Nhật Mật Khẩu'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* MODAL 5: THƯỞNG ĐIỂM & KHÔI PHỤC STREAK */}
            {rewardStudent && (
              <motion.div
                key="modal-reward"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setRewardStudent(null);
                }}
                className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-auto"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Gift size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">Thưởng Gamification VIP</h3>
                        <p className="text-xs text-slate-500">Cộng điểm XP danh dự hoặc khôi phục Streak ngày học</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRewardStudent(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-3.5 my-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 font-bold">{rewardStudent.fullName}</p>
                      <p className="text-slate-500 text-[11px]">Cấp {rewardStudent.level ?? 1} • {rewardStudent.totalXp ?? 0} XP</p>
                    </div>
                    <div className="flex items-center gap-1 font-black text-amber-600">
                      <Flame size={15} className="fill-amber-500 text-amber-500" />
                      {rewardStudent.streakDays ?? 0} ngày
                    </div>
                  </div>

                  <form onSubmit={handleRewardSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Số Điểm XP Thưởng
                      </label>
                      <div className="flex items-center gap-1.5 mb-2">
                        {[50, 100, 250, 500, 1000].map((xp) => (
                          <button
                            type="button"
                            key={xp}
                            onClick={() => setRewardForm({ ...rewardForm, bonusXp: xp })}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                              rewardForm.bonusXp === xp
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            +{xp}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={rewardForm.bonusXp}
                        onChange={(e) => setRewardForm({ ...rewardForm, bonusXp: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Lý Do Thưởng
                      </label>
                      <input
                        type="text"
                        value={rewardForm.reason}
                        onChange={(e) => setRewardForm({ ...rewardForm, reason: e.target.value })}
                        placeholder="Ví dụ: Đạt điểm cao trong tuần, Chăm chỉ học tập"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        Khôi Phục Chuỗi Streak (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={rewardForm.restoreStreakDays}
                        onChange={(e) => setRewardForm({ ...rewardForm, restoreStreakDays: e.target.value })}
                        placeholder="Để trống nếu không muốn đổi streak"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setRewardStudent(null)}
                        className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={adjustingReward}
                        className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 disabled:opacity-50"
                      >
                        {adjustingReward ? 'Đang trao thưởng...' : 'Xác Nhận Trao Thưởng'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
