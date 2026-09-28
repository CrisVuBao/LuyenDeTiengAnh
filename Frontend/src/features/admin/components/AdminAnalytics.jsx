import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Flame,
  Trophy,
  AlertTriangle,
  Bell,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  Award,
  BookOpen,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsApi, notificationApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import { formatVietnamDateTime } from '../../../utils/vietnamTime';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [topTab, setTopTab] = useState('xp'); // 'xp' | 'streak' | 'vocab' | 'bino'
  const [sendingNudgeId, setSendingNudgeId] = useState(null);

  const fetchAnalytics = async (selectedPeriod = period, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await analyticsApi.getOverview(selectedPeriod);
      setData(res?.data || null);
    } catch {
      toast.error('Không thể tải dữ liệu phân tích nâng cao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const handleSendNudgeToStudent = async (stu, isStreakRisk = false) => {
    try {
      setSendingNudgeId(stu.userId);
      await notificationApi.sendNotification({
        targetScope: 'Single',
        recipientUserId: stu.userId,
        title: isStreakRisk
          ? `🔥 ${stu.fullName} ơi, đừng để đứt chuỗi Streak ${stu.currentStreak} ngày nhé!`
          : `👋 ${stu.fullName} ơi, VBaceEnglish nhớ bạn rồi!`,
        content: isStreakRisk
          ? `Bạn đang sở hữu chuỗi ${stu.currentStreak} ngày học liên tiếp cực ấn tượng. Hãy vào học 5 phút ngay hôm nay để giữ vững phong độ nhé!`
          : `Đã ${stu.daysInactive} ngày bạn chưa quay lại luyện tập. Vào ôn lại 10 từ vựng hoặc 1 bài Bino để lấy lại đà bứt phá ngay nào!`,
        type: 'Reminder',
        iconEmoji: isStreakRisk ? '🔥' : '⏰',
        actionUrl: '/home',
        expireDays: 7
      });
      toast.success(`Đã gửi thông báo nhắc học tới "${stu.fullName}"!`);
    } catch {
      toast.error('Lỗi khi gửi thông báo nhắc học');
    } finally {
      setSendingNudgeId(null);
    }
  };

  const handleNudgeAllInactive = async () => {
    if (!data?.inactiveStudents?.length) return;
    if (!window.confirm(`Gửi thông báo nhắc nhở học tập tới toàn bộ học viên vắng mặt ≥ 7 ngày?`)) return;
    try {
      await notificationApi.sendNotification({
        targetScope: 'Group',
        groupFilter: {
          approvalStatus: 'approved',
          minLevel: 1,
          minStreak: 0,
          inactiveDays: 7
        },
        title: '⏰ Quay lại bứt phá tiếng Anh cùng VBaceEnglish nào!',
        content:
          'Đã hơn 1 tuần bạn chưa ghé thăm phòng học. Chỉ 10 phút mỗi ngày với 3000 Từ Vựng và Phản Xạ 50 sẽ giúp bạn tiến bộ vượt bậc!',
        type: 'Reminder',
        iconEmoji: '⏰',
        actionUrl: '/home',
        expireDays: 14
      });
      toast.success('Đã phát sóng thông báo nhắc học tới toàn bộ nhóm học viên vắng mặt!');
    } catch {
      toast.error('Không thể gửi thông báo nhóm');
    }
  };

  const handleExportAnalyticsCsv = () => {
    if (!data) return;
    const rows = [
      ['CHỈ SỐ PHÂN TÍCH HỆ THỐNG VBACEENGLISH', 'GIÁ TRỊ'],
      ['Tổng số học viên', data.totalStudents],
      ['Học viên đã duyệt', data.approvedStudents],
      ['Học viên chờ duyệt', data.pendingStudents],
      ['DAU (Hoạt động 24h)', data.dauCount],
      ['WAU (Hoạt động 7 ngày)', data.wauCount],
      ['MAU (Hoạt động 30 ngày)', data.mauCount],
      ['Tỷ lệ giữ chân 7 ngày (%)', `${data.retentionRate7d}%`],
      ['Tỷ lệ giữ chân 30 ngày (%)', `${data.retentionRate30d}%`],
      ['Tổng điểm XP toàn hệ thống', data.totalSystemXp],
      ['Điểm XP trung bình / học viên', data.averageXpPerStudent],
      ['Tổng số từ vựng 3000 đã thuộc', data.totalVocabMasteredAcrossAll],
      ['Tổng số câu Phản xạ 50 đã thuộc', data.totalReflexMasteredAcrossAll],
      [],
      ['SO SÁNH 4 TRỤ CỘT HỌC TẬP', 'SỐ HỌC VIÊN THAM GIA', 'TỔNG LƯỢT HOÀN THÀNH', 'TỶ LỆ TRUNG BÌNH (%)'],
      ...(data.pillarComparison || []).map((p) => [
        p.pillarName,
        p.activeLearners,
        p.totalCompletions,
        `${p.avgCompletionPercent}%`
      ])
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VBaceEnglish_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất báo cáo phân tích CSV thành công!');
  };

  if (loading && !data) return <PageLoader />;

  const topList =
    topTab === 'xp'
      ? data?.topByXp || []
      : topTab === 'streak'
      ? data?.topByStreak || []
      : topTab === 'vocab'
      ? data?.topByVocab || []
      : data?.topByBino || [];

  return (
    <div className="space-y-7 pb-12">
      {/* ===== HERO HEADER ===== */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-blue-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <BarChart3 size={14} />
              <span>Real-Time Intelligence & Retention Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Phân Tích Chuyên Sâu & Báo Cáo Học Tập
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Đo lường toàn diện chỉ số DAU/WAU/MAU, tỷ lệ giữ chân học viên (Retention Rate), phân bổ 4 trụ cột đào tạo và cảnh báo sớm học viên có nguy cơ bỏ cuộc.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: '7d', label: '7 Ngày' },
              { id: '30d', label: '30 Ngày' },
              { id: '90d', label: '90 Ngày' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              onClick={handleExportAnalyticsCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download size={14} /> Xuất CSV
            </button>

            <button
              onClick={() => fetchAnalytics(period)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* 6 Core Engagement KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-blue-200">DAU (24 Giờ)</p>
            <p className="text-2xl font-black mt-1">{data?.dauCount || 0}</p>
            <p className="text-[10px] text-slate-300">Học viên hoạt động hôm nay</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-emerald-200">WAU (7 Ngày)</p>
            <p className="text-2xl font-black mt-1 text-emerald-300">{data?.wauCount || 0}</p>
            <p className="text-[10px] text-slate-300">Retention 7d: {data?.retentionRate7d || 0}%</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-purple-200">MAU (30 Ngày)</p>
            <p className="text-2xl font-black mt-1 text-purple-300">{data?.mauCount || 0}</p>
            <p className="text-[10px] text-slate-300">Retention 30d: {data?.retentionRate30d || 0}%</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-amber-200">Tổng Điểm XP</p>
            <p className="text-2xl font-black mt-1 text-amber-300">
              {(data?.totalSystemXp || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-300">TB: {data?.averageXpPerStudent || 0} XP/HV</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-cyan-200">Từ Vựng Đã Thuộc</p>
            <p className="text-2xl font-black mt-1 text-cyan-300">
              {(data?.totalVocabMasteredAcrossAll || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-300">Từ vựng Oxford 3000</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <p className="text-[10px] font-extrabold uppercase text-rose-200">Câu Phản Xạ</p>
            <p className="text-2xl font-black mt-1 text-rose-300">
              {(data?.totalReflexMasteredAcrossAll || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-300">Phản xạ 50 Chủ đề</p>
          </div>
        </div>
      </div>

      {/* ===== CHARTS ROW 1: REGISTRATION GROWTH & 4 PILLARS COMPARISON ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Growth AreaChart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                Xu Hướng Tăng Trưởng Học Viên ({period})
              </h3>
              <p className="text-xs text-slate-500">
                Biểu đồ lũy kế tổng số học viên và lượt đăng ký mới theo ngày (GMT+7)
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.registrationTrend || []}>
                <defs>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCount"
                  name="Tổng học viên lũy kế"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCum)"
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Đăng ký mới trong ngày"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={0.15}
                  fill="#10b981"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-purple-600" />
              Phân Bổ Cấp Độ Học Viên (Gamification)
            </h3>
            <p className="text-xs text-slate-500">
              Tỷ lệ học viên theo từng mốc cấp bậc kinh nghiệm XP
            </p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.levelDistribution || []}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {(data?.levelDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            {(data?.levelDistribution || []).map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {item.count} HV ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 4 PILLARS PERFORMANCE BREAKDOWN ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="mb-5">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-600" />
            Hiệu Suất Đào Tạo Giữa 4 Chương Trình Cốt Lõi
          </h3>
          <p className="text-xs text-slate-500">
            Thống kê mức độ tham gia và tổng khối lượng bài học đã hoàn thành trên từng chương trình
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.pillarComparison || []).map((p, idx) => {
            const gradients = [
              'from-purple-500 to-indigo-600',
              'from-blue-500 to-cyan-500',
              'from-emerald-500 to-teal-600',
              'from-amber-500 to-orange-600'
            ];
            return (
              <div
                key={p.pillarName}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg bg-gradient-to-r ${
                      gradients[idx % 4]
                    } text-white text-[11px] font-black`}
                  >
                    {p.pillarName}
                  </span>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {p.totalCompletions.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-500">Tổng đơn vị hoàn thành</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        {p.activeLearners} HV
                      </p>
                      <p className="text-[10px] text-slate-400">Đang theo học</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-500">Tiến độ hoàn thành TB</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {p.avgCompletionPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradients[idx % 4]}`}
                      style={{ width: `${Math.min(100, p.avgCompletionPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== TOP PERFORMERS & SMART ALERTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Performers */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                Bảng Vàng Học Viên Xuất Sắc Nhất
              </h3>
              <p className="text-xs text-slate-500">Top 5 học viên dẫn đầu theo từng tiêu chí</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'xp', label: 'Top XP' },
                { id: 'streak', label: 'Top Streak' },
                { id: 'vocab', label: 'Từ Vựng' },
                { id: 'bino', label: 'Sách Bino' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                    topTab === t.id
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {topList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu xếp hạng.</p>
            ) : (
              topList.map((stu, idx) => (
                <div
                  key={stu.userId}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {stu.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {stu.email} • Lv.{stu.level}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black text-xs shrink-0 border border-blue-200/60 dark:border-blue-800">
                    {stu.metricLabel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Smart Alerts: Inactive & At-Risk Streak Students */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" />
                  Cảnh Báo Thông Minh & Nhắc Học 1 Chạm
                </h3>
                <p className="text-xs text-slate-500">
                  Phát hiện học viên vắng mặt ≥ 7 ngày hoặc sắp mất chuỗi Streak
                </p>
              </div>

              {(data?.inactiveStudents?.length || 0) > 0 && (
                <button
                  onClick={handleNudgeAllInactive}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Bell size={12} /> Nhắc Tất Cả ({data.inactiveStudents.length})
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {(data?.atRiskStreakStudents || []).map((stu) => (
                <div
                  key={`risk-${stu.userId}`}
                  className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black">
                        🔥 Nguy cơ mất Streak {stu.currentStreak} ngày
                      </span>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {stu.fullName}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {stu.email} • Chưa học hôm nay
                    </p>
                  </div>

                  <button
                    onClick={() => handleSendNudgeToStudent(stu, true)}
                    disabled={sendingNudgeId === stu.userId}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Bell size={12} /> Nhắc giữ Streak
                  </button>
                </div>
              ))}

              {(data?.inactiveStudents || []).map((stu) => {
                const vnLast = formatVietnamDateTime(stu.lastActiveAt);
                return (
                  <div
                    key={`inact-${stu.userId}`}
                    className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 text-[10px] font-black">
                          Vắng {stu.daysInactive} ngày
                        </span>
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {stu.fullName}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {stu.email} • Cuối: {vnLast ? vnLast.datePart : 'Chưa rõ'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendNudgeToStudent(stu, false)}
                      disabled={sendingNudgeId === stu.userId}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Bell size={12} /> Gửi nhắc học
                    </button>
                  </div>
                );
              })}

              {(data?.inactiveStudents?.length || 0) === 0 &&
                (data?.atRiskStreakStudents?.length || 0) === 0 && (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    🎉 Tuyệt vời! Toàn bộ học viên đều đang duy trì tiến độ học tập đều đặn!
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
