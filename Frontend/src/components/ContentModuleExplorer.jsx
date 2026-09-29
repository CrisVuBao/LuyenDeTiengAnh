import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, BookOpen, GraduationCap, Globe, Clock, 
  ArrowRight, CheckCircle2, Lock, ChevronRight, Filter
} from 'lucide-react';
import contentModuleApi from '../api/contentModuleApi';
import toast from 'react-hot-toast';

const CATEGORY_FILTERS = [
  { key: 'all', labelVi: 'Tất cả lộ trình', labelEn: 'All Tracks' },
  { key: 'giao-tiep', labelVi: 'Giao tiếp & Phản xạ', labelEn: 'Speaking & Reflex' },
  { key: 'thpt', labelVi: 'Chương trình THPT (10-12)', labelEn: 'High School (10-12)' },
  { key: 'chung-chi', labelVi: 'Chứng chỉ quốc tế (TOEIC/IELTS)', labelEn: 'Certifications' },
  { key: 'tieng-trung', labelVi: 'Tiếng Trung (HSK)', labelEn: 'Chinese (HSK)' }
];

const DEFAULT_FALLBACK_MODULES = [
  {
    id: 1,
    code: 'english-communication',
    language: 'en',
    title: 'Tiếng Anh Giao Tiếp Thực Chiến',
    titleVi: 'Giáo Trình Giao Tiếp Bản Xứ 72 Bài',
    description: 'Luyện nói phản xạ theo ngữ cảnh thực tế, kỹ thuật Shadowing và nhận diện giọng nói AI theo kịch bản hội thoại.',
    category: 'Giao Tiếp & Phản Xạ',
    targetAudience: 'Người đi làm & Sinh viên',
    icon: 'MessageSquare',
    colorGradient: 'from-amber-500 to-orange-500',
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
    titleVi: '3 Tầng Phản Xạ & 1,500 Mẫu Câu Cốt Lõi',
    description: 'Đột phá tư duy dịch ngầm sang phản xạ bật câu tiếng Anh trong 3 giây với 50 chủ đề giao tiếp đa dạng.',
    category: 'Giao Tiếp & Phản Xạ',
    targetAudience: 'Mọi đối tượng muốn nói trôi chảy không ngắc ngứ',
    icon: 'Zap',
    colorGradient: 'from-blue-600 to-cyan-500',
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
    description: 'Hệ thống làm bài thi TOEIC full format ETS kèm giải thích chi tiết, bẫy từ vựng và Paraphrase Map độc quyền.',
    category: 'Chứng Chỉ Quốc Tế',
    targetAudience: 'Sinh viên tốt nghiệp & Người đi làm',
    icon: 'Award',
    colorGradient: 'from-emerald-600 to-teal-500',
    difficultyLevel: '450 - 990+',
    estimatedLessons: 120,
    orderIndex: 3,
    isActive: true,
    isComingSoon: false,
    routePath: '/tests'
  },
  {
    id: 4,
    code: 'english-ielts',
    language: 'en',
    title: 'Luyện Thi IELTS Toàn Diện',
    titleVi: 'IELTS Academic & General Training',
    description: 'Luyện 4 kỹ năng Nghe - Nói - Đọc - Viết với kho đề Cambridge IELTS cập nhật, bài mẫu Band 8.0+ và chấm điểm phát âm AI.',
    category: 'Chứng Chỉ Quốc Tế',
    targetAudience: 'Học sinh du học, xét tuyển Đại học & Định cư',
    icon: 'Sparkles',
    colorGradient: 'from-purple-600 to-pink-500',
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
    titleVi: 'Bám Sát Chương Trình GDPT 2018 (Global Success / Friends Global)',
    description: 'Hệ thống từ vựng, ngữ pháp cốt lõi và bài tập trắc nghiệm bám sát 100% sách giáo khoa Lớp 10 chương trình mới.',
    category: 'Chương Trình THPT',
    targetAudience: 'Học sinh Lớp 10 chuẩn bị thi học kỳ & ĐGNL',
    icon: 'BookOpen',
    colorGradient: 'from-indigo-600 to-blue-500',
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
    titleVi: 'Bám Sát Chương Trình GDPT 2018 Toàn Diện',
    description: 'Củng cố kiến thức ngữ pháp nâng cao, đọc hiểu chuyên sâu và luyện tập phản xạ theo chủ đề GDPT Lớp 11.',
    category: 'Chương Trình THPT',
    targetAudience: 'Học sinh Lớp 11',
    icon: 'BookOpen',
    colorGradient: 'from-sky-600 to-indigo-500',
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
    title: 'Tiếng Anh Lớp 12 & Luyện Thi Tốt Nghiệp THPT',
    titleVi: 'Chinh Phục 9+ Điểm Thi Tốt Nghiệp & Đại Học',
    description: 'Kho đề ôn thi THPT Quốc gia bám sát cấu trúc mới của Bộ GD&ĐT, mẹo giải nhanh và tổng ôn trọng điểm ngữ pháp.',
    category: 'Chương Trình THPT',
    targetAudience: 'Sĩ tử Lớp 12 chuẩn bị thi Tốt nghiệp THPT & ĐH',
    icon: 'GraduationCap',
    colorGradient: 'from-rose-600 to-red-500',
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
    titleVi: 'Học Phát Âm Pinyin, Hán Tự & Phản Xạ HSK',
    description: 'Nền tảng học tiếng Trung toàn diện từ Pinyin cơ bản đến hội thoại thực chiến và bộ đề ôn thi HSK 1-4 chuẩn quốc tế.',
    category: 'Ngoại Ngữ Thứ Hai',
    targetAudience: 'Người mới bắt đầu học tiếng Trung hoặc cần chứng chỉ HSK',
    icon: 'Languages',
    colorGradient: 'from-amber-600 to-rose-500',
    difficultyLevel: 'HSK 1 - 4',
    estimatedLessons: 60,
    orderIndex: 8,
    isActive: true,
    isComingSoon: true,
    routePath: '/modules/hsk'
  }
];

export default function ContentModuleExplorer() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [modules, setModules] = useState(DEFAULT_FALLBACK_MODULES);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    contentModuleApi.getActiveModules()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setModules(res.data);
        }
      })
      .catch((err) => {
        // Fallback gracefully without breaking UI
        console.warn('Using offline content modules fallback:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredModules = modules.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'giao-tiep') {
      return m.category?.toLowerCase().includes('giao tiếp') || m.code?.includes('communication') || m.code?.includes('reflex') || m.code?.includes('vocab');
    }
    if (activeFilter === 'thpt') {
      return m.category?.toLowerCase().includes('thpt') || m.code?.includes('grade');
    }
    if (activeFilter === 'chung-chi') {
      return m.category?.toLowerCase().includes('chứng chỉ') || m.code?.includes('toeic') || m.code?.includes('ielts');
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
      navigate(module.routePath);
    } else {
      toast.info(`Đang mở khóa học ${module.titleVi || module.title}`);
    }
  };

  return (
    <section className="space-y-6 pt-2">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-400 text-xs font-bold tracking-wide">
            <GraduationCap size={15} />
            <span>Hệ Thống Khóa Học Mở Rộng</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('modules.title', 'Hệ Thống Khóa Học Đa Ngôn Ngữ')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {t('modules.subtitle', 'Lộ trình học tập chuẩn hóa từ cơ bản đến nâng cao: Tiếng Anh THPT, Giao tiếp, TOEIC, IELTS và Tiếng Trung HSK')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 self-start md:self-auto">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = activeFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveFilter(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {i18n.language === 'en' ? cat.labelEn : cat.labelVi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Modules */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-60 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/60 dark:border-slate-800"
            />
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <AnimatePresence>
            {filteredModules.map((mod) => {
              const isEn = i18n.language === 'en';
              const displayTitle = isEn ? mod.title : (mod.titleVi || mod.title);
              const progressPct = mod.userCompletionPercentage || 0;

              return (
                <motion.div
                  key={mod.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => handleCardClick(mod)}
                  className={`group relative p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl ${
                    mod.isComingSoon 
                      ? 'border-slate-200/80 dark:border-slate-800 opacity-90' 
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-sky-500/50'
                  }`}
                >
                  {/* Top Badge & Flag */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tracking-wider">
                        {mod.category}
                      </span>
                      
                      {mod.isComingSoon ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {t('modules.comingSoon', 'Sắp ra mắt')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {mod.language === 'zh' ? '🇨🇳 ZH' : '🇬🇧 EN'}
                        </span>
                      )}
                    </div>

                    {/* Gradient Header / Icon */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${mod.colorGradient || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform`}>
                        {mod.language === 'zh' ? (
                          <span className="text-lg font-serif">汉</span>
                        ) : (
                          <BookOpen size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                          {displayTitle}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                          {mod.difficultyLevel} • {mod.estimatedLessons} {t('modules.lessons', 'bài học')}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {mod.description}
                    </p>
                  </div>

                  {/* Bottom: Progress / Action Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {progressPct > 0 ? (
                      <div className="space-y-1.5 mb-2">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">{t('modules.progress', 'Tiến độ')}</span>
                          <span className="text-blue-600 dark:text-sky-400 font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-xs font-bold pt-1">
                      <span className="text-slate-400 text-[11px] font-medium">
                        {mod.targetAudience}
                      </span>
                      <span className={`inline-flex items-center gap-1 transition-colors ${
                        mod.isComingSoon 
                          ? 'text-amber-500' 
                          : 'text-blue-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform'
                      }`}>
                        <span>{mod.isComingSoon ? 'Thông báo' : t('modules.start', 'Học ngay')}</span>
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
