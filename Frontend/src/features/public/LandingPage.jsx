import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import SeoMeta from '../../components/SeoMeta';
// import LanguageSelector from '../../components/LanguageSelector';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useBrandingStore from '../../store/useBrandingStore';
import BrandLogo from '../../components/BrandLogo';
import LandingHeroStudio from './components/LandingHeroStudio';
import LandingPillars from './components/LandingPillars';
import LandingMethodology from './components/LandingMethodology';
import LandingGamification from './components/LandingGamification';
import LandingFaqCta from './components/LandingFaqCta';

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mode, toggleTheme } = useThemeStore();
  const branding = useBrandingStore((state) => state.branding);

  const handlePrimaryAction = () => {
    navigate(isAuthenticated ? '/home' : '/auth');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-[#f8fafc] dark:bg-[#060913] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-clip selection:bg-[#0071e3]/20 selection:text-[#0071e3] dark:selection:text-sky-400">
      <SeoMeta
        title={`Nền Tảng Học Tiếng Anh Giao Tiếp & Luyện Thi Đỉnh Cao | ${branding.brandName}`}
        description={`${branding.brandName} - ${branding.slogan || 'Luyện phản xạ giao tiếp 1500 câu thực chiến, 3000 từ vựng Oxford với thuật toán lặp lại ngắt quãng FSRS, Shadowing và AI giải thích chuyên sâu.'}`}
        canonicalUrl="https://vbaceenglish.com/"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              "@id": "https://vbaceenglish.com/#webapp",
              "name": branding.brandName || "VBaceEnglish",
              "url": "https://vbaceenglish.com",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "All",
              "description": branding.slogan || "Nền tảng học tiếng Anh giao tiếp & luyện thi TOEIC, THPT, IELTS và tiếng Trung thông minh với công nghệ phản xạ và FSRS.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "VND"
              }
            },
            {
              "@type": "EducationalOrganization",
              "@id": "https://vbaceenglish.com/#organization",
              "name": `${branding.brandName} by ${branding.companyName || 'Software'}`,
              "url": "https://vbaceenglish.com",
              "logo": branding.logoUrl || "https://vbaceenglish.com/favicon.svg"
            }
          ]
        }}
      />

      {/* GPU-ACCELERATED AMBIENT BACKDROP */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.16]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(0, 113, 227, 0.16) 1px, transparent 0)',
            backgroundSize: '36px 36px'
          }}
        />
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[980px] h-[520px] rounded-full bg-gradient-to-tr from-[#0071e3]/15 via-sky-400/10 to-indigo-500/10 blur-3xl will-change-transform" />
        <div className="absolute top-[38%] -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-sky-500/8 to-transparent blur-3xl will-change-transform" />
        <div className="absolute bottom-10 -left-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-[#0071e3]/8 to-transparent blur-3xl will-change-transform" />
      </div>

      {/* STICKY GLASSMORPHIC HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101e]/80 backdrop-blur-xl border-b border-slate-200/75 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
          >
            <BrandLogo size="sm" />
          </div>

          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800">
            {[
              { label: 'Trải nghiệm Live', id: 'live-studio' },
              { label: '4 Trụ cột học tập', id: 'four-pillars' },
              { label: 'Công nghệ phản xạ', id: 'signature-tech' },
              { label: 'Đấu trường XP', id: 'gamification' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800/90 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Tạm ẩn tính năng chọn ngôn ngữ hiển thị theo yêu cầu */}
            {/* <LanguageSelector compact={true} /> */}

            <button
              onClick={toggleTheme}
              aria-label="Chuyển đổi giao diện Sáng/Tối"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 transition-colors cursor-pointer shrink-0"
              title={mode === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            >
              {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePrimaryAction}
              className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs sm:text-sm font-semibold rounded-full shadow-[0_6px_20px_rgba(0,113,227,0.3)] flex items-center gap-1 sm:gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              <span>{isAuthenticated ? 'Vào phòng học' : 'Học ngay miễn phí'}</span>
              <ArrowRight size={14} className="shrink-0" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* MAIN SECTIONS */}
      <main className="flex-1 relative z-10">
        <LandingHeroStudio
          onStartLearning={handlePrimaryAction}
          scrollToSection={scrollToSection}
          isAuthenticated={isAuthenticated}
        />
        <LandingPillars
          onStartLearning={handlePrimaryAction}
          isAuthenticated={isAuthenticated}
        />
        <LandingMethodology />
        <LandingGamification />
        <LandingFaqCta
          onStartLearning={handlePrimaryAction}
          scrollToSection={scrollToSection}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </div>
  );
}
