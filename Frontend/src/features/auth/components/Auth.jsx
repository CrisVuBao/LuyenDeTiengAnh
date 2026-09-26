import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import authApi from '../../../api/authApi';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [loginData, setLoginData] = useState({ emailOrPhone: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.emailOrPhone || !loginData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      setPendingApprovalNotice(null);
      const res = await authApi.login(loginData);
      if (res?.data) {
        setAuth(res.data.user, res.data.token);
        toast.success(res.message || 'Đăng nhập thành công!');
        if (res.data.user?.role === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      const msg = err.message || 'Đăng nhập thất bại';
      if (msg.toLowerCase().includes('chờ admin phê duyệt') || msg.toLowerCase().includes('phê duyệt')) {
        setPendingApprovalNotice({
          type: 'warning',
          title: 'Tài khoản đang chờ Admin phê duyệt',
          message: msg
        });
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: registerData.fullName,
        email: registerData.email,
        phoneNumber: registerData.phoneNumber || null,
        password: registerData.password
      });

      const successMsg =
        res?.message ||
        'Đăng ký tài khoản thành công! Vui lòng chờ Admin phê duyệt tài khoản trước khi đăng nhập.';

      toast.success(successMsg, { duration: 5000 });
      setPendingApprovalNotice({
        type: 'success',
        title: 'Đăng ký thành công — Chờ Admin duyệt',
        message:
          'Tài khoản học viên của bạn đã được gửi tới Quản trị viên. Ngay sau khi Admin phê duyệt, bạn có thể đăng nhập để bắt đầu học.'
      });
      setIsLogin(true);
      setLoginData({ emailOrPhone: registerData.email, password: '' });
      setRegisterData({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Subtle Ambient Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl max-w-md w-full p-8 rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] relative z-10 border border-slate-200/80 dark:border-slate-800">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            VBaceEnglish
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chém Tiếng Anh Bino & Luyện Đề TOEIC Thực Chiến
          </p>
        </div>

        {/* Pending Approval Notice Banner */}
        {pendingApprovalNotice && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-left transition-all ${
              pendingApprovalNotice.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  pendingApprovalNotice.type === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {pendingApprovalNotice.type === 'success' ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <Clock size={17} />
                )}
              </div>
              <div className="text-xs leading-relaxed">
                <h4 className="font-bold text-sm mb-0.5">{pendingApprovalNotice.title}</h4>
                <p className="opacity-90">{pendingApprovalNotice.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              isLogin
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setPendingApprovalNotice(null);
            }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              !isLogin
                ? 'bg-white dark:bg-slate-900 text-[#0071e3] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Đăng Ký Học Viên
          </button>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                Email hoặc Số điện thoại
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập email hoặc số điện thoại..."
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Vào Học Ngay'} <ArrowRight size={18} />
            </button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Tài khoản Admin: <span className="font-bold text-[#0071e3] dark:text-blue-400">admin@toeichack.com</span> / <span className="font-bold">Admin@123456</span>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
              <Clock size={16} className="text-[#0071e3] shrink-0" />
              <span>
                Tài khoản đăng ký mới sẽ được <strong>Admin phê duyệt</strong> trước khi kích hoạt đăng nhập.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Họ và Tên
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={registerData.phoneNumber}
                  onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Mật khẩu (từ 6 ký tự)
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0071e3] focus:bg-white focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Đang gửi đăng ký...' : 'Gửi Đăng Ký Học Viên'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
