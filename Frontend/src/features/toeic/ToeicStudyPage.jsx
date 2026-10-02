import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckSquare, BookOpen, Radar, Headphones, 
  Image as ImageIcon, Volume2, ChevronDown, Sparkles,
  FileCheck2, Award, ArrowLeft, CheckCircle2, Layers
} from 'lucide-react';
import toeicApi from '../../api/toeicApi';
import useStudyProgress from '../../hooks/useStudyProgress';
import Part1View from './components/Part1View';
import Part2View from './components/Part2View';
import Part34View from './components/Part34View';
import Part5View from './components/Part5View';
import Part6View from './components/Part6View';
import Part7View from './components/Part7View';
import SeoMeta from '../../components/SeoMeta';

export default function ToeicStudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const cachedAllTests = toeicApi.peekAllTests() || [];
  const initialCode = searchParams.get('test') || cachedAllTests[0]?.testId || 'READING_TEST_1';
  const cachedDetail = toeicApi.peekTestByCode(initialCode) || null;

  const [tests, setTests] = useState(cachedAllTests);
  const [activeTestCode, setActiveTestCode] = useState(initialCode);
  const [activeTestDetail, setActiveTestDetail] = useState(cachedDetail);
  const [activePartTab, setActivePartTab] = useState('p5');
  const [loading, setLoading] = useState(!cachedDetail);
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  // Hook for user study progress on the active test
  const studyProgress = useStudyProgress(activeTestDetail?.id);

  // 1. Fetch all tests list
  useEffect(() => {
    toeicApi.getAllTests()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setTests(res.data);
          const currentCode = searchParams.get('test') || res.data[0].testId;
          setActiveTestCode(currentCode);
        }
      })
      .catch((err) => console.error('Lỗi lấy danh sách đề:', err));
  }, [searchParams]);

  // 2. Fetch active test details by code
  useEffect(() => {
    if (!activeTestCode) return;
    const cached = toeicApi.peekTestByCode(activeTestCode);
    if (cached) {
      setActiveTestDetail(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    toeicApi.getTestByCode(activeTestCode)
      .then((res) => {
        if (res?.data) {
          setActiveTestDetail(res.data);
        }
      })
      .catch((err) => console.error('Lỗi lấy chi tiết đề:', err))
      .finally(() => setLoading(false));
  }, [activeTestCode]);

  const handleSelectTest = (code) => {
    setActiveTestCode(code);
    setSearchParams({ test: code });
    setShowTestDropdown(false);
  };

  const tabs = [
    { id: 'p1', label: 'Part 1', sub: 'Tranh tả', group: 'Listening', icon: ImageIcon, count: activeTestDetail?.part1?.length || 0 },
    { id: 'p2', label: 'Part 2', sub: 'Hỏi đáp', group: 'Listening', icon: Headphones, count: activeTestDetail?.part2?.length || 0 },
    { id: 'p34', label: 'Part 3 & 4', sub: 'Hội thoại', group: 'Listening', icon: Volume2, count: activeTestDetail?.part34?.reduce((sum, p) => sum + p.questions.length, 0) || 0 },
    { id: 'p5', label: 'Part 5', sub: 'Điền câu', group: 'Reading', icon: CheckSquare, count: activeTestDetail?.part5?.length || 0 },
    { id: 'p6', label: 'Part 6', sub: 'Điền đoạn', group: 'Reading', icon: BookOpen, count: activeTestDetail?.part6?.reduce((sum, p) => sum + p.questions.length, 0) || 0 },
    { id: 'p7', label: 'Part 7', sub: 'Đọc hiểu', group: 'Reading', icon: Radar, count: activeTestDetail?.part7?.reduce((sum, p) => sum + p.questions.length, 0) || 0 }
  ];

  const totalQuestionsInTest = activeTestDetail?.totalQuestions || 100;
  const progressPercent = studyProgress.getProgressPercentage(totalQuestionsInTest);
  const confidentCount = Math.round((progressPercent / 100) * totalQuestionsInTest);

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-5 sm:space-y-7 pb-24 md:pb-16 animate-fade-in">
      <SeoMeta
        title={`Luyện Thi Đề ${activeTestDetail?.title || activeTestCode} — TOEIC Studio`}
        description="Luyện giải đề thi TOEIC chuẩn ETS đầy đủ Part 1 - 7 với lời giải chi tiết, dấu hiệu nhận biết 3 giây, Radar dẫn chứng và trợ lý AI Tutor."
      />

      {/* ===================================================================== */}
      {/* 1. APPLE FLAGSHIP ETS TOEIC STUDIO HERO HEADER                        */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.03)] w-full min-w-0 max-w-full">
        {/* Specular Top Hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/45 to-transparent" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0071e3]/[0.05] blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
          {/* Left: Studio Branding & Active Test Title */}
          <div className="space-y-2.5 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/home')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Trang chủ</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 text-[11px] font-extrabold border border-[#0071e3]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                <span>ETS TOEIC® STUDIO • PART 1 – 7</span>
              </div>

              {/* <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/25">
                <Sparkles size={12} className="text-amber-500" />
                <span>Hỗ trợ AI Tutor & Radar Dẫn Chứng</span>
              </div> */}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {activeTestDetail?.title || activeTestCode}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Luyện phản xạ giải đề chuẩn cấu trúc ETS Quốc tế: Nắm bắt từ khóa nhận diện trong 3 giây, phân tích bẫy ngữ pháp và đánh dấu độ tự tin trên từng câu hỏi.
            </p>
          </div>

          {/* Right: Test Selector Dropdown & Mastery Progress HUD */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 sm:gap-3.5 shrink-0 min-w-0">
            {/* Test Selector Pill */}
            <div className="relative w-full sm:w-auto min-w-0">
              <button
                onClick={() => setShowTestDropdown(!showTestDropdown)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer min-w-0"
              >
                <span className="flex items-center gap-2 truncate min-w-0">
                  <FileCheck2 size={15} className="text-sky-400 dark:text-[#0071e3] shrink-0" />
                  <span className="truncate">Đổi bộ đề: {activeTestDetail?.title || activeTestCode}</span>
                </span>
                <ChevronDown size={15} className={`transition-transform duration-200 shrink-0 ${showTestDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTestDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTestDropdown(false)} />
                  <div className="absolute top-full right-0 left-0 sm:left-auto mt-2 w-full sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Danh sách bộ đề ETS
                      </span>
                      <span className="text-[11px] font-bold text-[#0071e3] dark:text-sky-400">
                        {tests.length} bộ đề
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {tests.map((t) => {
                        const isSelected = t.testId === activeTestCode;
                        return (
                          <div
                            key={t.id || t.testId}
                            onClick={() => handleSelectTest(t.testId)}
                            className={`px-4 py-3 cursor-pointer text-xs sm:text-sm font-bold transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isSelected ? (
                                <CheckCircle2 size={15} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                              ) : (
                                <Layers size={14} className="text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{t.title || t.testId}</span>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {t.totalQuestions} câu
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Real-time Mastery HUD Card */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-400 flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
              <div className="flex-1 sm:min-w-[140px] min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">Đã nắm chắc:</span>
                  <span className="font-extrabold text-[#0071e3] dark:text-sky-400 shrink-0">
                    {confidentCount}/{totalQuestionsInTest} câu ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STICKY APPLE SEGMENTED PART NAVIGATOR (PART 1 -> PART 7)           */}
      {/* ===================================================================== */}
      <div className="sticky top-14 sm:top-16 z-30 w-full min-w-0 max-w-full py-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
        <nav
          className="flex items-center overflow-x-auto gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-xs no-scrollbar w-full max-w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const isActive = activePartTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePartTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="toeicPartActivePill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-[#0071e3] shadow-[0_4px_14px_rgba(0,113,227,0.28)]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <TabIcon size={15} />
                  <span>{tab.label}</span>
                  <span className={`hidden md:inline text-[11px] font-medium ${isActive ? 'text-white/85' : 'text-slate-400'}`}>
                    • {tab.sub}
                  </span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===================================================================== */}
      {/* 3. PART STUDY WORKSPACE (PROGRESSIVE SKELETON WHEN LOADING)           */}
      {/* ===================================================================== */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-pulse"
            >
              <div className="h-5 w-3/4 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          {activePartTab === 'p1' && (
            <Part1View questions={activeTestDetail?.part1 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
          {activePartTab === 'p2' && (
            <Part2View questions={activeTestDetail?.part2 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
          {activePartTab === 'p34' && (
            <Part34View passages={activeTestDetail?.part34 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
          {activePartTab === 'p5' && (
            <Part5View questions={activeTestDetail?.part5 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
          {activePartTab === 'p6' && (
            <Part6View passages={activeTestDetail?.part6 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
          {activePartTab === 'p7' && (
            <Part7View passages={activeTestDetail?.part7 || []} testId={activeTestDetail?.id} studyProgress={studyProgress} />
          )}
        </div>
      )}
    </div>
  );
}
