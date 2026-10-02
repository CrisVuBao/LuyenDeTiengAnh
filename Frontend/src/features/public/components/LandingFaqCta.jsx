import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';
import useBrandingStore from '../../../store/useBrandingStore';

const FAQ_ITEMS = [
  {
    q: 'Mình mất gốc hoặc biết từ vựng nhưng không phản xạ nói được thì nên bắt đầu từ đâu?',
    a: 'Bạn nên bắt đầu ngay với Trụ cột 1 (Giáo trình 72 Bài Hội Thoại Thực Chiến) kết hợp Trụ cột 2 (Phản xạ 3 giây). Mỗi ngày chỉ cần nghe thụ động 1 bài hội thoại thực tế và luyện bật câu trong 3 giây với 15–20 câu thông dụng, não bộ sẽ hình thành phản xạ nói tự nhiên mà không cần ghép ngữ pháp phức tạp.'
  },
  {
    q: 'Tính năng "Nghe thụ động khi tắt màn hình" hoạt động như thế nào?',
    a: 'VBaceEnglish tích hợp công nghệ Media Session API hiện đại. Khi bạn bật chế độ Nghe Thụ Động trong Giáo trình 72 Hội Thoại, hệ thống sẽ tự động đọc tuần tự câu tiếng Anh và nghĩa tiếng Việt, tự chuyển câu tiếp theo ngay cả khi bạn chuyển sang ứng dụng khác hoặc khóa màn hình điện thoại bỏ vào túi.'
  },
  {
    q: 'Phương pháp Substitution Drilling (Biến hóa mẫu câu) có tác dụng gì?',
    a: 'Thay vì học thuộc lòng 1 câu cố định, hệ thống giữ nguyên khung cấu trúc câu chuẩn của người bản xứ và cho phép bạn thay thế các cụm từ (danh từ, động từ, hoàn cảnh). Nhờ đó, học 1 câu bạn có thể tự tin nói được 10–20 câu khác nhau trong đời thực.'
  },
  {
    q: 'Hệ thống Gamification (Streak, XP, Nhiệm vụ ngày) giúp ích gì cho việc học?',
    a: 'Kẻ thù lớn nhất của việc học tiếng Anh là sự bỏ cuộc giữa chừng. Hệ thống Chuỗi ngày học (Streak), Lá chắn bảo vệ chuỗi, các mốc Cấp độ vinh danh, 4 Nhiệm vụ hàng ngày và Bảng xếp hạng Tuần sẽ biến mỗi buổi học 15 phút thành một thói quen gây nghiện đầy hứng khởi.'
  }
];

export default function LandingFaqCta({ onStartLearning, scrollToSection, isAuthenticated }) {
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const branding = useBrandingStore((s) => s.branding);

  return (
    <>
      {/* SECTION: FREQUENTLY ASKED QUESTIONS */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Giải đáp chi tiết về phương pháp học và các tính năng trên VBaceEnglish
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0071e3]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/70 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION: HIGH-CONVERSION FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-16 sm:pb-20 pt-4 sm:pt-8">
        <div className="rounded-[24px] sm:rounded-[32px] bg-gradient-to-r from-[#0071e3] via-sky-600 to-indigo-700 text-white p-6 sm:p-12 lg:p-14 shadow-[0_24px_60px_-15px_rgba(0,113,227,0.45)] relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] sm:text-xs font-bold text-center">
              <Sparkles size={14} className="shrink-0" />
              <span>Sẵn sàng nâng cấp phản xạ tiếng Anh của bạn ngay hôm nay?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Bắt Đầu Hành Trình Bật Tiếng Anh Tự Nhiên Cùng VBaceEnglish
            </h2>
            <p className="text-xs sm:text-base text-sky-100 leading-relaxed max-w-2xl mx-auto">
              Trải nghiệm đầy đủ 72 bài hội thoại Giao Tiếp Thực Chiến, 1.500 câu Phản xạ Nói - Viết, 60 chủ đề từ vựng Oxford 3D và Phòng luyện đề TOEIC.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartLearning}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-[#0071e3] hover:bg-sky-50 font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isAuthenticated ? 'Vào Trang Chủ Học Tập' : 'Tạo Tài Khoản & Học Ngay'}</span>
                <ArrowRight size={18} className="shrink-0" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#080c17] py-8 sm:py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          <BrandLogo size="md" />

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button onClick={() => scrollToSection('live-studio')} className="hover:text-[#0071e3] cursor-pointer">
              Trải nghiệm trực tiếp
            </button>
            <button onClick={() => scrollToSection('four-pillars')} className="hover:text-[#0071e3] cursor-pointer">
              4 Trụ cột học tập
            </button>
            <button onClick={() => scrollToSection('signature-tech')} className="hover:text-[#0071e3] cursor-pointer">
              Công nghệ phản xạ
            </button>
            <button onClick={() => scrollToSection('gamification')} className="hover:text-[#0071e3] cursor-pointer">
              Gamification
            </button>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 text-center sm:text-right space-y-1">
            <p>{branding.copyright || `© ${new Date().getFullYear()} ${branding.brandName}. Thiết kế đột phá & tối ưu hiệu năng.`}</p>
            {(branding.supportEmail || branding.hotline) && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-center sm:justify-end gap-x-2 gap-y-1">
                {branding.supportEmail && <span>Hỗ trợ: <a href={`mailto:${branding.supportEmail}`} className="underline hover:text-blue-500">{branding.supportEmail}</a></span>}
                {branding.supportEmail && branding.hotline && <span className="hidden sm:inline">•</span>}
                {branding.hotline && <span>Hotline: <a href={`tel:${branding.hotline}`} className="underline hover:text-blue-500">{branding.hotline}</a></span>}
              </p>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
