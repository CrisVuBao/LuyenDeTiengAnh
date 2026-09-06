import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Brain, Shield, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-hidden">
      
      {/* Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={22} />
          </div>
          <span className="font-black text-xl tracking-tight text-gradient">VBaceEnglish</span>
        </div>

        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          {isAuthenticated ? 'Vào Dashboard' : 'Đăng Nhập'}
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
          <Zap size={14} className="text-amber-500" /> Phương pháp Luyện Thi Siêu Tốc 3 Ngày
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Luyện Đề TOEIC Phản Xạ Cực Đại <br />
          <span className="text-gradient">Thuộc Lòng Đáp Án & Bẫy</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Áp dụng phương pháp Active Recall, Spaced Repetition và Chanting Mode kết hợp trợ lý AI để ghi nhớ vĩnh viễn dấu hiệu nhận biết, từ vựng và bẫy đề thi ETS chỉ trong 72 giờ.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-95"
          >
            Bắt Đầu Học Ngay <ArrowRight size={18} />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Brain size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Recall & Lật Thẻ</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Buộc não bộ phải tự tìm lại thông tin trước khi mở đáp án, nhân 3 tốc độ ghi nhớ ngữ pháp Part 5.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Gemini AI Tutor 24/7</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Giải thích cặn kẽ từng bẫy câu hỏi khó, phân tích cấu trúc ngữ pháp và điểm nhận biết trong nháy mắt.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Đồng Bộ Mọi Thiết Bị</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Dữ liệu học tập được lưu trữ an toàn trên SQL Server, học trên điện thoại hoặc máy tính đều giữ nguyên tiến độ.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400">
        © 2026 VBaceEnglish. Nền tảng học tiếng Anh chuẩn quốc tế & React 19.
      </footer>

    </div>
  );
}
