import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Sparkles,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Radio,
  Link2,
  Calendar,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi, dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import { formatVietnamDateTime } from '../../../utils/vietnamTime';

const QUICK_TEMPLATES = [
  {
    name: '🔥 Nhắc giữ chuỗi Streak',
    title: '🔥 Đừng để mất chuỗi Streak hôm nay nhé!',
    content:
      'Chỉ cần dành 5-10 phút ôn tập 3000 Từ Vựng hoặc làm 1 bài hội thoại Giao Tiếp Thực Chiến để giữ vững ngọn lửa Streak và nhận điểm thưởng XP ngày hôm nay!',
    type: 'Reminder',
    iconEmoji: '🔥',
    actionUrl: '/vocab'
  },
  {
    name: '🎁 Sự kiện Nhân Đôi XP',
    title: '🎁 SỰ KIỆN ĐẶC BIỆT: Đua Top Bảng Xếp Hạng Tuần!',
    content:
      'Cuối tuần bùng nổ! Hãy hoàn thành trọn bộ 4 Nhiệm vụ hàng ngày và luyện Phản Xạ 50 Chủ Đề để bứt phá lên đỉnh Bảng Xếp Hạng!',
    type: 'Reward',
    iconEmoji: '🎁',
    actionUrl: '/leaderboard'
  },
  {
    name: '📘 Đề TOEIC Mới',
    title: '📘 Kho đề thi TOEIC vừa được cập nhật mới!',
    content:
      'Quản trị viên vừa bổ sung bộ đề luyện thi TOEIC mới chuẩn cấu trúc ETS. Vào phòng luyện đề thử sức và kiểm tra trình độ ngay!',
    type: 'Announcement',
    iconEmoji: '📘',
    actionUrl: '/toeic'
  },
  {
    name: '⚡ Thử thách Phản Xạ 3 Giây',
    title: '⚡ Thử thách Phản Xạ Nói - Viết 1500 Câu!',
    content:
      'Bạn đã chinh phục được bao nhiêu Unit trong 50 Chủ đề Phản xạ? Vào luyện nói 3 giây cùng AI Studio ngay nhé!',
    type: 'Reminder',
    iconEmoji: '⚡',
    actionUrl: '/reflex-50'
  },
  {
    name: '🏆 Vinh danh Học viên Chăm chỉ',
    title: '🏆 Tuyên dương tinh thần học tập xuất sắc tuần qua!',
    content:
      'Hệ thống VBaceEnglish ghi nhận sự nỗ lực tuyệt vời của các bạn học viên trong tuần qua. Hãy tiếp tục kiên trì mỗi ngày để làm chủ tiếng Anh!',
    type: 'Achievement',
    iconEmoji: '🏆',
    actionUrl: '/progress'
  },
  {
    name: '🔧 Thông báo Bảo trì / Nâng cấp',
    title: '🔧 Thông báo nâng cấp hệ thống VBaceEnglish',
    content:
      'Hệ thống vừa được nâng cấp hiệu năng và bổ sung nhiều tính năng học tập thông minh mới. Chúc các bạn có trải nghiệm học tập mượt mà nhất!',
    type: 'System',
    iconEmoji: '🔧',
    actionUrl: '/home'
  }
];

const EMOJI_OPTIONS = ['📢', '🔔', '🔥', '🎁', '🏆', '📘', '⚡', '✨', '🎉', '✅', '⚠️', '💡', '🚀', '💎', '❤️', '🌟'];

const ACTION_ROUTES = [
  { label: 'Không gắn link điều hướng', value: '' },
  { label: '🏠 Trang chủ Học viên (/home)', value: '/home' },
  { label: '📖 Giao Tiếp Thực Chiến (/bino)', value: '/bino' },
  { label: '⚡ Phản Xạ 50 Chủ Đề (/reflex-50)', value: '/reflex-50' },
  { label: '📚 3000 Từ Vựng Oxford (/vocab)', value: '/vocab' },
  { label: '📝 Phòng Luyện Đề TOEIC (/toeic)', value: '/toeic' },
  { label: '🏆 Bảng Xếp Hạng & Gamification (/leaderboard)', value: '/leaderboard' },
  { label: '📊 Tiến Độ Học Tập (/progress)', value: '/progress' }
];

const TYPE_OPTIONS = [
  { value: 'Announcement', label: '📢 Thông cáo chung', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300' },
  { value: 'Reminder', label: '⏰ Nhắc nhở học tập', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300' },
  { value: 'Reward', label: '🎁 Phần thưởng & Sự kiện', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300' },
  { value: 'Achievement', label: '🏆 Vinh danh & Thành tựu', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' },
  { value: 'System', label: '🔧 Hệ thống & Cập nhật', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'Warning', label: '⚠️ Cảnh báo quan trọng', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300' }
];

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);

  // Form State
  const [targetScope, setTargetScope] = useState('All'); // 'All' | 'Group' | 'Single'
  const [recipientUserId, setRecipientUserId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState({
    approvalStatus: 'approved',
    minLevel: 1,
    minStreak: 0,
    inactiveDays: 0
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('Announcement');
  const [iconEmoji, setIconEmoji] = useState('📢');
  const [actionUrl, setActionUrl] = useState('/home');
  const [expireDays, setExpireDays] = useState(30);

  // History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [histRes, statsRes, stuRes] = await Promise.all([
        notificationApi.getAdminHistory(),
        notificationApi.getAdminStats(),
        dashboardApi.getAdminStudents()
      ]);
      setHistory(histRes?.data || []);
      setStats(statsRes?.data || null);
      setStudents((stuRes?.data || []).filter((s) => s.role !== 'Admin'));
    } catch {
      toast.error('Không thể tải dữ liệu trung tâm thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudentsForSelect = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students.slice(0, 30);
    return students
      .filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phoneNumber?.includes(q)
      )
      .slice(0, 30);
  }, [students, studentSearch]);

  // Estimate how many students match the current selection
  const estimatedRecipientsCount = useMemo(() => {
    if (targetScope === 'All') return students.length;
    if (targetScope === 'Single') return recipientUserId ? 1 : 0;

    return students.filter((s) => {
      if (groupFilter.approvalStatus === 'approved' && !s.isApproved) return false;
      if (groupFilter.approvalStatus === 'pending' && s.isApproved) return false;
      if (groupFilter.minLevel > 1 && (s.level || 1) < groupFilter.minLevel) return false;
      if (groupFilter.minStreak > 0 && (s.streakDays || 0) < groupFilter.minStreak) return false;
      if (groupFilter.inactiveDays > 0) {
        const refDate = s.lastLoginAt ? new Date(s.lastLoginAt) : new Date(s.createdAt);
        const diffDays = (Date.now() - refDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays < groupFilter.inactiveDays) return false;
      }
      return true;
    }).length;
  }, [targetScope, recipientUserId, groupFilter, students]);

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setType(tpl.type);
    setIconEmoji(tpl.iconEmoji);
    setActionUrl(tpl.actionUrl);
    toast.success(`Đã áp dụng mẫu "${tpl.name}"`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
      return;
    }
    if (targetScope === 'Single' && !recipientUserId) {
      toast.error('Vui lòng chọn học viên nhận thông báo!');
      return;
    }
    if (estimatedRecipientsCount === 0) {
      toast.error('Không có học viên nào thỏa mãn điều kiện nhận thông báo!');
      return;
    }

    try {
      setSending(true);
      const payload = {
        targetScope,
        recipientUserId: targetScope === 'Single' ? Number(recipientUserId) : null,
        groupFilter: targetScope === 'Group' ? groupFilter : null,
        title: title.trim(),
        content: content.trim(),
        type,
        iconEmoji,
        actionUrl: actionUrl || null,
        expireDays: Number(expireDays) || 30
      };

      const res = await notificationApi.sendNotification(payload);
      toast.success(res?.message || 'Đã phát sóng thông báo thời gian thực thành công!');
      setTitle('');
      setContent('');
      fetchData(true);
    } catch (err) {
      toast.error(err.message || 'Gửi thông báo thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleResendBatch = (batch) => {
    setTitle(batch.title);
    setContent(batch.content);
    setType(batch.type || 'Announcement');
    setIconEmoji(batch.iconEmoji || '📢');
    setActionUrl(batch.actionUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Đã nạp lại nội dung thông báo lên trình soạn thảo!');
  };

  const handleDeleteBatch = async (batchKey, batchTitle) => {
    if (!window.confirm(`Xóa thông báo "${batchTitle}" khỏi hộp thư của toàn bộ người nhận?`)) return;
    try {
      await notificationApi.deleteNotification(batchKey);
      toast.success('Đã thu hồi và xóa thông báo');
      fetchData(true);
    } catch {
      toast.error('Không thể xóa thông báo');
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (historyTypeFilter !== 'all' && item.type !== historyTypeFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.trim().toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.targetLabel?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, historyTypeFilter, historySearch]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-7 pb-12">
      {/* ===== HERO COMMAND HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-blue-500/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Radio size={14} className="animate-pulse text-rose-400" />
              <span>SignalR Real-Time Broadcast Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Trung Tâm Phát Sóng Thông Báo
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Gửi thông báo đẩy thời gian thực (Real-time Push) tới toàn bộ học viên, lọc theo nhóm trình độ/chuyên cần hoặc gửi riêng cho từng cá nhân chỉ với 1 chạm.
            </p>
          </div>

          <button
            onClick={() => fetchData()}
            className="self-start lg:self-auto px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-extrabold flex items-center gap-2 transition-all"
          >
            <RefreshCw size={15} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[11px] font-bold uppercase text-blue-200">Chiến Dịch Đã Phát</p>
            <p className="text-2xl font-black mt-1">{stats?.totalBatchesSent || 0}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              +{stats?.sentLast7Days || 0} đợt trong 7 ngày qua
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[11px] font-bold uppercase text-emerald-200">Tổng Lượt Nhận</p>
            <p className="text-2xl font-black mt-1">
              {(stats?.totalIndividualDeliveries || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Đã đọc: {(stats?.totalReadCount || 0).toLocaleString()} lượt
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[11px] font-bold uppercase text-amber-200">Tỷ Lệ Mở Đọc TB</p>
            <p className="text-2xl font-black mt-1 text-amber-300">
              {stats?.averageReadRatePercent || 0}%
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">Đo lường chính xác theo từng HV</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[11px] font-bold uppercase text-purple-200">Hiệu Quả Cao Nhất</p>
            <p className="text-sm font-black mt-1 truncate" title={stats?.topPerformingTitle}>
              {stats?.topPerformingTitle || 'Chưa có dữ liệu'}
            </p>
            <p className="text-[11px] text-emerald-300 font-bold mt-1">
              Tỷ lệ đọc: {stats?.topPerformingReadRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* ===== QUICK TEMPLATES BAR ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            Mẫu Thông Báo Nhanh 1 Chạm (Quick Templates)
          </h3>
          <span className="text-[11px] text-slate-400">Bấm để tự động điền nội dung mẫu</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group"
            >
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {tpl.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {tpl.content}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ===== COMPOSER & LIVE PREVIEW GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Composer Form */}
        <form
          onSubmit={handleSend}
          className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Send size={17} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Soạn & Phát Sóng Thông Báo Mới
                </h2>
                <p className="text-xs text-slate-500">
                  Thông báo sẽ đẩy tức thì lên màn hình và chuông của người nhận
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {estimatedRecipientsCount} người nhận
            </span>
          </div>

          {/* 1. Target Audience Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Chọn Đối Tượng Nhận Thông Báo
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'All', label: 'Tất Cả Học Viên', sub: `${students.length} tài khoản`, icon: Users },
                { id: 'Group', label: 'Nhóm Theo Bộ Lọc', sub: 'Lọc Level, Streak...', icon: Filter },
                { id: 'Single', label: 'Cá Nhân Cụ Thể', sub: 'Chọn 1 học viên', icon: UserCheck }
              ].map((opt) => {
                const Icon = opt.icon;
                const active = targetScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetScope(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-white' : 'text-blue-500'} />
                    <p className="text-xs font-extrabold mt-1.5">{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                      {opt.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Conditional Group Filter */}
            {targetScope === 'Group' && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Trạng thái phê duyệt
                  </label>
                  <select
                    value={groupFilter.approvalStatus}
                    onChange={(e) => setGroupFilter({ ...groupFilter, approvalStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Chỉ học viên Đã duyệt</option>
                    <option value="pending">Chỉ học viên Chờ duyệt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Cấp độ tối thiểu (Level ≥)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={groupFilter.minLevel}
                    onChange={(e) => setGroupFilter({ ...groupFilter, minLevel: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Chuỗi Streak tối thiểu (Ngày ≥)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={groupFilter.minStreak}
                    onChange={(e) => setGroupFilter({ ...groupFilter, minStreak: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Học viên vắng mặt (Không học ≥ N ngày)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Không lọc"
                    value={groupFilter.inactiveDays}
                    onChange={(e) => setGroupFilter({ ...groupFilter, inactiveDays: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* Conditional Single Student Picker */}
            {targetScope === 'Single' && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Tìm tên, email hoặc SĐT học viên..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <select
                  value={recipientUserId}
                  onChange={(e) => setRecipientUserId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="">-- Chọn học viên nhận thông báo ({filteredStudentsForSelect.length} kết quả) --</option>
                  {filteredStudentsForSelect.map((stu) => (
                    <option key={stu.userId} value={stu.userId}>
                      {stu.fullName} — {stu.email} (Lv.{stu.level || 1} • {stu.totalXp || 0} XP)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Type & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                2. Phân Loại Thông Báo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Biểu Tượng Emoji
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setIconEmoji(emo)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                      iconEmoji === emo
                        ? 'bg-blue-600 border-blue-600 scale-110 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Title & Content */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                3. Tiêu Đề Thông Báo *
              </label>
              <input
                type="text"
                maxLength={200}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: 🔥 Nhắc nhở hoàn thành mục tiêu học tập hôm nay!"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Nội Dung Chi Tiết *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung truyền cảm hứng hoặc thông tin quan trọng gửi tới học viên..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Action URL & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Link2 size={13} /> Trang Đích Khi Học Viên Bấm Vào
              </label>
              <select
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                {ACTION_ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar size={13} /> Tự Động Ẩn Sau (Ngày)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={expireDays}
                onChange={(e) => setExpireDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || estimatedRecipientsCount === 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send size={17} />
            <span>
              {sending
                ? 'Đang phát sóng thời gian thực...'
                : `Phát Sóng Ngay Tới ${estimatedRecipientsCount} Học Viên`}
            </span>
          </button>
        </form>

        {/* Right 5 cols: Live Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
              <Eye size={15} className="text-blue-500" />
              Xem Trước Giao Diện Học Viên (Live Preview)
            </h3>

            {/* 1. Toast Popup Preview */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-slate-400 mb-2">
                1. Popup Toast Nổi Tức Thì Trên Màn Hình:
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-blue-500/40 shadow-lg flex items-center gap-3">
                <span className="text-xl shrink-0">{iconEmoji || '🔔'}</span>
                <div className="text-xs leading-snug">
                  <span className="font-black text-blue-300">
                    {title || 'Tiêu đề thông báo của bạn'}:{' '}
                  </span>
                  <span className="text-slate-200">
                    {content || 'Nội dung thông báo sẽ hiển thị nổi bật ngay lập tức mà không cần tải lại trang.'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Bell Dropdown Item Preview */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-2">
                2. Thẻ Trong Chuông Thông Báo (Notification Center):
              </p>
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-xs">
                  {iconEmoji || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {TYPE_OPTIONS.find((t) => t.value === type)?.label || 'Thông báo'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Vừa xong</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">
                    {title || 'Tiêu đề thông báo hiển thị tại đây'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                    {content || 'Nội dung chi tiết của thông báo sẽ hiển thị rõ ràng, sắc nét trên cả máy tính và điện thoại.'}
                  </p>
                  {actionUrl && (
                    <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                      <span>Điều hướng tới: {actionUrl}</span>
                    </div>
                  )}
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Automatic Triggers Status Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl p-5 border border-emerald-500/20">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={15} />
              Hệ Thống Tự Động Hóa Đang Hoạt Động
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Tự động báo cho Học viên khi Admin <strong>Phê duyệt tài khoản</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Tự động báo khi Admin <strong>Thưởng XP hoặc Khôi phục Streak</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Tự động báo cho Admin khi có <strong>Học viên mới đăng ký</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Tự động báo khi Admin <strong>Đặt lại mật khẩu / Khóa tài khoản</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== SENT NOTIFICATIONS HISTORY TABLE ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Lịch Sử Chiến Dịch & Thống Kê Tỷ Lệ Mở Đọc ({filteredHistory.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chính xác số lượng người nhận và tỷ lệ đã đọc của từng đợt thông báo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm tiêu đề, đối tượng..."
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="all">Mọi phân loại</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chưa có đợt thông báo nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400">
                  <th className="py-3 px-3">Thông Báo</th>
                  <th className="py-3 px-3">Đối Tượng Nhận</th>
                  <th className="py-3 px-3">Tỷ Lệ Đã Đọc</th>
                  <th className="py-3 px-3">Thời Gian Phát (GMT+7)</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filteredHistory.map((item) => {
                  const vnTime = formatVietnamDateTime(item.createdAt);
                  return (
                    <tr
                      key={item.batchKey}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg shrink-0 mt-0.5">{item.iconEmoji || '🔔'}</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.content}
                            </p>
                            {item.actionUrl && (
                              <span className="inline-block mt-1 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                                Link: {item.actionUrl}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">
                          {item.targetLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Gửi bởi: {item.senderName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-700 dark:text-slate-300">
                            {item.readCount}/{item.totalRecipients} đã xem
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {item.readRatePercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, item.readRatePercent)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {vnTime ? (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">
                              {vnTime.relativeText}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={11} />
                              {vnTime.timeShort} • {vnTime.datePart}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResendBatch(item)}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title="Nạp lại nội dung để phát sóng lại"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBatch(item.batchKey, item.title)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                            title="Thu hồi & xóa thông báo này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
