import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckSquare, BookOpen, Radar, Headphones, 
  Image as ImageIcon, Volume2, ChevronDown, Sparkles 
} from 'lucide-react';
import toeicApi from '../../api/toeicApi';
import useStudyProgress from '../../hooks/useStudyProgress';
import PageLoader from '../../components/PageLoader';
import Part1View from './components/Part1View';
import Part2View from './components/Part2View';
import Part34View from './components/Part34View';
import Part5View from './components/Part5View';
import Part6View from './components/Part6View';
import Part7View from './components/Part7View';

export default function ToeicStudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
      .catch((err) => console.error("Lỗi lấy danh sách đề:", err));
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
      .catch((err) => console.error("Lỗi lấy chi tiết đề:", err))
      .finally(() => setLoading(false));
  }, [activeTestCode]);

  const handleSelectTest = (code) => {
    setActiveTestCode(code);
    setSearchParams({ test: code });
    setShowTestDropdown(false);
  };

  const tabs = [
    { id: 'p1', label: 'Part 1', icon: <ImageIcon size={15} />, count: activeTestDetail?.part1?.length || 0 },
    { id: 'p2', label: 'Part 2', icon: <Headphones size={15} />, count: activeTestDetail?.part2?.length || 0 },
    { id: 'p34', label: 'Part 3 & 4', icon: <Volume2 size={15} />, count: activeTestDetail?.part34?.reduce((sum, p) => sum + p.questions.length, 0) || 0 },
    { id: 'p5', label: 'Part 5', icon: <CheckSquare size={15} />, count: activeTestDetail?.part5?.length || 0 },
    { id: 'p6', label: 'Part 6', icon: <BookOpen size={15} />, count: activeTestDetail?.part6?.reduce((sum, p) => sum + p.questions.length, 0) || 0 },
    { id: 'p7', label: 'Part 7', icon: <Radar size={15} />, count: activeTestDetail?.part7?.reduce((sum, p) => sum + p.questions.length, 0) || 0 }
  ];

  const totalQuestionsInTest = activeTestDetail?.totalQuestions || 100;
  const progressPercent = studyProgress.getProgressPercentage(totalQuestionsInTest);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Bar: Test Selector & Real-Time Mastery Progress */}
      <div className="glass-panel p-4 md:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Test Selector Dropdown */}
        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowTestDropdown(!showTestDropdown)}
            className="w-full md:w-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              📄 {activeTestDetail?.title || activeTestCode}
            </span>
            <ChevronDown size={16} className={`transition-transform ${showTestDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTestDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTestDropdown(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-full md:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn Đề Luyện Tập</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {tests.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTest(t.testId)}
                      className={`p-3.5 cursor-pointer text-sm font-semibold transition-colors flex items-center justify-between ${
                        t.testId === activeTestCode
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{t.testId === activeTestCode && '✓ '}{t.title || t.testId}</span>
                      <span className="text-xs text-slate-400">({t.totalQuestions} câu)</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Real-time Progress Bar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Độ ghi nhớ đề này:</span>
            <span className="text-sm md:text-base font-black text-green-600 dark:text-green-400">{progressPercent}% đã nhớ</span>
          </div>
          <div className="w-28 md:w-36 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Part Tabs (Horizontal Scrollable) */}
      <nav className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activePartTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePartTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Part Content */}
      {loading ? (
        <PageLoader />
      ) : (
        <div>
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
