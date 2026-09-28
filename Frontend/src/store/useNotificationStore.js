import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/dashboardAndAiApi';
import useAuthStore from './authStore';

let hubConnection = null;
let pollTimer = null;

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Ignore audio context restriction errors
  }
}

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  connected: false,
  bellShake: false,

  fetchNotifications: async (silent = false) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    try {
      if (!silent) set({ loading: true });
      const res = await notificationApi.getMyNotifications(40);
      const list = res?.data || [];
      const unread = list.filter((n) => !n.isRead).length;
      set({
        notifications: list,
        unreadCount: unread,
        loading: false
      });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    const current = get().notifications;
    const target = current.find((n) => n.id === id);
    if (!target || target.isRead) return;

    const updated = current.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    );
    set({
      notifications: updated,
      unreadCount: Math.max(0, get().unreadCount - 1)
    });

    try {
      await notificationApi.markAsRead(id);
    } catch {
      // Revert on failure if needed
    }
  },

  markAllAsRead: async () => {
    const current = get().notifications;
    if (get().unreadCount === 0) return;

    const nowIso = new Date().toISOString();
    set({
      notifications: current.map((n) => ({ ...n, isRead: true, readAt: n.readAt || nowIso })),
      unreadCount: 0
    });

    try {
      await notificationApi.markAllAsRead();
      toast.success('Đã đánh dấu đọc tất cả thông báo');
    } catch {
      get().fetchNotifications(true);
    }
  },

  initRealtime: async () => {
    const { isAuthenticated, token } = useAuthStore.getState();
    if (!isAuthenticated) return;

    // Fetch initial notifications immediately
    get().fetchNotifications(true);

    // Setup periodic background sync every 45s as fallback
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        if (useAuthStore.getState().isAuthenticated) {
          get().fetchNotifications(true);
        }
      }, 45000);
    }

    if (hubConnection) return;

    try {
      hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('/notificationHub', {
          accessTokenFactory: () => useAuthStore.getState().token || token || '',
          withCredentials: true
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      hubConnection.on('ReceiveNotification', (payload) => {
        if (!payload) return;

        const existing = get().notifications;
        const alreadyExists = existing.some((n) => n.id === payload.id && payload.id > 0);
        if (!alreadyExists) {
          set({
            notifications: [payload, ...existing].slice(0, 50),
            unreadCount: get().unreadCount + 1,
            bellShake: true
          });

          setTimeout(() => set({ bellShake: false }), 2000);
          playNotificationChime();

          toast(
            `${payload.iconEmoji || '🔔'} ${payload.title}: ${payload.content}`,
            {
              duration: 5500,
              style: {
                borderRadius: '16px',
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                fontWeight: 600,
                fontSize: '13px'
              }
            }
          );
        }
      });

      await hubConnection.start();
      set({ connected: true });
    } catch {
      set({ connected: false });
    }
  },

  disconnectRealtime: async () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (hubConnection) {
      try {
        await hubConnection.stop();
      } catch {
        // ignore
      }
      hubConnection = null;
    }
    set({ notifications: [], unreadCount: 0, connected: false });
  }
}));

export default useNotificationStore;
