import React, { useState } from 'react';
import { Sparkles, Volume2, Headphones } from 'lucide-react';
import speechService from '../../../utils/speechService';

export default function ReflexCollocationsMode({ unit, uNum }) {
  const [vocabFilter, setVocabFilter] = useState('');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Collocations chuẩn bản xứ */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-[#0071e3] shrink-0" />
              <span>💡 Cụm Từ & Collocations Chuẩn Bản Xứ — {unit.titleEn}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Học thuộc các cụm từ cố định này giúp bạn bật ra cả vế câu tự nhiên mà không cần ghép từng từ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {unit.bonus.collocations.map((col, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-sm font-bold text-[#0071e3] dark:text-sky-400">{col.en}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{col.vi}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => speechService.speak(col.en.split('/')[0].trim(), { rate: 0.92 })}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 text-[#0071e3] hover:bg-blue-50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                  title="Nghe chuẩn"
                >
                  <Volume2 size={14} />
                </button>
                <button
                  onClick={() => speechService.speak(col.en.split('/')[0].trim(), { rate: 0.68 })}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-[#0071e3] border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                  title="Nghe chậm 0.68x"
                >
                  <Headphones size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Mẫu câu giao tiếp thực tế */}
      {unit.bonus.realLifeSentences?.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            🗣️ Mẫu Câu Giao Tiếp Thực Tế Cốt Lõi Trong Chủ Đề {unit.titleVi}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unit.bonus.realLifeSentences.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{item.en}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.vi}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speechService.speak(item.en, { rate: 0.95 })}
                    className="p-2 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ed] cursor-pointer"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => speechService.speak(item.en, { rate: 0.72 })}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Nghe chậm"
                  >
                    <Headphones size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Toàn bộ Từ Vựng & Cụm Từ Trọng Tâm Của 30 Câu */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              ⭐ Toàn Bộ Từ Vựng & Cấu Trúc Trong Unit {uNum} ({unit.keyVocab.length} mục)
            </h2>
            <p className="text-xs text-slate-500">
              Mỗi từ vựng đều đi kèm câu ngữ cảnh thực tế từ 30 câu trong bài
            </p>
          </div>
          <input
            type="text"
            value={vocabFilter}
            onChange={(e) => setVocabFilter(e.target.value)}
            placeholder="Lọc nhanh từ vựng..."
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unit.keyVocab
            .filter(
              (v) =>
                !vocabFilter ||
                v.term.toLowerCase().includes(vocabFilter.toLowerCase()) ||
                v.meaning.toLowerCase().includes(vocabFilter.toLowerCase())
            )
            .map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0071e3] dark:text-sky-400">
                      {v.term}
                    </span>
                    {v.pos && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {v.pos}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      = {v.meaning}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    VD: "{v.exampleEn}"
                  </div>
                </div>

                <button
                  onClick={() => speechService.speak(v.term.split('/')[0].trim(), { rate: 0.88 })}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0071e3] hover:bg-blue-50 shrink-0 cursor-pointer"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
