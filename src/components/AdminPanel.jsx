import React, { useState, useRef } from 'react';
import { Save, Download, Trash2, Plus, Upload, FileJson, Copy, Check } from 'lucide-react';

export default function AdminPanel({ data, onUpdateData }) {
  const [localData, setLocalData] = useState(data);
  const [activePart, setActivePart] = useState('part5');
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'json' | 'bulk'
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [bulkJson, setBulkJson] = useState('');
  const [bulkTarget, setBulkTarget] = useState('part5');
  const [bulkStatus, setBulkStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const syncAndSave = (updated) => {
    setLocalData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    onUpdateData(updated);
  };

  // ===== BULK IMPORT =====
  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      
      // Case 1: User pasted an entire test object with part5, part6, part7, etc.
      if (parsed.part5 || parsed.part6 || parsed.part7 || parsed.part1 || parsed.part2 || parsed.part3 || parsed.part4) {
        const updated = { ...localData };
        if (parsed.testId) updated.testId = parsed.testId;
        ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'].forEach(p => {
          if (parsed[p] && Array.isArray(parsed[p])) {
            updated[p] = parsed[p];
          }
        });
        syncAndSave(updated);
        setBulkStatus({ type: 'success', msg: `Đã import toàn bộ đề! Tổng: ${Object.keys(parsed).filter(k => k.startsWith('part')).map(k => parsed[k]?.length || 0).reduce((a, b) => a + b, 0)} câu` });
        setBulkJson('');
        return;
      }

      // Case 2: User pasted an array of questions for a specific part
      if (Array.isArray(parsed)) {
        const updated = { ...localData, [bulkTarget]: parsed };
        syncAndSave(updated);
        setBulkStatus({ type: 'success', msg: `Đã import ${parsed.length} câu vào ${bulkTarget.toUpperCase()}!` });
        setBulkJson('');
        return;
      }

      setBulkStatus({ type: 'error', msg: 'JSON không hợp lệ. Cần là 1 object có part5/part6/... hoặc 1 array các câu hỏi.' });
    } catch (e) {
      setBulkStatus({ type: 'error', msg: 'Lỗi cú pháp JSON: ' + e.message });
    }
  };

  // ===== FILE UPLOAD =====
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkJson(ev.target.result);
      setBulkStatus({ type: 'info', msg: `Đã đọc file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Bấm "Import" để nhập.` });
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  // ===== FULL JSON EDIT =====
  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      syncAndSave(parsed);
      alert('Lưu JSON thành công!');
    } catch (e) {
      alert('Lỗi JSON: ' + e.message);
    }
  };

  // ===== DOWNLOAD =====
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localData.testId || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== COPY JSON =====
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(localData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ===== FORM EDITING =====
  const addEmptyItem = () => {
    const maxId = (localData[activePart] || []).reduce((max, q) => Math.max(max, q.id || 0), 0);
    const newItem = { id: maxId + 1 };
    const updated = { ...localData, [activePart]: [...(localData[activePart] || []), newItem] };
    syncAndSave(updated);
  };

  const deleteItem = (idx) => {
    if (!confirm("Xóa câu này?")) return;
    const updatedPart = [...localData[activePart]];
    updatedPart.splice(idx, 1);
    syncAndSave({ ...localData, [activePart]: updatedPart });
  };

  const updateItem = (idx, field, value) => {
    const updatedPart = [...localData[activePart]];
    if (field.startsWith('options.')) {
      const optKey = field.split('.')[1];
      updatedPart[idx] = { ...updatedPart[idx], options: { ...(updatedPart[idx].options || {}), [optKey]: value } };
    } else {
      updatedPart[idx] = { ...updatedPart[idx], [field]: value };
    }
    syncAndSave({ ...localData, [activePart]: updatedPart });
  };

  // ===== RENDER FORM FIELDS (dynamic per part) =====
  const renderFormFields = (item, idx) => {
    const commonFields = (
      <>
        <div>
          <label className="text-xs font-bold text-gray-500">ID</label>
          <input type="number" value={item.id || ''} onChange={e => updateItem(idx, 'id', Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">🔊 Audio URL</label>
          <input type="text" value={item.audioUrl || ''} onChange={e => updateItem(idx, 'audioUrl', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="https://..." />
        </div>
      </>
    );

    const trapField = (
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-amber-600">⚠️ Trap (Bẫy)</label>
        <input type="text" value={item.trap || ''} onChange={e => updateItem(idx, 'trap', e.target.value)} className="w-full border border-amber-300 bg-amber-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-amber-300 outline-none" />
      </div>
    );

    const recognitionKeyField = (
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-blue-600">🔑 Recognition Key (Câu thần chú)</label>
        <input type="text" value={item.recognitionKey || ''} onChange={e => updateItem(idx, 'recognitionKey', e.target.value)} className="w-full border border-blue-300 bg-blue-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
      </div>
    );

    const explanationField = (
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-gray-500">💡 Giải thích</label>
        <textarea value={item.explanation || ''} onChange={e => updateItem(idx, 'explanation', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 h-20 focus:ring-2 focus:ring-blue-300 outline-none" />
      </div>
    );

    switch (activePart) {
      case 'part1':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">🖼️ Image URL</label>
              <input type="text" value={item.imageUrl || ''} onChange={e => updateItem(idx, 'imageUrl', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-green-600">✅ Correct Statement</label>
              <input type="text" value={item.correctStatement || ''} onChange={e => updateItem(idx, 'correctStatement', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-green-300 outline-none" placeholder="(B) A woman is typing on a keyboard." />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Dịch</label>
              <input type="text" value={item.correctStatementVi || ''} onChange={e => updateItem(idx, 'correctStatementVi', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            {trapField}
          </>
        );

      case 'part2':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Câu hỏi (tiếng Anh)</label>
              <input type="text" value={item.questionText || ''} onChange={e => updateItem(idx, 'questionText', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Dịch câu hỏi</label>
              <input type="text" value={item.questionTextVi || ''} onChange={e => updateItem(idx, 'questionTextVi', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Đáp án đúng (A/B/C)</label>
              <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Nội dung đáp án đúng</label>
              <input type="text" value={item.correctAnswerText || ''} onChange={e => updateItem(idx, 'correctAnswerText', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            {trapField}
          </>
        );

      case 'part3':
      case 'part4':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Passage ID (để gom nhóm audio)</label>
              <input type="text" value={item.passageId || ''} onChange={e => updateItem(idx, 'passageId', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="conversation_1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Câu hỏi</label>
              <input type="text" value={item.question || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Đáp án đúng</label>
              <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Text đáp án đúng</label>
              <input type="text" value={item.correctAnswerText || ''} onChange={e => updateItem(idx, 'correctAnswerText', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-purple-600">📜 Transcript</label>
              <textarea value={item.transcript || ''} onChange={e => updateItem(idx, 'transcript', e.target.value)} className="w-full border border-purple-300 bg-purple-50 p-2 rounded-lg mt-1 h-24 focus:ring-2 focus:ring-purple-300 outline-none" />
            </div>
            {trapField}
            {recognitionKeyField}
          </>
        );

      case 'part5':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Câu hỏi (dùng ------- cho chỗ trống)</label>
              <textarea value={item.question || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 h-16 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Dịch</label>
              <input type="text" value={item.translation || ''} onChange={e => updateItem(idx, 'translation', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="col-span-2 text-xs font-bold text-gray-500 uppercase">Options</p>
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt}>
                  <label className="text-xs font-bold text-gray-500">{opt}</label>
                  <input type="text" value={item.options?.[opt] || ''} onChange={e => updateItem(idx, `options.${opt}`, e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Đáp án đúng</label>
              <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Grammar Tag</label>
              <input type="text" value={item.grammarTag || ''} onChange={e => updateItem(idx, 'grammarTag', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="Đại từ sở hữu" />
            </div>
            {recognitionKeyField}
            {explanationField}
            {trapField}
          </>
        );

      case 'part6':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Passage Title (gom nhóm)</label>
              <input type="text" value={item.passageTitle || item.passage || ''} onChange={e => updateItem(idx, 'passageTitle', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Câu hỏi / Text</label>
              <textarea value={item.question || item.text || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 h-16 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Đáp án đúng</label>
              <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Text đáp án đúng</label>
              <input type="text" value={item.correctAnswerText || ''} onChange={e => updateItem(idx, 'correctAnswerText', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            {recognitionKeyField}
            {explanationField}
          </>
        );

      case 'part7':
        return (
          <>
            {commonFields}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Passage Title (gom nhóm)</label>
              <input type="text" value={item.passageTitle || item.passage || ''} onChange={e => updateItem(idx, 'passageTitle', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">📄 Passage Text (nội dung bài đọc)</label>
              <textarea value={item.passageText || ''} onChange={e => updateItem(idx, 'passageText', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 h-32 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Câu hỏi</label>
              <textarea value={item.question || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 h-16 focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="col-span-2 text-xs font-bold text-gray-500 uppercase">Options (Part 7)</p>
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt}>
                  <label className="text-xs font-bold text-gray-500">{opt}</label>
                  <input type="text" value={item.options?.[opt] || ''} onChange={e => updateItem(idx, `options.${opt}`, e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Đáp án đúng</label>
              <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-green-600">Text đáp án</label>
              <input type="text" value={item.correctAnswerText || ''} onChange={e => updateItem(idx, 'correctAnswerText', e.target.value)} className="w-full border border-green-300 bg-green-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-green-300 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-yellow-600">🔍 Evidence In Passage (trích nguyên cụm từ bài đọc)</label>
              <input type="text" value={item.evidenceInPassage || ''} onChange={e => updateItem(idx, 'evidenceInPassage', e.target.value)} className="w-full border border-yellow-300 bg-yellow-50 p-2 rounded-lg mt-1 focus:ring-2 focus:ring-yellow-300 outline-none" />
            </div>
            {recognitionKeyField}
            {explanationField}
          </>
        );

      default:
        return commonFields;
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== TOP BAR ===== */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📝 Admin — Nhập Liệu</h2>
            <p className="text-gray-500 text-sm mt-1">Quản lý dữ liệu đề: <strong>{localData.testId}</strong></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'bulk', label: '⚡ Import nhanh', bg: 'bg-green-100 text-green-700 hover:bg-green-200' },
              { id: 'form', label: '📋 Form', bg: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
              { id: 'json', label: '{ } JSON', bg: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
            ].map(m => (
              <button key={m.id} onClick={() => setViewMode(m.id)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${viewMode === m.id ? 'ring-2 ring-offset-1 ring-blue-400' : ''} ${m.bg}`}>
                {m.label}
              </button>
            ))}
            <button onClick={handleCopy} className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition">
              {copied ? <><Check size={16} className="text-green-600" /> Đã copy!</> : <><Copy size={16} /> Copy JSON</>}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-md">
              <Download size={16} /> Tải file
            </button>
          </div>
        </div>
      </div>

      {/* ===== BULK IMPORT MODE ===== */}
      {viewMode === 'bulk' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-green-800 mb-2">⚡ Import Nhanh (Dán JSON hàng loạt)</h3>
            <p className="text-green-700 text-sm mb-4">
              Dán nguyên một khối JSON vào ô bên dưới. Hệ thống tự nhận biết:<br />
              • Nếu JSON chứa <code>part5</code>, <code>part6</code>, <code>part7</code>... → import toàn bộ đề.<br />
              • Nếu JSON là một <code>[array]</code> các câu hỏi → import vào Part đã chọn bên dưới.
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-bold text-green-800">Nếu paste array, import vào:</label>
              <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)} className="border border-green-300 rounded-lg px-3 py-2 font-bold bg-white focus:ring-2 focus:ring-green-300 outline-none">
                {['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'].map(p => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
              
              <span className="text-green-600 font-bold">hoặc</span>
              
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg font-bold hover:bg-green-100 transition">
                <Upload size={16} /> Upload file .json
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </div>

            <textarea 
              className="w-full h-64 font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-xl border-2 border-green-300 focus:ring-2 focus:ring-green-400 outline-none"
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='Dán JSON vào đây... Ví dụ:&#10;{&#10;  "testId": "READING_TEST_2",&#10;  "part5": [ { "id": 101, "question": "...", ... } ],&#10;  "part6": [ ... ],&#10;  "part7": [ ... ]&#10;}'
            ></textarea>

            {bulkStatus && (
              <div className={`mt-4 p-4 rounded-xl font-semibold ${
                bulkStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                bulkStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {bulkStatus.type === 'success' ? '✅' : bulkStatus.type === 'error' ? '❌' : 'ℹ️'} {bulkStatus.msg}
              </div>
            )}

            <button 
              onClick={handleBulkImport}
              disabled={!bulkJson.trim()}
              className="mt-4 flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileJson size={20} /> Import vào đề hiện tại
            </button>
          </div>
        </div>
      )}

      {/* ===== FULL JSON MODE ===== */}
      {viewMode === 'json' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <textarea 
            className="w-full h-[600px] font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-xl"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          ></textarea>
          <button onClick={handleSaveJson} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-md">
            <Save size={18} /> Lưu JSON
          </button>
        </div>
      )}

      {/* ===== FORM MODE ===== */}
      {viewMode === 'form' && (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-48 flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Test ID</label>
              <input type="text" value={localData.testId || ''} onChange={(e) => syncAndSave({ ...localData, testId: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg mt-1 font-bold focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            {['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'].map(part => (
              <button key={part} onClick={() => setActivePart(part)}
                className={`text-left px-4 py-3 rounded-lg font-bold transition ${activePart === part ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {part.toUpperCase()} <span className="text-xs opacity-70">({(localData[part] || []).length})</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 uppercase">{activePart}</h3>
              <button onClick={addEmptyItem} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                <Plus size={16} /> Thêm câu
              </button>
            </div>

            <div className="space-y-6">
              {(localData[activePart] || []).map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                  <button onClick={() => deleteItem(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Xóa">
                    <Trash2 size={18} />
                  </button>
                  <h4 className="font-bold text-gray-500 mb-4 pb-2 border-b text-sm">Câu #{idx + 1} — ID: {item.id}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {renderFormFields(item, idx)}
                  </div>
                </div>
              ))}
              {(localData[activePart] || []).length === 0 && (
                <div className="text-center py-16 text-gray-400 font-bold text-lg bg-white rounded-xl border border-dashed border-gray-300">
                  Chưa có câu hỏi nào. Bấm <strong>"Thêm câu"</strong> hoặc dùng <strong>"⚡ Import nhanh"</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
