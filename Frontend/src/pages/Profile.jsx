import React from 'react';
import { User, Mail, Phone, Shield, Calendar, Sun, Moon, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Profile Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.fullName || 'Người Dùng'}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {user?.role || 'Student'}
            </span>
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
            className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm"
          >
            Chuyển sang {mode === 'light' ? 'Tối' : 'Sáng'}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 mt-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Đăng Xuất Khỏi Tài Khoản
        </button>
      </div>

    </div>
  );
}
