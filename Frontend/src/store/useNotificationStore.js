import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/dashboardAndAiApi';
import useAuthStore from './authStore';

let hubConnection = null;
let connectedUserId = null;
let pollTimer = null;
let focusListenersBound = false;
let hasLoadedInitial = false;

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

function showNotificationToast(payload) {
  if (!payload) return;
  playNotificationChime();
  toast(
    `${payload.iconEmoji || '🔔'} ${payload.title}: ${payload.content}`,
    {
      id: `notif-${payload.id || payload.batchId || Date.now()}`,
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
      const prevList = get().notifications || [];
      const prevIds = new Set(prevList.map((n) => n.id));

      const res = await notificationApi.getMyNotifications(40);
      const list = res?.data || [];
      const unread = list.filter((n) => !n.isRead).length;

      // Detect newly arrived unread notifications even if picked up via background sync
      if (hasLoadedInitial && list.length > 0) {
        const brandNew = list.filter((n) => !n.isRead && n.id && !prevIds.has(n.id));
        if (brandNew.length > 0) {
          set({ bellShake: true });
          setTimeout(() => set({ bellShake: false }), 2000);
          showNotificationToast(brandNew[0]);
        }
      }
      hasLoadedInitial = true;

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
    const { isAuthenticated, token, user } = useAuthStore.getState();
    if (!isAuthenticated) return;

    const currentUserId = user?.id || user?.userId || null;

    // Fetch initial notifications immediately
    get().fetchNotifications(true);

    // Setup periodic background sync every 8s as real-time fallback
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        if (useAuthStore.getState().isAuthenticated) {
          get().fetchNotifications(true);
        }
      }, 8000);
    }

    // Bind window focus / visibilitychange listeners once for instant sync
    if (!focusListenersBound && typeof window !== 'undefined') {
      focusListenersBound = true;
      const syncOnFocus = () => {
        if (document.visibilityState === 'visible' && useAuthStore.getState().isAuthenticated) {
          useNotificationStore.getState().fetchNotifications(true);
        }
      };
      window.addEventListener('focus', syncOnFocus);
      document.addEventListener('visibilitychange', syncOnFocus);
    }

    // If user changed or previous connection died, clean up old hubConnection
    if (
      hubConnection &&
      (connectedUserId !== currentUserId ||
        hubConnection.state === signalR.HubConnectionState.Disconnected)
    ) {
      try {
        await hubConnection.stop();
      } catch {
        // ignore
      }
      hubConnection = null;
    }

    if (hubConnection) return;

    try {
      connectedUserId = currentUserId;
      hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('/notificationHub', {
          accessTokenFactory: () => useAuthStore.getState().token || token || '',
          withCredentials: true
        })
        .withAutomaticReconnect([0, 1500, 3000, 5000, 10000, 20000])
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
          showNotificationToast(payload);
        }
      });

      hubConnection.onreconnected(() => {
        set({ connected: true });
        get().fetchNotifications(true);
      });

      hubConnection.onclose(() => {
        set({ connected: false });
      });

      await hubConnection.start();
      set({ connected: true });
    } catch {
      set({ connected: false });
      hubConnection = null;
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
    connectedUserId = null;
    hasLoadedInitial = false;
    set({ notifications: [], unreadCount: 0, connected: false });
  },

  reset: () => {
    get().disconnectRealtime();
  }
}));

if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, prevState) => {
    const newUid = state.user?.id || null;
    const oldUid = prevState?.user?.id || null;
    if (newUid !== oldUid || state.isAuthenticated !== prevState?.isAuthenticated) {
      useNotificationStore.getState().reset();
      if (newUid && state.isAuthenticated) {
        useNotificationStore.getState().fetchNotifications();
      }
    }
  });
}

export default useNotificationStore;
