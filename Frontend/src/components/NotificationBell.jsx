import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Clock,
  Inbox,
  Send
} from 'lucide-react';
import useNotificationStore from '../store/useNotificationStore';
import useAuthStore from '../store/authStore';
import { formatVietnamDateTime } from '../utils/vietnamTime';

const TYPE_STYLES = {
  Announcement: {
    label: 'Thông cáo',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  Reward: {
    label: 'Phần thưởng',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  Approval: {
    label: 'Kích hoạt',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  Reminder: {
    label: 'Nhắc học',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  Warning: {
    label: 'Cảnh báo',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  System: {
    label: 'Hệ thống',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  Achievement: {
    label: 'Thành tựu',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
  }
};

export default function NotificationBell({ isAdminHeader = false }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const bellShake = useNotificationStore((s) => s.bellShake);
  const initRealtime = useNotificationStore((s) => s.initRealtime);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    if (isAuthenticated) {
      initRealtime();
    }
  }, [isAuthenticated, initRealtime]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications(true);
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    if (item.actionUrl) {
      setOpen(false);
      navigate(item.actionUrl);
    }
  };

  const filteredList = tab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
          open
            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300'
        }`}
        title="Trung tâm Thông báo"
      >
        <motion.div
          animate={
            bellShake
              ? { rotate: [0, -18, 18, -14, 14, -8, 8, 0], scale: [1, 1.15, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.6 }}
        >
          <Bell size={18} />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-500/30 border-2 border-white dark:border-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2.5 w-[calc(100vw-1.5rem)] sm:w-[400px] max-h-[80vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-950/25 z-[9999] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Bell size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                      Thông Báo Của Bạn
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                          {unreadCount} mới
                        </span>
                      )}
                    </h3>
                    {/* <p className="text-[11px] text-slate-300">
                      Cập nhật thời gian thực từ hệ thống
                    </p> */}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-blue-200 flex items-center gap-1 transition-all"
                    title="Đánh dấu đã đọc tất cả"
                  >
                    <CheckCheck size={13} />
                    <span>Đọc hết</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/10">
                <button
                  onClick={() => setTab('all')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    tab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setTab('unread')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    tab === 'unread'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[390px]">
              {filteredList.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Inbox size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {tab === 'unread' ? 'Không có thông báo chưa đọc!' : 'Hộp thư thông báo trống'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Khi có thông báo hoặc phần thưởng mới, bạn sẽ nhận được ngay tại đây.
                  </p>
                </div>
              ) : (
                filteredList.map((item) => {
                  const style = TYPE_STYLES[item.type] || TYPE_STYLES.Announcement;
                  const vnTime = formatVietnamDateTime(item.createdAt);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                        !item.isRead
                          ? 'bg-blue-50/60 dark:bg-blue-950/25 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {item.iconEmoji || '🔔'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${style.badge}`}>
                            {style.label}
                          </span>
                          <span
                            className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0"
                            title={vnTime?.fullText || ''}
                          >
                            <Clock size={10} />
                            {vnTime ? `${vnTime.relativeText}` : ''}
                          </span>
                        </div>

                        <h4 className={`text-xs leading-snug mt-1 ${!item.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-slate-400">
                            Từ: <strong className="text-slate-500 dark:text-slate-300">{item.senderName}</strong>
                          </span>
                          {item.actionUrl && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                              Xem ngay <ExternalLink size={10} />
                            </span>
                          )}
                        </div>
                      </div>

                      {!item.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5 shadow-xs shadow-blue-500/50" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {user?.role === 'Admin' && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" /> Quyền Admin VIP
                </span>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/admin/notifications');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Send size={12} />
                  {isAdminHeader ? 'Trung Tâm Phát Thông Báo' : 'Quản Lý Thông Báo'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
