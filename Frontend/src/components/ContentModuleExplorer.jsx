import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import contentModuleApi from '../api/contentModuleApi';
import toast from 'react-hot-toast';

const CATEGORY_FILTERS = [
  { key: 'all', labelVi: 'Tất cả lộ trình', labelEn: 'All Tracks' },
  { key: 'giao-tiep', labelVi: 'Giao tiếp & Phản xạ', labelEn: 'Speaking & Reflex' },
  { key: 'thpt', labelVi: 'THPT (Lớp 10–12)', labelEn: 'High School (10-12)' },
  { key: 'chung-chi', labelVi: 'TOEIC / IELTS', labelEn: 'Certifications' },
  { key: 'tieng-trung', labelVi: 'Tiếng Trung (HSK)', labelEn: 'Chinese (HSK)' }
];

const DEFAULT_FALLBACK_MODULES = [
  {
    id: 1,
    code: 'english-communication',
    language: 'en',
    title: 'Tiếng Anh Giao Tiếp Thực Chiến',
    titleVi: 'Giáo Trình Giao Tiếp Bản Xứ 72 Bài',
    description: 'Luyện nói phản xạ theo ngữ cảnh thực tế, kỹ thuật Shadowing và nhập vai 1:1 theo kịch bản hội thoại.',
    category: 'Giao Tiếp & Phản Xạ',
    targetAudience: 'Người đi làm & Sinh viên',
    icon: 'MessageSquare',
    colorGradient: 'from-[#0071e3] to-sky-500',
    difficultyLevel: 'A2 - B2',
    estimatedLessons: 72,
    orderIndex: 1,
    isActive: true,
    isComingSoon: false,
    routePath: '/communication'
  },
  {
    id: 2,
    code: 'english-reflex50',
    language: 'en',
    title: '50 Chủ Đề Phản Xạ 3 Giây',
    titleVi: '3 Tầng Phản Xạ & 1.500 Mẫu Câu Cốt Lõi',
    description: 'Đột phá tư duy dịch ngầm sang phản xạ bật câu tiếng Anh trong 3 giây với 50 chủ đề giao tiếp đa dạng.',
    category: 'Giao Tiếp & Phản Xạ',
    targetAudience: 'Phản xạ nói – viết tức thì',
    icon: 'Zap',
    colorGradient: 'from-sky-500 to-cyan-500',
    difficultyLevel: 'A1 - C1',
    estimatedLessons: 50,
    orderIndex: 2,
    isActive: true,
    isComingSoon: false,
    routePath: '/reflex-50'
  },
  {
    id: 3,
    code: 'english-toeic',
    language: 'en',
    title: 'Luyện Thi TOEIC Cấp Tốc (Part 1 - 7)',
    titleVi: 'Bộ Đề Chuẩn ETS Mới Nhất Kèm Phân Tích Bẫy',
    description: 'Hệ thống làm bài thi TOEIC full format ETS kèm giải thích chi tiết, bẫy từ vựng và Radar dẫn chứng.',
    category: 'Chứng Chỉ Quốc Tế',
    targetAudience: 'Sinh viên & Người đi làm',
    icon: 'Award',
    colorGradient: 'from-slate-800 to-slate-950',
    difficultyLevel: '450 - 990+',
    estimatedLessons: 120,
    orderIndex: 3,
    isActive: true,
    isComingSoon: false,
    routePath: '/toeic'
  },
  {
    id: 4,
    code: 'english-ielts',
    language: 'en',
    title: 'Luyện Thi IELTS Toàn Diện',
    titleVi: 'IELTS Academic & General Training',
    description: 'Luyện 4 kỹ năng Nghe - Nói - Đọc - Viết với kho đề Cambridge IELTS cập nhật và bài mẫu Band 8.0+.',
    category: 'Chứng Chỉ Quốc Tế',
    targetAudience: 'Du học & Xét tuyển ĐH',
    icon: 'Sparkles',
    colorGradient: 'from-blue-600 to-cyan-600',
    difficultyLevel: 'Band 5.0 - 8.5',
    estimatedLessons: 80,
    orderIndex: 4,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/ielts'
  },
  {
    id: 5,
    code: 'english-grade10',
    language: 'en',
    title: 'Tiếng Anh THPT Lớp 10',
    titleVi: 'Chương Trình GDPT 2018 Lớp 10',
    description: 'Hệ thống từ vựng, ngữ pháp cốt lõi và bài tập trắc nghiệm bám sát 100% sách giáo khoa Lớp 10 mới.',
    category: 'Chương Trình THPT',
    targetAudience: 'Học sinh Lớp 10',
    icon: 'BookOpen',
    colorGradient: 'from-sky-600 to-blue-600',
    difficultyLevel: 'B1',
    estimatedLessons: 30,
    orderIndex: 5,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/grade10'
  },
  {
    id: 6,
    code: 'english-grade11',
    language: 'en',
    title: 'Tiếng Anh THPT Lớp 11',
    titleVi: 'Chương Trình GDPT 2018 Lớp 11',
    description: 'Củng cố kiến thức ngữ pháp nâng cao, đọc hiểu chuyên sâu và luyện tập phản xạ theo chủ đề Lớp 11.',
    category: 'Chương Trình THPT',
    targetAudience: 'Học sinh Lớp 11',
    icon: 'BookOpen',
    colorGradient: 'from-blue-600 to-slate-800',
    difficultyLevel: 'B1+',
    estimatedLessons: 30,
    orderIndex: 6,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/grade11'
  },
  {
    id: 7,
    code: 'english-grade12',
    language: 'en',
    title: 'Tiếng Anh Lớp 12 & THPT Quốc Gia',
    titleVi: 'Chinh Phục 9+ Điểm Thi Tốt Nghiệp & ĐH',
    description: 'Kho đề ôn thi THPT Quốc gia bám sát cấu trúc mới của Bộ GD&ĐT, mẹo giải nhanh và tổng ôn ngữ pháp.',
    category: 'Chương Trình THPT',
    targetAudience: 'Sĩ tử Lớp 12',
    icon: 'GraduationCap',
    colorGradient: 'from-amber-500 to-orange-500',
    difficultyLevel: 'B2',
    estimatedLessons: 45,
    orderIndex: 7,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/grade12'
  },
  {
    id: 8,
    code: 'chinese-hsk',
    language: 'zh',
    title: 'Tiếng Trung Giao Tiếp & HSK 1 - 4',
    titleVi: 'Phát Âm Pinyin, Hán Tự & Phản Xạ HSK',
    description: 'Nền tảng học tiếng Trung toàn diện từ Pinyin cơ bản đến hội thoại thực chiến và bộ đề HSK 1-4.',
    category: 'Ngoại Ngữ Thứ Hai',
    targetAudience: 'Người học Tiếng Trung / HSK',
    icon: 'Languages',
    colorGradient: 'from-rose-500 to-amber-500',
    difficultyLevel: 'HSK 1 - 4',
    estimatedLessons: 60,
    orderIndex: 8,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/hsk'
  }
];

export default function ContentModuleExplorer({ compact = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [modules, setModules] = useState(DEFAULT_FALLBACK_MODULES);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    let isMounted = true;
    contentModuleApi
      .getActiveModules()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setModules(res.data);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredModules = modules.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'giao-tiep') {
      return (
        m.category?.toLowerCase().includes('giao tiếp') ||
        m.code?.includes('communication') ||
        m.code?.includes('reflex') ||
        m.code?.includes('vocab')
      );
    }
    if (activeFilter === 'thpt') {
      return m.category?.toLowerCase().includes('thpt') || m.code?.includes('grade');
    }
    if (activeFilter === 'chung-chi') {
      return (
        m.category?.toLowerCase().includes('chứng chỉ') ||
        m.code?.includes('toeic') ||
        m.code?.includes('ielts')
      );
    }
    if (activeFilter === 'tieng-trung') {
      return m.language === 'zh' || m.code?.includes('chinese') || m.code?.includes('hsk');
    }
    return true;
  });

  const handleCardClick = (module) => {
    if (module.isComingSoon) {
      toast.success(
        i18n.language === 'en'
          ? `Module "${module.title}" is in active development and coming soon!`
          : `Khóa học "${module.titleVi || module.title}" đang được hoàn thiện và sẽ sớm ra mắt!`,
        { icon: '🚀' }
      );
      return;
    }

    if (module.routePath) {
      navigate(module.routePath === '/tests' ? '/toeic' : module.routePath);
    }
  };

  return (
    <section className="p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.025)] space-y-4 w-full min-w-0 max-w-full overflow-hidden">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('modules.title', 'Lộ Trình Mở Rộng & Đa Ngôn Ngữ')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                {modules.length} chuyên đề
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              Tiếng Anh Giao Tiếp, Phản Xạ 50, TOEIC, IELTS, THPT (Lớp 10–12) và Tiếng Trung HSK
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>{isExpanded ? 'Thu gọn danh mục' : 'Khám phá tất cả khóa học'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable Filter & Horizontal/Grid Cards */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 overflow-hidden pt-2 border-t border-slate-100 dark:border-slate-800/80"
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORY_FILTERS.map((cat) => {
                const isSelected = activeFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0071e3] text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {i18n.language === 'en' ? cat.labelEn : cat.labelVi}
                  </button>
                );
              })}
            </div>

            {/* Horizontal Swipe Shelf on Mobile / Compact 4-Col Grid on Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {filteredModules.map((mod) => {
                const isEn = i18n.language === 'en';
                const displayTitle = isEn ? mod.title : mod.titleVi || mod.title;

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleCardClick(mod)}
                    className={`group p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border transition-all cursor-pointer flex flex-col justify-between gap-3 hover:-translate-y-0.5 ${
                      mod.isComingSoon
                        ? 'border-slate-200/70 dark:border-slate-800 opacity-90'
                        : 'border-slate-200/85 dark:border-slate-700 hover:border-[#0071e3]/50 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                          {mod.category}
                        </span>
                        {mod.isComingSoon ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Sắp ra mắt
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-[#0071e3] dark:text-sky-400">
                            Đang mở
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                            mod.colorGradient || 'from-[#0071e3] to-sky-500'
                          } text-white flex items-center justify-center font-bold shrink-0 text-xs`}
                        >
                          {mod.language === 'zh' ? '汉' : <BookOpen size={16} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                            {displayTitle}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {mod.difficultyLevel} • {mod.estimatedLessons} bài
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 truncate max-w-[140px]">
                        {mod.targetAudience}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 shrink-0 ${
                          mod.isComingSoon
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#0071e3] dark:text-sky-400'
                        }`}
                      >
                        <span>{mod.isComingSoon ? 'Nhận tin' : 'Vào học'}</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
