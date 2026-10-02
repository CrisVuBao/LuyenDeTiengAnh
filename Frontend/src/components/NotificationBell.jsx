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
      {/* Duolingo 3D Chunky Squircle Notification Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-all ${
          open
            ? 'bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-400 dark:border-blue-500 border-b-2 text-[#0071e3] translate-y-0.5 shadow-inner'
            : 'duo-btn duo-btn-white duo-btn-xs sm:duo-btn-sm p-0 text-slate-700 dark:text-slate-200'
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
          <Bell size={16} className={open ? 'text-[#0071e3] dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-[#ff4b4b] border-2 border-white dark:border-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Duolingo 3D Compact Lightweight Notification Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-[350px] max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-6 border-b-slate-300 dark:border-b-slate-950 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Duolingo 3D Header: Gọn gàng, sáng sủa, thanh lịch */}
            <div className="p-3 sm:p-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-b-2 border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0071e3] dark:text-sky-400 shrink-0">
                    <Bell size={14} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      Thông báo
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff4b4b]/15 text-[#ff4b4b] border border-[#ff4b4b]/30">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="duo-btn duo-btn-white duo-btn-xs text-[11px] font-black px-2 py-1 flex items-center gap-1 cursor-pointer"
                    title="Đánh dấu đã đọc tất cả"
                  >
                    <CheckCheck size={12} className="text-[#0071e3]" />
                    <span>Đọc hết</span>
                  </button>
                )}
              </div>

              {/* Segmented Filter Pills (Tất cả / Chưa đọc) */}
              <div className="flex items-center gap-1 mt-2.5 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={() => setTab('all')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tab === 'all'
                      ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-xs border-b-2 border-slate-300 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setTab('unread')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tab === 'unread'
                      ? 'bg-white dark:bg-slate-800 text-[#ff4b4b] shadow-xs border-b-2 border-slate-300 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notification List (Lightweight & Compact) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[320px] p-1.5 no-scrollbar">
              {filteredList.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2 border border-slate-200 dark:border-slate-700">
                    <Inbox size={20} />
                  </div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {tab === 'unread' ? 'Không có tin chưa đọc!' : 'Hộp thư thông báo trống'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    Bạn đã cập nhật mọi tin tức mới nhất rồi! ✨
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
                      className={`p-2.5 rounded-2xl transition-all cursor-pointer flex items-start gap-2.5 mb-1 ${
                        !item.isRead
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 border border-blue-200/70 dark:border-blue-800/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 shadow-xs">
                        {item.iconEmoji || '🔔'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <span className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-black border ${style.badge}`}>
                            {style.label}
                          </span>
                          <span
                            className="text-[9.5px] font-semibold text-slate-400 flex items-center gap-1 shrink-0"
                            title={vnTime?.fullText || ''}
                          >
                            <Clock size={9} />
                            {vnTime ? `${vnTime.relativeText}` : ''}
                          </span>
                        </div>

                        <h4 className={`text-xs leading-snug ${!item.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed font-medium">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9.5px] text-slate-400">
                            Từ: <strong className="text-slate-600 dark:text-slate-300">{item.senderName}</strong>
                          </span>
                          {item.actionUrl && (
                            <span className="text-[10px] font-black text-[#0071e3] dark:text-sky-400 inline-flex items-center gap-0.5">
                              Xem ngay <ExternalLink size={10} />
                            </span>
                          )}
                        </div>
                      </div>

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 shrink-0 mt-1.5 shadow-xs" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer cho Admin */}
            {user?.role === 'Admin' && (
              <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 pl-1.5 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Admin VIP
                </span>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/admin/notifications');
                  }}
                  className="duo-btn duo-btn-primary duo-btn-xs text-[11px] font-black flex items-center gap-1 px-2.5 py-1"
                >
                  <Send size={11} />
                  <span>{isAdminHeader ? 'Phát thông báo' : 'Quản lý'}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
