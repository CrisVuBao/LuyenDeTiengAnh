import { create } from 'zustand';
import { settingsApi } from '../api/dashboardAndAiApi';

const DEFAULT_BRANDING = {
  brandName: 'VBaceEnglish',
  shortName: 'VBace',
  tagline: 'By Vũ Bảo Software',
  slogan: 'Giao Tiếp Thực Chiến & Luyện Đề TOEIC Chuẩn ETS',
  description: 'Nền tảng học tiếng Anh giao tiếp & luyện thi TOEIC, THPT, IELTS thông minh với công nghệ phản xạ và FSRS.',
  companyName: 'Vũ Bảo Software',
  logoUrl: '/favicon.svg',
  logoDarkUrl: '/favicon.svg',
  faviconUrl: '/favicon.svg',
  copyright: '© 2026 VBaceEnglish — By Vũ Bảo Software. Tất cả quyền được bảo lưu.',
  supportEmail: 'support@vbaceenglish.com',
  hotline: '0988.xxx.xxx',
  maintenanceMode: false,
  maintenanceMessage: '',
  registrationOpen: true
};

const applyDynamicHead = (data) => {
  if (typeof document === 'undefined') return;

  // 1. Cập nhật Favicon động trên Tab trình duyệt
  const favUrl = data.faviconUrl || '/favicon.svg';
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = favUrl;

  // 2. Cập nhật Web App Title nếu cần
  if (data.brandName && document.title.includes('VBaceEnglish')) {
    document.title = document.title.replace(/VBaceEnglish/g, data.brandName);
  }
};

const useBrandingStore = create((set, get) => ({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  isInitialized: false,

  fetchBranding: async () => {
    try {
      set({ isLoading: true });
      const res = await settingsApi.getPublicBranding();
      const data = res?.data || res;

      if (data && (data.brandName || data.appName)) {
        const merged = {
          ...DEFAULT_BRANDING,
          brandName: data.brandName || data.appName || DEFAULT_BRANDING.brandName,
          shortName: data.shortName || DEFAULT_BRANDING.shortName,
          tagline: data.tagline || data.appTagline || DEFAULT_BRANDING.tagline,
          slogan: data.slogan || DEFAULT_BRANDING.slogan,
          description: data.description || DEFAULT_BRANDING.description,
          companyName: data.companyName || DEFAULT_BRANDING.companyName,
          logoUrl: data.logoUrl || '/favicon.svg',
          logoDarkUrl: data.logoDarkUrl || data.logoUrl || '/favicon.svg',
          faviconUrl: data.faviconUrl || '/favicon.svg',
          copyright: data.copyright || DEFAULT_BRANDING.copyright,
          supportEmail: data.supportEmail || DEFAULT_BRANDING.supportEmail,
          hotline: data.hotline || DEFAULT_BRANDING.hotline,
          maintenanceMode: Boolean(data.maintenanceMode),
          maintenanceMessage: data.maintenanceMessage || '',
          registrationOpen: data.registrationOpen !== undefined ? Boolean(data.registrationOpen) : true
        };

        set({ branding: merged, isInitialized: true, isLoading: false });
        applyDynamicHead(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Không thể nạp thông tin thương hiệu công khai, sử dụng cấu hình mặc định:', err?.message || err);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
    return get().branding;
  },

  updateBrandingLocal: (partial) => {
    set((state) => {
      const updated = { ...state.branding, ...partial };
      applyDynamicHead(updated);
      return { branding: updated };
    });
  }
}));

export default useBrandingStore;
