import { useState, useEffect } from 'react';
import Part1PhotoFlash from './components/Part1PhotoFlash';
import Part2CursorRecall from './components/Part2CursorRecall';
import ParaphraseMapper from './components/ParaphraseMapper';
import GrammarReflex from './components/GrammarReflex';
import ContextFlow from './components/ContextFlow';
import ScanningRadar from './components/ScanningRadar';
import AdminPanel from './components/AdminPanel';
import useConfidence from './hooks/useConfidence';
import { 
  Image as ImageIcon, Headphones, Volume2, CheckSquare, 
  BookOpen, Radar, Edit3, ChevronDown, Plus, Trash2 
} from 'lucide-react';

const STORAGE_KEY = 'toeic_hack_tests';

function App() {
  // --- Multi-test state ---
  const [tests, setTests] = useState([]);           // Array of test objects
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('p5');
  const [showTestMenu, setShowTestMenu] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // 1. Fetch data.json first to ensure we have the latest master tests
    fetch('/data.json')
      .then(res => res.json())
      .then(jsonData => {
        const serverTests = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        // 2. Read local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        let localTests = [];
        if (saved) {
          try {
            localTests = JSON.parse(saved);
            if (!Array.isArray(localTests)) localTests = [];
          } catch (e) { localTests = []; }
        }

        // 3. Merge strategy: serverTests take precedence for matching testIds, 
        // localTests are kept if they don't exist on server (custom created on device)
        const mergedMap = new Map();
        
        // Add local tests first
        localTests.forEach(t => {
          if (t && t.testId) mergedMap.set(t.testId, t);
        });

        // Overwrite/Add server tests (Server is source of truth for hardcoded tests)
        serverTests.forEach(t => {
          if (t && t.testId) mergedMap.set(t.testId, t);
        });

        const mergedTests = Array.from(mergedMap.values());
        
        if (mergedTests.length === 0) {
          const emptyTest = { testId: 'ĐỀ_1', part1: [], part2: [], part3: [], part4: [], part5: [], part6: [], part7: [] };
          mergedTests.push(emptyTest);
        }

        setTests(mergedTests);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedTests));
      })
      .catch((e) => {
        console.error("Lỗi fetch data.json", e);
        // Fallback to local storage only
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTests(parsed);
              return;
            }
          } catch (err) {}
        }
        const emptyTest = { testId: 'ĐỀ_1', part1: [], part2: [], part3: [], part4: [], part5: [], part6: [], part7: [] };
        setTests([emptyTest]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([emptyTest]));
      });
  }, []);

  const activeTest = tests[activeTestIdx] || null;
  const testId = activeTest?.testId || 'default';
  const { getProgressOutOfTotal } = useConfidence(testId);

  // Tính tổng số câu hỏi của đề hiện tại
  const totalQuestions = activeTest ? (
    (activeTest.part1?.length || 0) + 
    (activeTest.part2?.length || 0) + 
    (activeTest.part3?.length || 0) + 
    (activeTest.part4?.length || 0) + 
    (activeTest.part5?.length || 0) + 
    (activeTest.part6?.length || 0) + 
    (activeTest.part7?.length || 0)
  ) : 0;
  
  const currentProgress = getProgressOutOfTotal(totalQuestions);

  // --- Persist helper ---
  const persistTests = (newTests) => {
    setTests(newTests);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTests));
  };

  const updateActiveTest = (updatedTest) => {
    const newTests = [...tests];
    newTests[activeTestIdx] = updatedTest;
    persistTests(newTests);
  };

  const addNewTest = () => {
    const num = tests.length + 1;
    const newTest = { testId: `ĐỀ_${num}`, part1: [], part2: [], part3: [], part4: [], part5: [], part6: [], part7: [] };
    const newTests = [...tests, newTest];
    persistTests(newTests);
    setActiveTestIdx(newTests.length - 1);
    setShowTestMenu(false);
  };

  const deleteTest = (idx) => {
    if (tests.length <= 1) return alert('Phải có ít nhất 1 đề!');
    if (!confirm(`Xóa đề "${tests[idx].testId}"?`)) return;
    const newTests = tests.filter((_, i) => i !== idx);
    persistTests(newTests);
    if (activeTestIdx >= newTests.length) setActiveTestIdx(newTests.length - 1);
    setShowTestMenu(false);
  };

  // --- Tab config ---
  const tabs = [
    { id: 'p1', label: 'Part 1', icon: <ImageIcon size={16} />, color: 'blue' },
    { id: 'p2', label: 'Part 2', icon: <Headphones size={16} />, color: 'blue' },
    { id: 'p34', label: 'Part 3 & 4', icon: <Volume2 size={16} />, color: 'teal' },
    { id: 'p5', label: 'Part 5', icon: <CheckSquare size={16} />, color: 'green' },
    { id: 'p6', label: 'Part 6', icon: <BookOpen size={16} />, color: 'green' },
    { id: 'p7', label: 'Part 7', icon: <Radar size={16} />, color: 'green' }
  ];

  if (!activeTest) {
    return <div className="flex justify-center items-center h-screen font-bold text-xl text-gray-500 animate-pulse">Đang nạp dữ liệu Hack-Speed...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* ===== HEADER ===== */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Row 1: Logo + Test Selector + Progress + Admin */}
          <div className="flex flex-wrap items-center justify-between py-3 border-b border-gray-100 gap-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                TOEIC Hack-Speed
              </h1>
              
              {/* Test selector dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowTestMenu(!showTestMenu)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-gray-800 text-sm md:text-base transition-colors"
                >
                  📄 {activeTest.testId}
                  <ChevronDown size={16} className={`transition-transform ${showTestMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showTestMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTestMenu(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-bold text-gray-500 uppercase px-2">Chọn đề thi</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {tests.map((t, i) => (
                          <div 
                            key={i}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                              i === activeTestIdx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span 
                              className="flex-1 font-semibold"
                              onClick={() => { setActiveTestIdx(i); setShowTestMenu(false); }}
                            >
                              {i === activeTestIdx && '✅ '}{t.testId}
                              <span className="text-xs text-gray-400 ml-2">
                                ({(t.part1?.length || 0) + (t.part2?.length || 0) + (t.part3?.length || 0) + (t.part4?.length || 0) + (t.part5?.length || 0) + (t.part6?.length || 0) + (t.part7?.length || 0)} câu)
                              </span>
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteTest(i); }}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Xóa đề này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={addNewTest}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold border-t border-gray-200 transition-colors"
                      >
                        <Plus size={16} /> Tạo đề mới
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress & Admin Button */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {activeTab !== 'admin' && (
                <div className="flex items-center gap-2 md:gap-3" title={`${currentProgress}% of all questions in this test`}>
                  <span className="text-sm font-bold text-green-600 whitespace-nowrap">{currentProgress}% đã nhớ</span>
                  <div className="w-20 md:w-28 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${currentProgress}%` }}></div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === 'admin' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <Edit3 size={16} /> <span className="hidden sm:inline">Nhập Liệu</span>
              </button>
            </div>
          </div>

          {/* Row 2: Part tabs — NO scrolling, wrapped naturally */}
          <nav className="flex flex-wrap gap-1.5 py-2.5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              let activeClass = '';
              if (isActive) {
                if (tab.color === 'purple') activeClass = 'bg-purple-600 text-white shadow-md';
                else if (tab.color === 'teal') activeClass = 'bg-teal-600 text-white shadow-md';
                else if (tab.color === 'green') activeClass = 'bg-emerald-600 text-white shadow-md';
                else activeClass = 'bg-blue-600 text-white shadow-md';
              }

              // Count items for this tab
              let count = 0;
              if (tab.id === 'p1') count = activeTest.part1?.length || 0;
              else if (tab.id === 'p2') count = activeTest.part2?.length || 0;
              else if (tab.id === 'p34') count = (activeTest.part3?.length || 0) + (activeTest.part4?.length || 0);
              else if (tab.id === 'p5') count = activeTest.part5?.length || 0;
              else if (tab.id === 'p6') count = activeTest.part6?.length || 0;
              else if (tab.id === 'p7') count = activeTest.part7?.length || 0;

              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all duration-200
                    ${isActive ? activeClass : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {tab.icon} {tab.label}
                  {tab.id !== 'admin' && count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        {activeTab === 'p1' && <Part1PhotoFlash data={activeTest.part1 || []} testId={testId} />}
        {activeTab === 'p2' && <Part2CursorRecall data={activeTest.part2 || []} testId={testId} />}
        {activeTab === 'p34' && <ParaphraseMapper data={[...(activeTest.part3 || []), ...(activeTest.part4 || [])]} testId={testId} />}
        {activeTab === 'p5' && <GrammarReflex data={activeTest.part5 || []} testId={testId} />}
        {activeTab === 'p6' && <ContextFlow data={activeTest.part6 || []} testId={testId} />}
        {activeTab === 'p7' && <ScanningRadar data={activeTest.part7 || []} testId={testId} />}
        {activeTab === 'admin' && <AdminPanel data={activeTest} onUpdateData={updateActiveTest} />}
      </main>
    </div>
  );
}

export default App;
