import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Download,
  Clock,
  ShieldCheck,
  UserCheck,
  Bell,
  Settings,
  Trash2,
  Gift,
  Lock,
  KeyRound,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { activityLogApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import { formatVietnamDateTime } from '../../../utils/vietnamTime';

function getActionMeta(action = '') {
  if (action.includes('approve'))
    return {
      label: 'Phê duyệt TK',
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    };
  if (action.includes('reward') || action.includes('streak'))
    return {
      label: 'Thưởng XP / Streak',
      icon: Gift,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    };
  if (action.includes('notification'))
    return {
      label: 'Phát Thông Báo',
      icon: Bell,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    };
  if (action.includes('settings') || action.includes('system'))
    return {
      label: 'Cấu Hình Hệ Thống',
      icon: Settings,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    };
  if (action.includes('lock'))
    return {
      label: 'Khóa / Mở Khóa',
      icon: Lock,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800'
    };
  if (action.includes('password'))
    return {
      label: 'Đặt Lại Mật Khẩu',
      icon: KeyRound,
      color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
    };
  if (action.includes('delete'))
    return {
      label: 'Xóa Dữ Liệu',
      icon: Trash2,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    };
  return {
    label: action || 'Thao tác Admin',
    icon: ShieldCheck,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
}

export default function AdminActivityLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [entityType, setEntityType] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = async (targetPage = page, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        activityLogApi.getLogs({
          action: actionFilter,
          entityType,
          search,
          page: targetPage,
          pageSize: 40
        }),
        activityLogApi.getStats()
      ]);

      const paged = logsRes?.data || {};
      setLogs(paged.items || []);
      setTotalCount(paged.totalCount || 0);
      setTotalPages(paged.totalPages || 1);
      setStats(statsRes?.data || null);
    } catch {
      toast.error('Không thể tải nhật ký hoạt động quản trị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [entityType, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handleExportCsv = () => {
    if (!logs.length) {
      toast.error('Không có dữ liệu nhật ký để xuất');
      return;
    }

    const headers = ['ID', 'Thời gian (GMT+7)', 'Quản trị viên', 'Mã hành động', 'Phân hệ', 'Chi tiết thao tác', 'Địa chỉ IP'];
    const rows = logs.map((l) => {
      const vn = formatVietnamDateTime(l.createdAt);
      return [
        l.id,
        vn ? vn.fullText : l.createdAt,
        l.adminName,
        l.action,
        l.entityType,
        l.description,
        l.ipAddress || 'Local'
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VBaceEnglish_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV Nhật ký hoạt động!');
  };

  if (loading && logs.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      {/* ===== HERO HEADER ===== */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <ScrollText size={14} />
              <span>Security & Governance Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Nhật Ký Hoạt Động Quản Trị (Audit Log)
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Ghi nhận tự động và minh bạch 100% thao tác quản trị hệ thống: phê duyệt học viên, thưởng XP, phát thông báo, chỉnh sửa cài đặt theo chuẩn giờ Việt Nam (GMT+7).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download size={15} /> Xuất CSV
            </button>
            <button
              onClick={() => fetchLogs(page)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <p className="text-[11px] font-bold uppercase text-blue-200">Tổng Bản Ghi Audit</p>
            <p className="text-2xl font-black mt-1">{totalCount.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <p className="text-[11px] font-bold uppercase text-emerald-200">Thao Tác Hôm Nay</p>
            <p className="text-2xl font-black mt-1 text-emerald-300">{stats?.todayLogs || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <p className="text-[11px] font-bold uppercase text-amber-200">Quản Lý Học Viên</p>
            <p className="text-2xl font-black mt-1 text-amber-300">{stats?.studentActionsCount || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <p className="text-[11px] font-bold uppercase text-purple-200">Thông Báo & Cấu Hình</p>
            <p className="text-2xl font-black mt-1 text-purple-300">
              {(stats?.notificationActionsCount || 0) + (stats?.settingsActionsCount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học viên, mô tả thao tác, email admin..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="all">Tất cả phân hệ</option>
            <option value="Student">👤 Học viên (Student)</option>
            <option value="Notification">🔔 Thông báo (Notification)</option>
            <option value="Setting">⚙️ Cài đặt (Setting)</option>
            <option value="System">🖥️ Hệ thống (System)</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="all">Mọi loại hành động</option>
            <option value="student.approve">Phê duyệt học viên</option>
            <option value="student.reward">Thưởng XP / Streak</option>
            <option value="student.create">Tạo mới học viên</option>
            <option value="student.update">Cập nhật học viên</option>
            <option value="student.delete">Xóa tài khoản</option>
            <option value="notification">Phát sóng thông báo</option>
            <option value="settings">Thay đổi cài đặt</option>
          </select>
        </div>
      </div>

      {/* ===== TIMELINE LIST ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {logs.length === 0 ? (
          <div className="py-14 text-center">
            <ScrollText size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Chưa có bản ghi nhật ký nào khớp bộ lọc
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Mọi thao tác duyệt học viên, thưởng XP, phát thông báo hoặc lưu cài đặt sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const meta = getActionMeta(log.action);
              const Icon = meta.icon;
              const vn = formatVietnamDateTime(log.createdAt);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${meta.color}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          [{log.action}]
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          • Thực hiện bởi: {log.adminName}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5 leading-snug">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                    {vn ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <Clock size={11} /> {vn.relativeText}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {vn.timePart} • {vn.datePart}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Trang <strong>{page}</strong> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  fetchLogs(p);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  fetchLogs(p);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
