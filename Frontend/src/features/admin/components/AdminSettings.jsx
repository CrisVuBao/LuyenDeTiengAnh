import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shield,
  Gamepad2,
  Bell,
  Bot,
  Database,
  Save,
  RotateCcw,
  RefreshCw,
  Trash2,
  Download,
  Server,
  HardDrive,
  Cpu,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Clock,
  Upload,
  Image as ImageIcon,
  Globe,
  Building,
  Phone,
  Mail,
  FileText,
  Check,
  ExternalLink,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi, dashboardApi } from '../../../api/dashboardAndAiApi';
import PageLoader from '../../../components/PageLoader';
import BrandLogo from '../../../components/BrandLogo';
import useBrandingStore from '../../../store/useBrandingStore';

const TABS = [
  { id: 'Branding', label: 'Thương Hiệu & Logo', icon: Sparkles, color: 'text-amber-500' },
  { id: 'General', label: 'Cài Đặt Chung', icon: Settings, color: 'text-blue-500' },
  { id: 'Security', label: 'Bảo Mật & Đăng Nhập', icon: Shield, color: 'text-emerald-500' },
  { id: 'Learning', label: 'Học Tập & Gamification', icon: Gamepad2, color: 'text-purple-500' },
  { id: 'Notifications', label: 'Thông Báo & Email', icon: Bell, color: 'text-amber-500' },
  { id: 'AI', label: 'Trợ Lý AI (Gemini)', icon: Bot, color: 'text-cyan-500' },
  { id: 'Data', label: 'Dữ Liệu & Máy Chủ', icon: Database, color: 'text-rose-500' }
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('Branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [settingsMap, setSettingsMap] = useState({});
  const [systemInfo, setSystemInfo] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Cleanup options
  const [cleanupConfig, setCleanupConfig] = useState({
    cleanOldNotifications: true,
    notificationRetentionDays: 30,
    cleanOldAiChats: true,
    aiChatRetentionDays: 30,
    cleanOldActivityLogs: false,
    activityLogRetentionDays: 90
  });

  const fetchSettingsAndSystem = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [setRes, sysRes] = await Promise.all([
        settingsApi.getAllSettings(),
        settingsApi.getSystemInfo()
      ]);

      const list = setRes?.data || [];
      const map = {};
      list.forEach((item) => {
        map[item.key] = item.value;
      });
      setSettingsMap(map);
      setSystemInfo(sysRes?.data || null);
    } catch {
      toast.error('Không thể tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndSystem();
  }, []);

  const updateVal = (key, val) => {
    setSettingsMap((prev) => {
      const next = { ...prev, [key]: String(val) };
      if (key === 'brand.name') next['app.name'] = String(val);
      if (key === 'app.name') next['brand.name'] = String(val);
      if (key === 'brand.tagline') next['app.tagline'] = String(val);
      if (key === 'app.tagline') next['brand.tagline'] = String(val);
      return next;
    });
  };

  const handleFileUpload = async (key, file) => {
    if (!file) return;
    try {
      setUploadingKey(key);
      const res = await settingsApi.uploadBrandingAsset(file);
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('Không nhận được đường dẫn tệp tải lên');
      updateVal(key, url);
      toast.success('Đã tải tệp ảnh lên máy chủ thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingKey(null);
    }
  };

  const getBool = (key) => settingsMap[key] === 'true';

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.updateSettings(settingsMap);
      await useBrandingStore.getState().fetchBranding();
      toast.success('Đã lưu cấu hình hệ thống & áp dụng thương hiệu tức thì!');
      fetchSettingsAndSystem(true);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Khôi phục toàn bộ cài đặt hệ thống về mặc định ban đầu?')) return;
    try {
      setSaving(true);
      await settingsApi.resetToDefaults();
      await useBrandingStore.getState().fetchBranding();
      toast.success('Đã khôi phục toàn bộ cài đặt về mặc định!');
      fetchSettingsAndSystem(true);
    } catch {
      toast.error('Không thể khôi phục cài đặt mặc định');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await settingsApi.clearCache();
      toast.success(res?.message || 'Đã xóa bộ nhớ đệm máy chủ thành công!');
    } catch {
      toast.error('Không thể xóa bộ nhớ đệm');
    }
  };

  const handleCleanupData = async () => {
    if (!window.confirm('Thực hiện dọn dẹp dữ liệu cũ theo cấu hình đã chọn?')) return;
    try {
      const res = await settingsApi.cleanupOldData(cleanupConfig);
      toast.success(res?.message || 'Đã dọn dẹp dữ liệu cũ thành công!');
      fetchSettingsAndSystem(true);
    } catch {
      toast.error('Lỗi khi dọn dẹp dữ liệu');
    }
  };

  const handleExportFullBackup = async () => {
    try {
      toast.loading('Đang đóng gói dữ liệu sao lưu...', { id: 'backup' });
      const stuRes = await dashboardApi.getAdminStudents();
      const backupPayload = {
        exportedAtUtc: new Date().toISOString(),
        exportedBy: 'VBaceEnglish Admin Command Center',
        systemSettings: settingsMap,
        systemMetrics: systemInfo,
        studentsCount: (stuRes?.data || []).length,
        students: stuRes?.data || []
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `VBaceEnglish_FullBackup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống bản sao lưu JSON thành công!', { id: 'backup' });
    } catch {
      toast.error('Không thể xuất bản sao lưu', { id: 'backup' });
    }
  };

  if (loading) return <PageLoader />;

  const ToggleRow = ({ settingKey, title, desc, badge }) => {
    const checked = getBool(settingKey);
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</p>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
        </div>
        <button
          type="button"
          onClick={() => updateVal(settingKey, !checked)}
          className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 cursor-pointer ${
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0'
          }`}
          />
        </button>
      </div>
    );
  };

  const BrandingAssetUploader = ({ label, desc, settingKey, accept = "image/*", placeholder, recommended }) => {
    const currentVal = settingsMap[settingKey] || '';
    const isUploading = uploadingKey === settingKey;
    const inputRef = useRef(null);

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {label}
              </label>
              {recommended && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {recommended}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={inputRef}
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(settingKey, file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              <span>{isUploading ? 'Đang tải...' : 'Tải file lên'}</span>
            </button>

            {currentVal && (
              <button
                type="button"
                onClick={() => updateVal(settingKey, '')}
                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Xóa logo này (quay về biểu tượng mặc định)"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={currentVal}
            placeholder={placeholder || 'Nhập URL hình ảnh hoặc bấm nút Tải file lên...'}
            onChange={(e) => updateVal(settingKey, e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Mini Preview Box */}
        {currentVal ? (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0 border border-dashed border-slate-300 dark:border-slate-600">
              <img
                src={currentVal}
                alt={label}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                {currentVal}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={11} /> Đã nhận diện tệp ảnh
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-1">
            Chưa có tệp riêng (Hệ thống dùng phong cách biểu tượng vector mặc định).
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ===== HERO HEADER ===== */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Settings size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
            <span>System Configuration & Server Inspector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cài Đặt & Cấu Hình Hệ Thống
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
            Quản lý toàn diện thông số vận hành, chính sách đăng ký/phê duyệt tự động, hệ số nhân XP Gamification, cấu hình AI Gemini và giám sát tài nguyên SQL Server.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Đang lưu...' : 'Lưu Mọi Cài Đặt'}</span>
          </button>
        </div>
      </div>

      {/* ===== 6 TABS NAVIGATION ===== */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2.5 whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} className={active ? 'text-white' : t.color} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== TAB CONTENT AREA ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* TAB 0: BRANDING & LOGO */}
        {activeTab === 'Branding' && (
          <div className="space-y-8">
            {/* Header description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Quản Lý Thương Hiệu & Logo Toàn Diện (Whitelabel)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Tùy chỉnh toàn bộ tên thương hiệu, tên viết tắt, tagline, biểu tượng logo (chế độ sáng/tối), favicon trình duyệt và thông tin bản quyền chân trang. Mọi thay đổi sẽ cập nhật tức thì trên toàn bộ ứng dụng mà không cần tải lại trang.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                  Instant Whitelabel
                </span>
              </div>
            </div>

            {/* LIVE PREVIEW SECTION */}
            <div className="rounded-3xl bg-slate-950 text-white p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-sky-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Xem Trước Thực Tế (Real-Time Live Preview)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  Mô phỏng tức thì theo các ô nhập bên dưới
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Light Mode Header Preview */}
                <div className="rounded-2xl bg-white p-4 text-slate-900 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Giao diện sáng (Light Mode Navbar)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <BrandLogo
                      size="md"
                      isDark={false}
                      customTitle={settingsMap['brand.name'] || 'VBaceEnglish'}
                      customTagline={settingsMap['brand.tagline'] || 'By Vũ Bảo Software'}
                      customLogoUrl={settingsMap['brand.logo_url'] || null}
                    />
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="px-3 py-1 rounded-full bg-slate-100">Khóa Học</span>
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white">Bắt đầu</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dark Mode Header Preview */}
                <div className="rounded-2xl bg-slate-900 p-4 text-white border border-slate-800 shadow-sm flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Giao diện tối (Dark Mode Navbar)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <BrandLogo
                      size="md"
                      isDark={true}
                      customTitle={settingsMap['brand.name'] || 'VBaceEnglish'}
                      customTagline={settingsMap['brand.tagline'] || 'By Vũ Bảo Software'}
                      customLogoUrl={settingsMap['brand.logo_dark_url'] || settingsMap['brand.logo_url'] || null}
                    />
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="px-3 py-1 rounded-full bg-slate-800">Khóa Học</span>
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white">Bắt đầu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Browser Tab Simulation */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 max-w-md truncate">
                  {settingsMap['brand.favicon_url'] ? (
                    <img
                      src={settingsMap['brand.favicon_url']}
                      alt="Favicon"
                      className="w-4 h-4 rounded-xs object-contain shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <Globe size={14} className="text-sky-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {settingsMap['brand.name'] || 'VBaceEnglish'} — {settingsMap['brand.tagline'] || 'Nền Tảng Tiếng Anh'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Mô phỏng tiêu đề & Favicon trên thanh Tab trình duyệt
                </span>
              </div>
            </div>

            {/* SECTION 1: CORE BRAND TEXTS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <FileText size={17} className="text-blue-500" />
                <span>1. Định Danh & Tên Thương Hiệu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên Thương Hiệu Đầy Đủ (Brand Name) *
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.name'] || ''}
                    onChange={(e) => updateVal('brand.name', e.target.value)}
                    placeholder="VD: VBaceEnglish"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Xuất hiện tại Navbar, Sidebar, tiêu đề tab trình duyệt.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên Rút Gọn / Ký Hiệu (Short Name)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.short_name'] || ''}
                    onChange={(e) => updateVal('brand.short_name', e.target.value)}
                    placeholder="VD: VBace hoặc VB"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Dùng cho biểu tượng ứng dụng hoặc thiết bị di động nhỏ.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tagline Phụ (Sub-tagline)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.tagline'] || ''}
                    onChange={(e) => updateVal('brand.tagline', e.target.value)}
                    placeholder="VD: By Vũ Bảo Software"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Dòng chữ nhỏ dưới tên thương hiệu ở logo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Đơn Vị Chủ Quản / Tên Công Ty (Company Name)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.company_name'] || ''}
                    onChange={(e) => updateVal('brand.company_name', e.target.value)}
                    placeholder="VD: Vũ Bảo Software Corporation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sử dụng trong thẻ SEO JSON-LD và hồ sơ pháp lý.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Khẩu Hiệu / Định Vị Sản Phẩm (Slogan)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.slogan'] || ''}
                    onChange={(e) => updateVal('brand.slogan', e.target.value)}
                    placeholder="VD: Luyện Phản Xạ 1500 Câu & 3000 Từ Vựng Thực Chiến"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Hiển thị tại trang Đăng Nhập và thông tin mô tả ứng dụng.</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: LOGO & VISUAL ASSETS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <ImageIcon size={17} className="text-emerald-500" />
                <span>2. Tải Lên Logo & Biểu Tượng Nhận Diện (Assets & Favicon)</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Main Logo */}
                <BrandingAssetUploader
                  label="Logo Chính (Light Mode / Mặc Định)"
                  desc="Khuyến nghị: Tệp ảnh SVG hoặc PNG nền trong suốt, chiều cao 36–64px."
                  settingKey="brand.logo_url"
                  placeholder="https://.../logo.png hoặc /uploads/branding/..."
                  recommended="Khuyên dùng"
                />

                {/* 2. Dark Mode Logo */}
                <BrandingAssetUploader
                  label="Logo Chế Độ Tối (Dark Mode)"
                  desc="Nếu để trống, hệ thống sẽ tự động dùng Logo Chính cho cả 2 giao diện."
                  settingKey="brand.logo_dark_url"
                  placeholder="Tùy chọn: Logo sáng màu trên nền tối..."
                  recommended="Tùy chọn"
                />

                {/* 3. Browser Favicon */}
                <BrandingAssetUploader
                  label="Favicon Trình Duyệt"
                  desc="Icon hiển thị trên Tab trình duyệt (.ico, .svg, .png). Kích thước 32x32 hoặc 64x64."
                  settingKey="brand.favicon_url"
                  accept="image/x-icon,image/svg+xml,image/png"
                  placeholder="VD: /favicon.svg hoặc URL icon..."
                  recommended="Chuẩn SEO"
                />
              </div>
            </div>

            {/* SECTION 3: FOOTER & CONTACT INFO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                <Building size={17} className="text-purple-500" />
                <span>3. Chân Trang & Thông Tin Liên Hệ Hỗ Trợ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bản Quyền Chân Trang (Copyright)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.copyright'] || ''}
                    onChange={(e) => updateVal('brand.copyright', e.target.value)}
                    placeholder="VD: © 2026 VBaceEnglish — By Vũ Bảo Software."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Xuất hiện ở dòng cuối cùng của Landing Page & Dashboard.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Hỗ Trợ Học Viên
                  </label>
                  <input
                    type="email"
                    value={settingsMap['brand.support_email'] || ''}
                    onChange={(e) => updateVal('brand.support_email', e.target.value)}
                    placeholder="VD: support@vbaceenglish.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Hiển thị tại chân trang và trang liên hệ giải đáp thắc mắc.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hotline Tư Vấn / Hỗ Trợ Kỹ Thuật
                  </label>
                  <input
                    type="text"
                    value={settingsMap['brand.hotline'] || ''}
                    onChange={(e) => updateVal('brand.hotline', e.target.value)}
                    placeholder="VD: 1900 6868 hoặc 0987654321"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Số hotline hiển thị ở chân trang để học viên tiện liên hệ.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: GENERAL */}
        {activeTab === 'General' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                1. Cài Đặt Chung & Chính Sách Học Viên
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Điều chỉnh thông tin thương hiệu, cổng đăng ký tài khoản và chế độ bảo trì toàn trang
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Sparkles size={16} className="text-amber-500 shrink-0" />
                <span>
                  Cấu hình nâng cao gồm Logo tải lên, Dark Mode Logo, Favicon trình duyệt và bản quyền chân trang hiện đã được tách thành tab riêng{' '}
                  <strong className="font-black underline cursor-pointer" onClick={() => setActiveTab('Branding')}>
                    Thương Hiệu & Logo
                  </strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('Branding')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Đến Tab Thương Hiệu
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Tên Ứng Dụng Hiển Thị
                </label>
                <input
                  type="text"
                  value={settingsMap['app.name'] || ''}
                  onChange={(e) => updateVal('app.name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Slogan Thương Hiệu
                </label>
                <input
                  type="text"
                  value={settingsMap['app.tagline'] || ''}
                  onChange={(e) => updateVal('app.tagline', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                settingKey="app.registration_open"
                title="Mở Cổng Đăng Ký Học Viên Mới"
                desc="Khi tắt, người dùng mới sẽ không thể gửi biểu mẫu đăng ký tài khoản."
                badge="Đang áp dụng trực tiếp"
              />

              <ToggleRow
                settingKey="app.auto_approve"
                title="Tự Động Phê Duyệt Tài Khoản Mới (Auto-Approve)"
                desc="Khi bật, học viên đăng ký xong sẽ được kích hoạt ngay lập tức mà không cần chờ Admin duyệt thủ công."
                badge="Thực thi tức thì"
              />

              <ToggleRow
                settingKey="app.maintenance_mode"
                title="Chế Độ Bảo Trì Hệ Thống (Maintenance Mode)"
                desc="Tạm khóa đăng nhập đối với Học viên để nâng cấp hệ thống (Tài khoản Admin vẫn đăng nhập bình thường)."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Thông Điệp Hiển Thị Khi Bảo Trì
                </label>
                <input
                  type="text"
                  value={settingsMap['app.maintenance_message'] || ''}
                  onChange={(e) => updateVal('app.maintenance_message', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Giới Hạn Tổng Số Học Viên Tối Đa (0 = Không giới hạn)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsMap['app.max_students'] || '0'}
                  onChange={(e) => updateVal('app.max_students', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'Security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                2. Chính Sách Bảo Mật & Phiên Đăng Nhập
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình độ mạnh mật khẩu, thời hạn phiên JWT HttpOnly Cookie và chống dò mật khẩu
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Độ Dài Mật Khẩu Tối Thiểu
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settingsMap['auth.min_password_length'] || '6'}
                  onChange={(e) => updateVal('auth.min_password_length', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Thời Hạn JWT Token (Ngày)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settingsMap['auth.jwt_expiry_days'] || '7'}
                  onChange={(e) => updateVal('auth.jwt_expiry_days', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Timeout Phiên Không Hoạt Động (Giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={settingsMap['auth.session_timeout_hours'] || '24'}
                  onChange={(e) => updateVal('auth.session_timeout_hours', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>

            <ToggleRow
              settingKey="auth.require_special_char"
              title="Bắt Buộc Ký Tự Đặc Biệt Trong Mật Khẩu"
              desc="Yêu cầu mật khẩu mới phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Lần Nhập Sai Mật Khẩu Tối Đa Trước Khi Khóa
                </label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={settingsMap['auth.max_login_attempts'] || '5'}
                  onChange={(e) => updateVal('auth.max_login_attempts', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Thời Gian Tạm Khóa Tài Khoản (Phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settingsMap['auth.lockout_minutes'] || '15'}
                  onChange={(e) => updateVal('auth.lockout_minutes', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEARNING & GAMIFICATION */}
        {activeTab === 'Learning' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                3. Cấu Hình Học Tập & Hệ Số Nhân Gamification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tùy chỉnh sự kiện nhân đôi XP (X2 XP), số nhiệm vụ hàng ngày và lộ trình học tập
              </p>
            </div>

            <ToggleRow
              settingKey="gamification.enabled"
              title="Kích Hoạt Hệ Thống Gamification (XP, Level, Streak & Bảng Xếp Hạng)"
              desc="Cho phép học viên tích lũy điểm kinh nghiệm, mở khóa huy hiệu và đua Top hàng tuần."
              badge="Active"
            />

            {/* XP Multiplier Event Booster */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-amber-500/10 border border-purple-500/25">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    Hệ Số Nhân Điểm Kinh Nghiệm Toàn Hệ Thống (XP Multiplier)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tăng hệ số nhân vào dịp cuối tuần hoặc sự kiện đặc biệt để khích lệ học viên cày bài!
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-black text-sm shadow-sm">
                  {settingsMap['gamification.xp_multiplier'] || '1.0'}x XP
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { val: '1.0', label: '1.0x (Mặc định)' },
                  { val: '1.5', label: '1.5x (Tăng tốc)' },
                  { val: '2.0', label: '🔥 2.0x (X2 XP)' },
                  { val: '3.0', label: '🚀 3.0x (Siêu sự kiện)' }
                ].map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => updateVal('gamification.xp_multiplier', m.val)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      settingsMap['gamification.xp_multiplier'] === m.val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Nhiệm Vụ Hàng Ngày
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settingsMap['gamification.daily_quests_count'] || '4'}
                  onChange={(e) => updateVal('gamification.daily_quests_count', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Bùa Đóng Băng Streak Tối Đa
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settingsMap['gamification.streak_freeze_max'] || '3'}
                  onChange={(e) => updateVal('gamification.streak_freeze_max', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Chủ Đề 3000 Từ Vựng
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settingsMap['learning.vocab_topics_count'] || '60'}
                  onChange={(e) => updateVal('learning.vocab_topics_count', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Unit Phản Xạ Thực Chiến
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settingsMap['learning.reflex_units_count'] || '50'}
                  onChange={(e) => updateVal('learning.reflex_units_count', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS & EMAIL */}
        {activeTab === 'Notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                4. Tự Động Hóa Thông Báo & Máy Chủ Email SMTP
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các sự kiện tự động phát thông báo đẩy và cấu hình gửi Email
              </p>
            </div>

            <div className="space-y-3">
              <ToggleRow
                settingKey="notif.auto_notify_approval"
                title="Tự Động Gửi Thông Báo Chào Mừng Khi Duyệt Tài Khoản"
                desc="Gửi thông báo thời gian thực chúc mừng học viên ngay khi Admin nhấn nút Duyệt."
                badge="Real-time"
              />
              <ToggleRow
                settingKey="notif.auto_notify_reward"
                title="Tự Động Gửi Thông Báo Khi Thưởng XP / Khôi Phục Streak"
                desc="Thông báo ngay cho học viên biết số điểm XP vừa được Admin cộng thưởng."
                badge="Real-time"
              />
              <ToggleRow
                settingKey="notif.auto_notify_new_student"
                title="Báo Động Cho Admin Khi Có Học Viên Mới Đăng Ký"
                desc="Hiển thị thông báo trên chuông của Admin ngay khi có học viên đăng ký mới."
                badge="Real-time"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Thông Báo Lưu Trữ Tối Đa / Người Dùng
                </label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={settingsMap['notif.max_notifications_per_user'] || '100'}
                  onChange={(e) => updateVal('notif.max_notifications_per_user', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Thời Hạn Tự Xóa Thông Báo Cũ (Ngày)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settingsMap['notif.notification_expiry_days'] || '30'}
                  onChange={(e) => updateVal('notif.notification_expiry_days', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <ToggleRow
                settingKey="notif.email_enabled"
                title="Kích Hoạt Gửi Email Qua Giao Thức SMTP"
                desc="Cấu hình máy chủ SMTP (Gmail / SendGrid / Custom) để gửi email thông báo."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settingsMap['notif.email_smtp_host'] || ''}
                    onChange={(e) => updateVal('notif.email_smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settingsMap['notif.email_smtp_port'] || '587'}
                    onChange={(e) => updateVal('notif.email_smtp_port', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                    Tài Khoản SMTP (Username)
                  </label>
                  <input
                    type="text"
                    value={settingsMap['notif.email_smtp_user'] || ''}
                    onChange={(e) => updateVal('notif.email_smtp_user', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                    Mật Khẩu Ứng Dụng SMTP (App Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      value={settingsMap['notif.email_smtp_password'] || ''}
                      onChange={(e) => updateVal('notif.email_smtp_password', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSmtpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI & INTEGRATIONS */}
        {activeTab === 'AI' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                5. Cấu Hình Trợ Lý AI (Google Gemini / OpenAI)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Điều chỉnh mô hình AI giải thích đề thi TOEIC và giới hạn tần suất sử dụng
              </p>
            </div>

            <ToggleRow
              settingKey="ai.enabled"
              title="Kích Hoạt Trợ Lý AI Giải Thích Câu Hỏi TOEIC"
              desc="Cho phép học viên bấm nút Hỏi AI để xem phân tích ngữ pháp, từ vựng và mẹo làm bài."
              badge="Gemini AI"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Nhà Cung Cấp AI
                </label>
                <select
                  value={settingsMap['ai.provider'] || 'gemini'}
                  onChange={(e) => updateVal('ai.provider', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                >
                  <option value="gemini">Google Gemini Studio</option>
                  <option value="openai">OpenAI Compatible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Tên Model AI
                </label>
                <input
                  type="text"
                  value={settingsMap['ai.model'] || 'gemini-1.5-flash'}
                  onChange={(e) => updateVal('ai.model', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Khóa API Key Tùy Chỉnh (Để trống nếu dùng mặc định từ Server)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settingsMap['ai.api_key'] || ''}
                    onChange={(e) => updateVal('ai.api_key', e.target.value)}
                    placeholder="AIzaSy... (Để trống để dùng khóa cấu hình sẵn)"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Số Token Phản Hồi Tối Đa
                </label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  value={settingsMap['ai.max_tokens'] || '2048'}
                  onChange={(e) => updateVal('ai.max_tokens', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
                  Giới Hạn Lượt Hỏi AI / Học Viên / Ngày
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={settingsMap['ai.daily_limit_per_user'] || '50'}
                  onChange={(e) => updateVal('ai.daily_limit_per_user', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DATA, BACKUP & SERVER INSPECTOR */}
        {activeTab === 'Data' && (
          <div className="space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  6. Giám Sát Máy Chủ, Cơ Sở Dữ Liệu & Sao Lưu
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra trạng thái vận hành trực tiếp của ASP.NET Core 10 và SQL Server
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchSettingsAndSystem(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <RefreshCw size={14} /> Làm mới thông số
              </button>
            </div>

            {/* Server Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-extrabold">
                  <Server size={15} /> Nền Tảng Backend
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                  {systemInfo?.dotNetVersion || '.NET 10.0'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {systemInfo?.osDescription}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
                  <Cpu size={15} /> RAM & Uptime
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                  {systemInfo?.memoryUsedMb || 0} MB RAM
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Uptime: {systemInfo?.uptimeHours || 0} giờ liên tục
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-extrabold">
                  <Database size={15} /> SQL Server Records
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                  {(systemInfo?.totalDatabaseRows || 0).toLocaleString()} bản ghi
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trên {systemInfo?.totalDatabaseTables || 17} bảng dữ liệu chính
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-extrabold">
                  <HardDrive size={15} /> Kho Media & Giờ Server
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                  {systemInfo?.uploadedFilesCount || 0} files ({systemInfo?.uploadedFilesSizeMb || 0} MB)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={11} /> {systemInfo?.serverTimeVietnam}
                </p>
              </div>
            </div>

            {/* Quick Maintenance Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Download size={16} className="text-blue-600" />
                    Sao Lưu Toàn Hệ Thống (JSON)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tải xuống bản sao lưu đầy đủ gồm cấu hình hệ thống, chỉ số máy chủ và toàn bộ hồ sơ học viên.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all cursor-pointer"
                >
                  Tải Bản Sao Lưu Ngay
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    Làm Mới Bộ Nhớ Đệm (Cache)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Xóa toàn bộ Output Cache & Memory Cache trên máy chủ để cập nhật dữ liệu mới nhất tức thì.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all cursor-pointer"
                >
                  Xóa Cache Máy Chủ
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trash2 size={16} className="text-rose-600" />
                    Dọn Dẹp Dữ Liệu Cũ (Quá 30 ngày)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Xóa các thông báo đã hết hạn và lịch sử hỏi đáp AI quá 30 ngày để tối ưu tốc độ SQL Server.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCleanupData}
                  className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all cursor-pointer"
                >
                  Dọn Dẹp Ngay
                </button>
              </div>
            </div>

            {/* Database Tables Breakdown */}
            {systemInfo?.tableRowCounts && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Chi Tiết Số Bản Ghi Trong Các Bảng SQL Server
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {Object.entries(systemInfo.tableRowCounts).map(([tableName, count]) => (
                    <div
                      key={tableName}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">
                        {tableName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-blue-600 dark:text-blue-400">
                        {Number(count).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
