import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Sun,
  Moon,
  LogOut,
  Trophy,
  Award,
  Flame,
  ArrowRight,
  Edit3,
  Check,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi, { normalizeVietnamPhone, validateVietnamPhone } from '../api/authApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import StreakCalendar from '../features/gamification/components/StreakCalendar';
import SeoMeta from '../components/SeoMeta';
import useGamificationStore from '../features/gamification/store/useGamificationStore';

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const profile = useGamificationStore((s) => s.profile);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [phoneCheckState, setPhoneCheckState] = useState({
    checking: false,
    available: null,
    message: null
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        fullName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || ''
      });
      setPhoneCheckState({ checking: false, available: null, message: null });
    }
  }, [user, isEditing]);

  // Kiểm tra trùng lặp Số điện thoại khi chỉnh sửa trong Hồ sơ
  useEffect(() => {
    if (!isEditing) return;
    const rawPhone = formData.phoneNumber.trim();
    if (!rawPhone) {
      setPhoneCheckState({
        checking: false,
        available: false,
        message: 'Vui lòng nhập số điện thoại để có thể đăng nhập bằng SĐT.'
      });
      return;
    }

    const v = validateVietnamPhone(rawPhone, true);
    if (!v.valid) {
      setPhoneCheckState({
        checking: false,
        available: false,
        message: v.error
      });
      return;
    }

    // Nếu không thay đổi so với số hiện tại của chính user
    if (normalizeVietnamPhone(user?.phoneNumber || '') === v.normalized) {
      setPhoneCheckState({
        checking: false,
        available: true,
        message: 'Số điện thoại hiện tại của bạn'
      });
      return;
    }

    setPhoneCheckState((prev) => ({ ...prev, checking: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkAvailability({
          phone: v.normalized,
          excludeUserId: user?.id
        });
        const data = res?.data;
        if (data) {
          setPhoneCheckState({
            checking: false,
            available: data.phoneAvailable,
            message: data.phoneAvailable
              ? 'Số điện thoại hợp lệ và có thể sử dụng'
              : data.phoneMessage || 'Số điện thoại này đã được đăng ký bởi tài khoản khác.'
          });
        }
      } catch {
        setPhoneCheckState((prev) => ({ ...prev, checking: false }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.phoneNumber, isEditing, user?.id, user?.phoneNumber]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    const phoneValidation = validateVietnamPhone(formData.phoneNumber, true);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error);
      return;
    }

    if (phoneCheckState.available === false) {
      toast.error(phoneCheckState.message || 'Số điện thoại không hợp lệ hoặc đã bị trùng');
      return;
    }

    try {
      setSaving(true);
      const res = await authApi.updateProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: phoneValidation.normalized
      });
      if (res?.data) {
        updateUser(res.data);
      }
      toast.success(res?.message || 'Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Đã đăng xuất');
      navigate('/auth');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <SeoMeta
        title="Hồ Sơ Học Viên"
        description="Quản lý tài khoản, thông tin cá nhân và cài đặt học tập trên VBaceEnglish."
      />
      {/* Profile & Gamification Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {user?.fullName || 'Người Dùng'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {user?.role || 'Student'}
                  </span>
                  {profile && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Trophy size={12} /> Lv.{profile.currentLevel || 1} {profile.levelTitle || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#0071e3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Edit3 size={14} />
                <span>Cập nhật SĐT / Tên</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nhập họ và tên..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0071e3] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Số điện thoại (Dùng để đăng nhập)
                  </label>
                  {phoneCheckState.checking && (
                    <span className="text-[11px] text-slate-400">Đang kiểm tra trùng lặp...</span>
                  )}
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    onBlur={() => {
                      const norm = normalizeVietnamPhone(formData.phoneNumber);
                      if (norm) setFormData((prev) => ({ ...prev, phoneNumber: norm }));
                    }}
                    placeholder="0912345678 (10 chữ số)"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:outline-none ${
                      phoneCheckState.available === false
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                        : phoneCheckState.available === true
                        ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-[#0071e3]'
                    }`}
                    required
                  />
                </div>
                {phoneCheckState.message && (
                  <p
                    className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${
                      phoneCheckState.available === false
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {phoneCheckState.available === false ? (
                      <AlertCircle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>{phoneCheckState.message}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X size={14} /> Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || phoneCheckState.available === false}
                  className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail size={16} /> Email đăng nhập
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.email || 'N/A'}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Phone size={16} /> Số điện thoại đăng nhập
                </span>
                {user?.phoneNumber ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.phoneNumber}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    + Bổ sung SĐT ngay để đăng nhập bằng SĐT
                  </button>
                )}
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar size={16} /> Ngày tham gia
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                    : 'Mới tham gia'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Gamification Action Card */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vinh danh & Xếp hạng
            </span>
            <div className="space-y-1">
              <h3 className="font-black text-2xl text-slate-900 dark:text-white">
                {profile?.totalXP || 0} <span className="text-sm font-normal text-slate-400">XP</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hạng #{profile?.leaderboardRank || 1} tuần này
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-2">
              <Flame size={18} className="fill-orange-500" />
              <span>Chuỗi {profile?.currentStreak || 0} ngày liên tiếp</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full py-3 px-4 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Award size={16} />
            <span>Bảng Xếp Hạng & Huy Hiệu</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Streak Calendar Component */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Chuỗi Ngày & Lịch Học Tập Của Bạn
        </h3>
        <StreakCalendar />
      </div>

      {/* Settings Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Cài Đặt Hệ Thống</h3>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {mode === 'light' ? (
              <Sun size={20} className="text-amber-500" />
            ) : (
              <Moon size={20} className="text-blue-400" />
            )}
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Chế độ hiển thị
              </p>
              <p className="text-xs text-slate-400">
                {mode === 'light' ? 'Đang dùng Giao diện Sáng' : 'Đang dùng Giao diện Tối'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm cursor-pointer"
          >
            Chuyển sang {mode === 'light' ? 'Tối' : 'Sáng'}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 mt-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={16} /> Đăng Xuất Khỏi Tài Khoản
        </button>
      </div>
    </div>
  );
}

