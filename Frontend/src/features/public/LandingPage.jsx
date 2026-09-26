import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Headphones, MessageSquare, Layers } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col relative overflow-hidden">
      {/* Ambient Apple Breathing Orbs */}
      <motion.div
        animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-10 right-1/4 w-96 h-96 rounded-full bg-[#0071e3]/[0.06] blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0], scale: [1, 0.95, 1.07, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-sky-400/[0.06] blur-3xl"
      />

      {/* Apple-style Minimalist Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
              VBaceEnglish
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(isAuthenticated ? '/home' : '/auth')}
            className="px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-full transition-colors cursor-pointer"
          >
            {isAuthenticated ? 'Vào trang chủ' : 'Đăng nhập'}
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 max-w-5xl mx-auto px-6 py-20 md:py-28 text-center space-y-8 relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium shadow-2xs"
        >
          <Sparkles size={13} className="text-[#0071e3] dark:text-sky-400" />
          <span>Khóa học phản xạ giao tiếp Bino & Luyện đề TOEIC</span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.1] text-slate-900 dark:text-white max-w-3xl mx-auto"
        >
          Chém Tiếng Anh{' '}
          <span className="text-[#0071e3] dark:text-sky-400">
            Không Cần Động Não.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal"
        >
          Luyện phản xạ nói tiếng Anh tự nhiên qua 72 bài hội thoại đời thực của Bino, vận dụng mẫu câu tức thì và nghe thụ động liên tục ngay cả khi khóa màn hình điện thoại.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => navigate(isAuthenticated ? '/home' : '/auth')}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium text-sm rounded-full shadow-[0_6px_20px_rgba(0,113,227,0.28)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Bắt đầu học ngay</span>
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>

        {/* Apple Bento Feature Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-14 text-left"
        >
          {[
            {
              icon: MessageSquare,
              title: '72 Bài hội thoại & Vận dụng mẫu câu',
              desc: 'Học trọn vẹn 12 chương sách Bino với tính năng Substitution Drilling giúp biến hóa 1 câu gốc thành hàng chục câu giao tiếp thực tế.'
            },
            {
              icon: Headphones,
              title: 'Nghe thụ động khi tắt màn hình',
              desc: 'Trình phát âm thanh duy trì xuyên suốt khi chuyển trang và tiếp tục đọc hội thoại ngay cả khi bạn khóa màn hình điện thoại.'
            },
            {
              icon: Layers,
              title: 'Flashcard SRS & Luyện đề TOEIC',
              desc: 'Lưu từ vựng vào bộ thẻ nhớ ngắt quãng SM-2 chỉ với một chạm và kết hợp luyện đề TOEIC chuẩn cấu trúc ETS.'
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_14px_30px_rgb(0,113,227,0.07)] space-y-3 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 group-hover:bg-[#0071e3] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 relative z-10">
        © 2026 VBaceEnglish. Thiết kế tối giản, hiện đại.
      </footer>
    </div>
  );
}
