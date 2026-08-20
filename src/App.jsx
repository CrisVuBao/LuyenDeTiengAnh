import { useState, useEffect } from 'react';
import Part1PhotoFlash from './components/Part1PhotoFlash';
import Part2CursorRecall from './components/Part2CursorRecall';
import ParaphraseMapper from './components/ParaphraseMapper';
import GrammarReflex from './components/GrammarReflex';
import ContextFlow from './components/ContextFlow';
import ScanningRadar from './components/ScanningRadar';
import AdminPanel from './components/AdminPanel';
import { Volume2, FileSearch, BookOpen, Radar, Edit3, Image as ImageIcon, Headphones, CheckSquare } from 'lucide-react';
import useConfidence from './hooks/useConfidence';

function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('p1');

  // Khởi tạo dữ liệu từ localStorage hoặc file JSON
  useEffect(() => {
    const localData = localStorage.getItem('toeic_hack_data');
    if (localData) {
      try {
        setData(JSON.parse(localData));
        return;
      } catch (e) {
        console.error("Lỗi parse local data", e);
      }
    }

    fetch('/data.json')
      .then(res => res.json())
      .then(jsonData => {
        setData(jsonData);
        // Lưu vào local để admin có thể sửa
        localStorage.setItem('toeic_hack_data', JSON.stringify(jsonData));
      })
      .catch(err => console.error("Lỗi khi tải data.json:", err));
  }, []);

  const { getProgress } = useConfidence(data?.testId || 'default');

  if (!data) {
    return <div className="flex justify-center items-center h-screen font-bold text-xl text-gray-500 animate-pulse">Đang nạp dữ liệu Hack-Speed...</div>;
  }

  const tabs = [
    { id: 'p1', label: 'Part 1', icon: <ImageIcon size={18} /> },
    { id: 'p2', label: 'Part 2', icon: <Headphones size={18} /> },
    { id: 'p34', label: 'Part 3&4', icon: <Volume2 size={18} /> },
    { id: 'p5', label: 'Part 5', icon: <CheckSquare size={18} /> },
    { id: 'p6', label: 'Part 6', icon: <BookOpen size={18} /> },
    { id: 'p7', label: 'Part 7', icon: <Radar size={18} /> },
    { id: 'admin', label: 'Nhập Liệu', icon: <Edit3 size={18} />, bg: 'bg-purple-600 text-white' }
  ];

  const updateData = (newData) => {
    setData(newData);
    localStorage.setItem('toeic_hack_data', JSON.stringify(newData));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TOEIC Hack-Speed
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                  {data.testId} - 3 Days Survival
                </p>
                {/* Progress bar tổng */}
                {activeTab !== 'admin' && (
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600">Đã nhớ: {getProgress()}%</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${getProgress()}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <nav className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-300
                    ${activeTab === tab.id 
                      ? (tab.bg || 'bg-blue-600 text-white shadow-md scale-105')
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        {activeTab === 'p1' && <Part1PhotoFlash data={data.part1 || []} testId={data.testId} />}
        {activeTab === 'p2' && <Part2CursorRecall data={data.part2 || []} testId={data.testId} />}
        {activeTab === 'p34' && <ParaphraseMapper data={[...(data.part3 || []), ...(data.part4 || [])]} testId={data.testId} />}
        {activeTab === 'p5' && <GrammarReflex data={data.part5 || []} testId={data.testId} />}
        {activeTab === 'p6' && <ContextFlow data={data.part6 || []} testId={data.testId} />}
        {activeTab === 'p7' && <ScanningRadar data={data.part7 || []} testId={data.testId} />}
        {activeTab === 'admin' && <AdminPanel data={data} onUpdateData={updateData} />}
      </main>
    </div>
  );
}

export default App;
