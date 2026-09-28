import React, { useState, useMemo } from 'react';
import {
  Layers,
  Zap,
  Search,
  Volume2,
  Download,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import vocab3000Data from '../../../data/vocab3000Data.json';
import reflex50Data from '../../reflex50/data/reflex50Data.json';

function speakText(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore
  }
}

export default function AdminContentManager() {
  const navigate = useNavigate();
  const [moduleTab, setModuleTab] = useState('vocab'); // 'vocab' | 'reflex'
  const [selectedTopicId, setSelectedTopicId] = useState(1);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const topics = vocab3000Data.topics || [];
  const units = reflex50Data.units || [];

  const currentTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) || topics[0],
    [topics, selectedTopicId]
  );

  const currentUnit = useMemo(
    () => units.find((u) => u.unitNumber === selectedUnitNumber) || units[0],
    [units, selectedUnitNumber]
  );

  // Global search across all words or current topic words
  const displayedWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTopic?.words || [];
    const results = [];
    for (const t of topics) {
      for (const w of t.words || []) {
        if (
          w.word?.toLowerCase().includes(q) ||
          w.meaning?.toLowerCase().includes(q)
        ) {
          results.push({ ...w, topicNumber: t.topicNumber, topicTitle: t.title });
          if (results.length >= 100) break;
        }
      }
      if (results.length >= 100) break;
    }
    return results;
  }, [topics, currentTopic, searchQuery]);

  // Global search across all sentences or current unit sentences
  const displayedSentences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentUnit?.sentences || [];
    const results = [];
    for (const u of units) {
      for (const s of u.sentences || []) {
        if (
          s.en?.toLowerCase().includes(q) ||
          s.vi?.toLowerCase().includes(q)
        ) {
          results.push({ ...s, unitNumber: u.unitNumber, unitTitle: u.titleVi });
          if (results.length >= 100) break;
        }
      }
      if (results.length >= 100) break;
    }
    return results;
  }, [units, currentUnit, searchQuery]);

  const handleExportCsv = () => {
    if (moduleTab === 'vocab') {
      const headers = ['Chủ đề', 'Từ vựng', 'Từ loại', 'Phiên âm IPA', 'Nghĩa tiếng Việt'];
      const rows = displayedWords.map((w) => [
        w.topicTitle || currentTopic?.title || '',
        w.word,
        w.pos,
        w.ipa,
        w.meaning
      ]);
      const csv =
        '\uFEFF' +
        [headers, ...rows]
          .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
          .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VBace_Vocab3000_Topic${selectedTopicId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất danh sách từ vựng ra file CSV!');
    } else {
      const headers = ['Unit', 'Câu số', 'Tiếng Việt', 'Tiếng Anh', 'Cấp độ', 'Ghi chú ngữ pháp'];
      const rows = displayedSentences.map((s) => [
        s.unitTitle || currentUnit?.titleVi || `Unit ${selectedUnitNumber}`,
        s.number,
        s.vi,
        s.en,
        s.level,
        s.grammarNote
      ]);
      const csv =
        '\uFEFF' +
        [headers, ...rows]
          .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
          .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VBace_Reflex50_Unit${selectedUnitNumber}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất danh sách câu phản xạ ra file CSV!');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ===== HERO HEADER ===== */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 shadow-2xl border border-emerald-500/20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Layers size={14} />
            <span>Curriculum & Master Data Inspector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Quản Trị Học Liệu: 3000 Từ Vựng & Phản Xạ 50
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
            Tra cứu toàn văn, kiểm tra phát âm AI, rà soát cấu trúc phiên âm IPA và xuất dữ liệu của 60 chủ đề Từ vựng Oxford cùng 50 Unit Phản xạ Nói - Viết (1.500 câu).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setModuleTab('vocab')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              moduleTab === 'vocab'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Layers size={15} /> 3000 Từ Vựng (60 Chủ Đề)
          </button>

          <button
            onClick={() => setModuleTab('reflex')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              moduleTab === 'reflex'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Zap size={15} /> Phản Xạ 50 (1500 Câu)
          </button>
        </div>
      </div>

      {/* ===== SEARCH & EXPORT TOOLBAR ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              moduleTab === 'vocab'
                ? 'Tìm kiếm bất kỳ từ vựng tiếng Anh hoặc nghĩa tiếng Việt trên toàn bộ 60 chủ đề...'
                : 'Tìm kiếm câu tiếng Anh hoặc tiếng Việt trên toàn bộ 1.500 câu phản xạ...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(
                moduleTab === 'vocab'
                  ? `/vocab/${selectedTopicId}`
                  : `/reflex-50/unit/${selectedUnitNumber}`
              )
            }
            className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink size={14} /> Mở Phòng Học
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ===== MAIN 2-COLUMN EXPLORER ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Topics / Units List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs max-h-[680px] overflow-y-auto space-y-1.5">
          <p className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {moduleTab === 'vocab'
              ? `Danh Mục 60 Chủ Đề (${vocab3000Data.totalWords} từ)`
              : `Danh Mục 50 Units (${reflex50Data.totalSentences} câu)`}
          </p>

          {moduleTab === 'vocab'
            ? topics.map((t) => {
                const active = t.id === selectedTopicId && !searchQuery.trim();
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTopicId(t.id);
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-black truncate">
                        Chủ đề {t.topicNumber}: {t.title}
                      </p>
                      <p className={`text-[10px] truncate ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {t.fullTitle}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.wordCount} từ
                    </span>
                  </button>
                );
              })
            : units.map((u) => {
                const active = u.unitNumber === selectedUnitNumber && !searchQuery.trim();
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedUnitNumber(u.unitNumber);
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-black truncate">
                        Unit {u.unitNumber}: {u.titleVi}
                      </p>
                      <p className={`text-[10px] truncate ${active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {u.titleEn}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                        active
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {(u.sentences || []).length} câu
                    </span>
                  </button>
                );
              })}
        </div>

        {/* Right 8 cols: Words or Sentences Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs max-h-[680px] overflow-y-auto">
          {moduleTab === 'vocab' ? (
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {searchQuery.trim()
                      ? `Kết quả tìm kiếm "${searchQuery}" (${displayedWords.length} từ)`
                      : `Chủ đề ${currentTopic?.topicNumber}: ${currentTopic?.fullTitle}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bấm vào biểu tượng loa để kiểm tra phát âm chuẩn bản xứ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayedWords.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-emerald-400 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {w.word}
                        </p>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          {w.pos}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{w.ipa}</p>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {w.meaning}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(w.word)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50 shrink-0 cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {searchQuery.trim()
                      ? `Kết quả tìm kiếm "${searchQuery}" (${displayedSentences.length} câu)`
                      : `Unit ${currentUnit?.unitNumber}: ${currentUnit?.titleVi} (${currentUnit?.titleEn})`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    1.500 câu phản xạ nói - viết 3 giây kèm gợi ý cụm từ (Chunking)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {displayedSentences.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3 hover:border-amber-400 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                          Câu #{s.number}
                        </span>
                        <span className="text-[11px] text-slate-400">{s.grammarNote}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {s.en}
                      </p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        🇻🇳 {s.vi}
                      </p>
                      {s.hints?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {s.hints.map((h, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                            >
                              <strong>{h.term}</strong>: {h.meaning}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(s.en)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50 shrink-0 cursor-pointer"
                      title="Nghe phát âm câu"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
