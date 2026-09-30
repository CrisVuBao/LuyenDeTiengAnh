import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import authApi, { normalizeVietnamPhone, validateVietnamPhone } from '../../../api/authApi';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/useBrandingStore';
import BrandLogo from '../../../components/BrandLogo';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const branding = useBrandingStore((state) => state.branding);
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
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

  // Trạng thái kiểm tra trùng lặp Email & Số điện thoại theo thời gian thực
  const [availability, setAvailability] = useState({
    checkingEmail: false,
    emailAvailable: null,
    emailMessage: null,
    checkingPhone: false,
    phoneAvailable: null,
    phoneMessage: null
  });

  // Kiểm tra trùng lặp Email khi người dùng nhập ở form Đăng ký
  useEffect(() => {
    if (isLogin) return;
    const email = registerData.email.trim();
    if (!email) {
      setAvailability((prev) => ({
        ...prev,
        checkingEmail: false,
        emailAvailable: null,
        emailMessage: null
      }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAvailability((prev) => ({
        ...prev,
        checkingEmail: false,
        emailAvailable: false,
        emailMessage: 'Định dạng Email chưa hợp lệ (VD: example@gmail.com).'
      }));
      return;
    }

    setAvailability((prev) => ({ ...prev, checkingEmail: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkAvailability({ email });
        const data = res?.data;
        if (data) {
          setAvailability((prev) => ({
            ...prev,
            checkingEmail: false,
            emailAvailable: data.emailAvailable,
            emailMessage: data.emailMessage || null
          }));
        }
      } catch {
        setAvailability((prev) => ({ ...prev, checkingEmail: false }));
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [registerData.email, isLogin]);

  // Kiểm tra định dạng & trùng lặp Số điện thoại khi người dùng nhập ở form Đăng ký
  useEffect(() => {
    if (isLogin) return;
    const rawPhone = registerData.phoneNumber.trim();
    if (!rawPhone) {
      setAvailability((prev) => ({
        ...prev,
        checkingPhone: false,
        phoneAvailable: null,
        phoneMessage: null
      }));
      return;
    }

    const phoneCheck = validateVietnamPhone(rawPhone, true);
    if (!phoneCheck.valid) {
      setAvailability((prev) => ({
        ...prev,
        checkingPhone: false,
        phoneAvailable: false,
        phoneMessage: phoneCheck.error
      }));
      return;
    }

    setAvailability((prev) => ({ ...prev, checkingPhone: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkAvailability({ phone: phoneCheck.normalized });
        const data = res?.data;
        if (data) {
          setAvailability((prev) => ({
            ...prev,
            checkingPhone: false,
            phoneAvailable: data.phoneAvailable,
            phoneMessage: data.phoneMessage || null
          }));
        }
      } catch {
        setAvailability((prev) => ({ ...prev, checkingPhone: false }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [registerData.phoneNumber, isLogin]);

  // Nhận diện thông minh xem người dùng đang gõ SĐT hay Email ở ô Đăng nhập
  const isLoginTypingPhone =
    loginData.emailOrPhone.trim().length > 0 &&
    !loginData.emailOrPhone.includes('@') &&
    /^[0-9+\s.\-()]+$/.test(loginData.emailOrPhone.trim());

  const handleLogin = async (e) => {
    e.preventDefault();
    const rawIdentifier = loginData.emailOrPhone.trim();
    if (!rawIdentifier || !loginData.password) {
      toast.error('Vui lòng điền đầy đủ Email/Số điện thoại và Mật khẩu');
      return;
    }

    let finalIdentifier = rawIdentifier;
    if (!rawIdentifier.includes('@') && /^[0-9+\s.\-()]+$/.test(rawIdentifier)) {
      const phoneCheck = validateVietnamPhone(rawIdentifier, true);
      if (!phoneCheck.valid) {
        toast.error(phoneCheck.error);
        return;
      }
      finalIdentifier = phoneCheck.normalized;
    }

    try {
      setLoading(true);
      setPendingApprovalNotice(null);
      const res = await authApi.login({
        emailOrPhone: finalIdentifier,
        password: loginData.password
      });
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

    if (!registerData.fullName.trim()) {
      toast.error('Vui lòng nhập Họ và tên');
      return;
    }

    const phoneValidation = validateVietnamPhone(registerData.phoneNumber, true);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error);
      return;
    }

    if (availability.emailAvailable === false) {
      toast.error(availability.emailMessage || 'Email này đã được đăng ký trong hệ thống');
      return;
    }

    if (availability.phoneAvailable === false) {
      toast.error(availability.phoneMessage || 'Số điện thoại này đã được đăng ký trong hệ thống');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: registerData.fullName.trim(),
        email: registerData.email.trim(),
        phoneNumber: phoneValidation.normalized,
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
          'Tài khoản học viên của bạn đã được tạo. Ngay sau khi Admin phê duyệt, bạn có thể đăng nhập bằng Email hoặc Số điện thoại vừa đăng ký.'
      });
      setIsLogin(true);
      setLoginData({ emailOrPhone: phoneValidation.normalized || registerData.email.trim(), password: '' });
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
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Subtle Ambient Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Back to Landing Page Link */}
      <div className="max-w-md w-full mb-3.5 relative z-10 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 shadow-2xs transition-all group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay về trang giới thiệu</span>
        </Link>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl max-w-md w-full p-8 rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] relative z-10 border border-slate-200/80 dark:border-slate-800">
        {/* Header */}
        <div className="text-center mb-7 flex flex-col items-center">
          <Link
            to="/"
            className="inline-block group cursor-pointer"
            title={`Quay về trang giới thiệu ${branding.brandName}`}
          >
            <BrandLogo size="lg" />
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
            {branding.slogan || 'Giao Tiếp Thực Chiến & Luyện Đề TOEIC Chuẩn ETS'}
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
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
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
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Email hoặc Số điện thoại
                </label>
                {loginData.emailOrPhone.trim() && (
                  <span className="text-[11px] font-semibold text-[#0071e3] dark:text-sky-400">
                    {isLoginTypingPhone ? '📱 Đăng nhập bằng SĐT' : '✉️ Đăng nhập bằng Email'}
                  </span>
                )}
              </div>
              <div className="relative">
                {isLoginTypingPhone ? (
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0071e3]" />
                ) : (
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                )}
                <input
                  type="text"
                  placeholder="Nhập email hoặc số điện thoại (VD: 0912345678)..."
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                  onBlur={() => {
                    if (isLoginTypingPhone) {
                      const norm = normalizeVietnamPhone(loginData.emailOrPhone);
                      if (norm) setLoginData((prev) => ({ ...prev, emailOrPhone: norm }));
                    }
                  }}
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
              className="w-full py-3.5 mt-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'Vào Học Ngay'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Họ và Tên <span className="text-red-500">*</span>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Email <span className="text-red-500">*</span>
                </label>
                {availability.checkingEmail && (
                  <span className="text-[11px] text-slate-400">Đang kiểm tra...</span>
                )}
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border rounded-xl text-sm font-medium focus:ring-2 focus:bg-white focus:outline-none dark:text-white transition-all ${
                    availability.emailAvailable === false
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                      : availability.emailAvailable === true
                      ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700/80 focus:ring-[#0071e3]'
                  }`}
                  required
                />
              </div>
              {availability.emailAvailable === false && availability.emailMessage && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                  <span className="flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {availability.emailMessage}
                  </span>
                  {availability.emailMessage.includes('đã được sử dụng') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(true);
                        setLoginData({ emailOrPhone: registerData.email.trim(), password: '' });
                      }}
                      className="text-[#0071e3] dark:text-sky-400 font-bold underline shrink-0 cursor-pointer"
                    >
                      Đăng nhập ngay →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {availability.checkingPhone
                    ? 'Đang kiểm tra SĐT...'
                    : 'Dùng để đăng nhập bằng SĐT'}
                </span>
              </div>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="0912345678 (10 chữ số)"
                  value={registerData.phoneNumber}
                  onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                  onBlur={() => {
                    const norm = normalizeVietnamPhone(registerData.phoneNumber);
                    if (norm) setRegisterData((prev) => ({ ...prev, phoneNumber: norm }));
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/70 border rounded-xl text-sm font-medium focus:ring-2 focus:bg-white focus:outline-none dark:text-white transition-all ${
                    availability.phoneAvailable === false
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                      : availability.phoneAvailable === true
                      ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700/80 focus:ring-[#0071e3]'
                  }`}
                  required
                />
              </div>
              {availability.phoneAvailable === false && availability.phoneMessage && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                  <span className="flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {availability.phoneMessage}
                  </span>
                  {availability.phoneMessage.includes('đã được đăng ký') && (
                    <button
                      type="button"
                      onClick={() => {
                        const norm = normalizeVietnamPhone(registerData.phoneNumber);
                        setIsLogin(true);
                        setLoginData({ emailOrPhone: norm || registerData.phoneNumber.trim(), password: '' });
                      }}
                      className="text-[#0071e3] dark:text-sky-400 font-bold underline shrink-0 cursor-pointer"
                    >
                      Đăng nhập SĐT này →
                    </button>
                  )}
                </div>
              )}
              {availability.phoneAvailable === true && (
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Số điện thoại hợp lệ và chưa có người đăng ký
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Mật khẩu (từ 6 ký tự) <span className="text-red-500">*</span>
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
                Xác nhận mật khẩu <span className="text-red-500">*</span>
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
              disabled={
                loading ||
                availability.emailAvailable === false ||
                availability.phoneAvailable === false
              }
              className="w-full py-3.5 mt-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang gửi đăng ký...' : 'Gửi Đăng Ký Học Viên'}
            </button>
          </form>
        )}

        {/* Footer link back to Landing Page */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0071e3] dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Khám phá lại trang chủ giới thiệu {branding.brandName}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

