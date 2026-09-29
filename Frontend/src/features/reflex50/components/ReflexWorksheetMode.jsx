import React, { useState, useEffect } from 'react';
import { PenTool, Layers, Check, RotateCcw, Volume2, Headphones, Square } from 'lucide-react';
import speechService from '../../../utils/speechService';
import { evaluateSentenceAttempt } from '../store/useReflex50Store';
import toast from 'react-hot-toast';

// Tạo danh sách các khối từ (word chunks) bị xáo trộn có kiểm soát để ghép câu
function buildScrambledChunks(enSentence = '', seed = 1) {
  const words = enSentence.trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  if (words.length <= 8) {
    for (let i = 0; i < words.length; i++) {
      chunks.push({ id: `c-${i}`, text: words[i] });
    }
  } else {
    let i = 0;
    let idx = 0;
    while (i < words.length) {
      const size = (i + idx + seed) % 2 === 0 && i + 1 < words.length ? 2 : 1;
      chunks.push({
        id: `c-${idx}`,
        text: words.slice(i, i + size).join(' ')
      });
      i += size;
      idx++;
    }
  }
  // Xáo trộn tất định theo seed
  const arr = [...chunks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 7 + seed * 13) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ReflexWorksheetMode({
  filteredSentences,
  unit,
  uNum,
  writingHistory,
  playbackSpeed,
  activePlayingId,
  stopAutoPlay,
  speakSentence,
  recordWritingAttempt
}) {
  const [worksheetSubMode, setWorksheetSubMode] = useState('type'); // 'type' | 'chunks'
  const [worksheetInputs, setWorksheetInputs] = useState({});
  const [worksheetResults, setWorksheetResults] = useState({});
  const [selectedChunksMap, setSelectedChunksMap] = useState({});

  // Khởi tạo dữ liệu đã làm từ trước của Unit
  useEffect(() => {
    const initialInputs = {};
    for (const s of unit.sentences) {
      if (writingHistory[s.id]?.lastInput) {
        initialInputs[s.id] = writingHistory[s.id].lastInput;
      }
    }
    setWorksheetInputs(initialInputs);
    setWorksheetResults({});
    setSelectedChunksMap({});
  }, [uNum, unit, writingHistory]);

  const handleCheckSingleWorksheet = (sentence, customText = null) => {
    const textToEvaluate = customText !== null ? customText : worksheetInputs[sentence.id] || '';
    const res = evaluateSentenceAttempt(textToEvaluate, sentence.en);
    setWorksheetResults((prev) => ({ ...prev, [sentence.id]: res }));
    recordWritingAttempt(sentence.id, textToEvaluate, res.score);
    speechService.speak(sentence.en, { rate: playbackSpeed, speakerIndex: sentence.number % 2 });
  };

  const handleCheckAllWorksheet = () => {
    const nextResults = { ...worksheetResults };
    let checkedCount = 0;
    let passCount = 0;
    for (const s of filteredSentences) {
      const val = (worksheetInputs[s.id] || '').trim();
      if (val) {
        const res = evaluateSentenceAttempt(val, s.en);
        nextResults[s.id] = res;
        recordWritingAttempt(s.id, val, res.score);
        checkedCount++;
        if (res.isPass) passCount++;
      }
    }
    setWorksheetResults(nextResults);
    if (checkedCount === 0) {
      toast('Hãy gõ ít nhất 1 câu trước khi bấm Chấm bài nhé!');
    } else {
      toast.success(`Đã chấm ${checkedCount} câu: Đạt ${passCount}/${checkedCount} câu!`);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Worksheet Mode Switcher & Batch Actions */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setWorksheetSubMode('type')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              worksheetSubMode === 'type'
                ? 'bg-[#0071e3] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <PenTool size={14} className="shrink-0" />
            <span className="sm:hidden">1. Tự Gõ Câu</span>
            <span className="hidden sm:inline">Chế độ 1: Tự Gõ Cả Câu (→ _________)</span>
          </button>

          <button
            onClick={() => setWorksheetSubMode('chunks')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              worksheetSubMode === 'chunks'
                ? 'bg-[#0071e3] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers size={14} className="shrink-0" />
            <span className="sm:hidden">2. Ghép Cụm Từ</span>
            <span className="hidden sm:inline">Chế độ 2: Ghép Khối Cụm Từ (Word Blocks)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckAllWorksheet}
            className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            <span className="sm:hidden">Chấm Tất Cả</span>
            <span className="hidden sm:inline">Chấm Tất Cả Các Câu Đã Viết</span>
          </button>

          <button
            onClick={() => {
              setWorksheetInputs({});
              setWorksheetResults({});
              setSelectedChunksMap({});
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Làm lại</span>
          </button>
        </div>
      </div>

      {/* 30 Worksheet Items */}
      <div className="space-y-3 sm:space-y-4">
        {filteredSentences.map((s) => {
          const res = worksheetResults[s.id];
          const userVal = worksheetInputs[s.id] || '';
          const scrambled = buildScrambledChunks(s.en, s.number + uNum);
          const pickedIds = selectedChunksMap[s.id] || [];

          return (
            <div
              key={s.id}
              className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 sm:space-y-3"
            >
              <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {s.number}
                    </span>
                    <span className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {s.vi}
                    </span>
                  </div>

                  {/* Hints */}
                  <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-8">
                    {s.hints.map((h, idx) => (
                      <button
                        key={idx}
                        onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.88 })}
                        className="px-2 sm:px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 hover:text-[#0071e3] cursor-pointer text-left"
                      >
                        • <strong className="text-[#0071e3] dark:text-sky-400">{h.term}</strong>
                        {h.pos ? ` (${h.pos})` : ''}: {h.meaning}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      if (activePlayingId === s.id) {
                        stopAutoPlay();
                        return;
                      }
                      speakSentence(s, playbackSpeed);
                    }}
                    className={`rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      activePlayingId === s.id
                        ? 'px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/30'
                        : 'p-2 bg-slate-100 dark:bg-slate-800 text-[#0071e3] hover:bg-blue-50'
                    }`}
                    title={activePlayingId === s.id ? 'Dừng phát ngay tại câu này' : 'Nghe gợi ý phát âm'}
                  >
                    {activePlayingId === s.id ? (
                      <>
                        <Square size={12} fill="currentColor" />
                        <span>Dừng</span>
                      </>
                    ) : (
                      <Volume2 size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => speakSentence(s, 0.7)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    title="Nghe chậm 0.7x"
                  >
                    <Headphones size={15} />
                  </button>
                </div>
              </div>

              {/* Input Area: Type or Chunks */}
              {worksheetSubMode === 'type' ? (
                <div className="pl-0 sm:pl-8 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      →
                    </span>
                    <input
                      type="text"
                      value={userVal}
                      onChange={(e) =>
                        setWorksheetInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheckSingleWorksheet(s);
                      }}
                      placeholder="Gõ câu tiếng Anh tương ứng..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>
                  <button
                    onClick={() => handleCheckSingleWorksheet(s)}
                    className="px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Kiểm tra
                  </button>
                </div>
              ) : (
                <div className="pl-0 sm:pl-8 space-y-2.5">
                  {/* Assembled line */}
                  <div className="min-h-11 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-bold mr-1">→</span>
                    {pickedIds.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        Bấm vào các khối từ bên dưới theo đúng thứ tự để ghép thành câu...
                      </span>
                    ) : (
                      pickedIds.map((cid) => {
                        const chunkObj = scrambled.find((c) => c.id === cid);
                        if (!chunkObj) return null;
                        return (
                          <button
                            key={cid}
                            onClick={() => {
                              const nextPicked = pickedIds.filter((id) => id !== cid);
                              setSelectedChunksMap((prev) => ({ ...prev, [s.id]: nextPicked }));
                              const nextSentence = nextPicked
                                .map((id) => scrambled.find((c) => c.id === id)?.text)
                                .filter(Boolean)
                                .join(' ');
                              setWorksheetInputs((prev) => ({ ...prev, [s.id]: nextSentence }));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0071e3] text-white text-xs font-semibold cursor-pointer"
                          >
                            {chunkObj.text}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Available scrambled chunks */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {scrambled.map((c) => {
                        const used = pickedIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            disabled={used}
                            onClick={() => {
                              const nextPicked = [...pickedIds, c.id];
                              setSelectedChunksMap((prev) => ({ ...prev, [s.id]: nextPicked }));
                              const nextSentence = nextPicked
                                .map((id) => scrambled.find((ch) => ch.id === id)?.text)
                                .filter(Boolean)
                                .join(' ');
                              setWorksheetInputs((prev) => ({ ...prev, [s.id]: nextSentence }));
                              if (nextPicked.length === scrambled.length) {
                                handleCheckSingleWorksheet(s, nextSentence);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              used
                                ? 'opacity-30 bg-slate-100 dark:bg-slate-800 border-slate-200'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0071e3]'
                            }`}
                          >
                            {c.text}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {pickedIds.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedChunksMap((prev) => ({ ...prev, [s.id]: [] }));
                            setWorksheetInputs((prev) => ({ ...prev, [s.id]: '' }));
                            setWorksheetResults((prev) => {
                              const next = { ...prev };
                              delete next[s.id];
                              return next;
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                      <button
                        onClick={() => handleCheckSingleWorksheet(s)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0071e3] text-white text-xs font-bold cursor-pointer"
                      >
                        Chấm điểm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluation Diff Box */}
              {res && (
                <div
                  className={`ml-0 sm:ml-8 p-3 sm:p-3.5 rounded-2xl border space-y-2 ${
                    res.isPass
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        res.isPass ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      Độ chính xác: {res.score}% — {res.feedback}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Đáp án chuẩn: <span className="text-[#0071e3] dark:text-sky-400">{s.en}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {res.wordDiffs.map((wd, idx) => (
                      <button
                        key={idx}
                        onClick={() => speechService.speak(wd.cleanWord, { rate: 0.75 })}
                        className={`px-2 py-0.5 rounded-md text-xs font-bold cursor-pointer ${
                          wd.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200 underline'
                        }`}
                        title="Bấm để nghe phát âm từ này"
                      >
                        {wd.word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
