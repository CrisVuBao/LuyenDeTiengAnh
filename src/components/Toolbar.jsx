import React from 'react';
import { Shuffle, Filter, RotateCcw } from 'lucide-react';

export default function Toolbar({ onShuffle, filterUnsure, setFilterUnsure, onReset }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <button 
        onClick={onShuffle}
        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl font-bold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Shuffle size={18} className="text-blue-500" /> 
        <span className="hidden sm:inline">Xáo trộn</span>
      </button>
      
      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2.5 rounded-xl font-bold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all">
        <Filter size={18} className={filterUnsure ? "text-orange-500" : "text-gray-400"} />
        <span className={filterUnsure ? "text-orange-600" : ""}>Chỉ câu "Chưa chắc"</span>
        <input 
          type="checkbox" 
          className="hidden" 
          checked={filterUnsure} 
          onChange={(e) => setFilterUnsure(e.target.checked)} 
        />
      </label>

      {onReset && (
        <button 
          onClick={() => {
            if(confirm('Bạn có chắc muốn xóa lịch sử làm bài (ẩn đáp án, bỏ chọn) của phần này?')) {
              onReset();
            }
          }}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl font-bold text-red-600 shadow-sm border border-red-200 active:scale-95 transition-all ml-auto"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Làm lại từ đầu</span>
        </button>
      )}
    </div>
  );
}
