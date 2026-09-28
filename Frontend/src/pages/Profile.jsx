import React from 'react';
import { User, Mail, Phone, Shield, Calendar, Sun, Moon, LogOut, Trophy, Award, Flame, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import StreakCalendar from '../features/gamification/components/StreakCalendar';
import useGamificationStore from '../features/gamification/store/useGamificationStore';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const profile = useGamificationStore((s) => s.profile);
  const navigate = useNavigate();

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
      
      {/* Profile & Gamification Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-2 glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.fullName || 'Người Dùng'}</h2>
              <div className="flex items-center gap-2 mt-1">
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

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2"><Mail size={16} /> Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2"><Phone size={16} /> Số điện thoại</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.phoneNumber || 'Chưa cập nhật'}</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2"><Calendar size={16} /> Ngày tham gia</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'}
              </span>
            </div>
          </div>
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
            {mode === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-400" />}
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Chế độ hiển thị</p>
              <p className="text-xs text-slate-400">{mode === 'light' ? 'Đang dùng Giao diện Sáng' : 'Đang dùng Giao diện Tối'}</p>
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
