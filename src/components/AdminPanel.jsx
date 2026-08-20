import React, { useState } from 'react';
import { Save, Download, Trash2, Plus } from 'lucide-react';

export default function AdminPanel({ data, onUpdateData }) {
  const [localData, setLocalData] = useState(data || { testId: 'NEW_TEST', part1: [], part2: [], part3: [], part4: [], part5: [], part6: [], part7: [] });
  const [activePart, setActivePart] = useState('part1');
  const [editingJson, setEditingJson] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(localData, null, 2));

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setLocalData(parsed);
      onUpdateData(parsed);
      setEditingJson(false);
      alert('Lưu JSON thành công!');
    } catch (e) {
      alert('Lỗi JSON: ' + e.message);
    }
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${localData.testId || 'data'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const addEmptyItem = () => {
    const newItem = { id: Date.now() }; // Tạm thời dùng timestamp làm ID
    const updatedPart = [...(localData[activePart] || []), newItem];
    const updatedData = { ...localData, [activePart]: updatedPart };
    setLocalData(updatedData);
    setJsonText(JSON.stringify(updatedData, null, 2));
    onUpdateData(updatedData);
  };

  const deleteItem = (idx) => {
    if(!confirm("Bạn có chắc muốn xóa câu này?")) return;
    const updatedPart = [...localData[activePart]];
    updatedPart.splice(idx, 1);
    const updatedData = { ...localData, [activePart]: updatedPart };
    setLocalData(updatedData);
    setJsonText(JSON.stringify(updatedData, null, 2));
    onUpdateData(updatedData);
  };

  const updateItem = (idx, field, value) => {
    const updatedPart = [...localData[activePart]];
    
    // Xử lý nested object cho options (Part 5)
    if (field.startsWith('options.')) {
      const optKey = field.split('.')[1];
      updatedPart[idx] = { 
        ...updatedPart[idx], 
        options: { ...(updatedPart[idx].options || {}), [optKey]: value } 
      };
    } 
    // Xử lý array of objects cho paraphraseMap (Part 3/4)
    else if (field === 'paraphraseMap_raw') {
      try {
        const parsed = JSON.parse(value);
        updatedPart[idx] = { ...updatedPart[idx], paraphraseMap: parsed };
      } catch(e) {
        // Chỉ lưu text raw để user edit
        updatedPart[idx] = { ...updatedPart[idx], _paraphraseMapRaw: value };
      }
    }
    else {
      updatedPart[idx] = { ...updatedPart[idx], [field]: value };
    }

    const updatedData = { ...localData, [activePart]: updatedPart };
    setLocalData(updatedData);
    setJsonText(JSON.stringify(updatedData, null, 2));
    onUpdateData(updatedData); // Auto save to localStorage
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Nhập Liệu</h2>
          <p className="text-gray-500 text-sm mt-1">Sửa trực tiếp hoặc paste file JSON của bạn vào đây.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setJsonText(JSON.stringify(localData, null, 2));
              setEditingJson(!editingJson);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            {editingJson ? 'Giao diện Form' : 'Sửa mã JSON'}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
          >
            <Download size={18} /> Tải file JSON
          </button>
        </div>
      </div>

      {editingJson ? (
        <div className="space-y-4">
          <textarea 
            className="w-full h-[600px] font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-xl"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          ></textarea>
          <button 
            onClick={handleSaveJson}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-md"
          >
            <Save size={18} /> Lưu JSON (Áp dụng)
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Menu */}
          <div className="w-full md:w-48 flex flex-col gap-2">
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Test ID</label>
              <input 
                type="text" 
                value={localData.testId || ''} 
                onChange={(e) => {
                  const updatedData = { ...localData, testId: e.target.value };
                  setLocalData(updatedData);
                  onUpdateData(updatedData);
                }}
                className="w-full border p-2 rounded mt-1 font-bold" 
              />
            </div>
            
            {['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'].map(part => (
              <button 
                key={part}
                onClick={() => setActivePart(part)}
                className={`text-left px-4 py-3 rounded-lg font-bold transition ${activePart === part ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {part.toUpperCase()} ({(localData[part] || []).length})
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 uppercase">{activePart} Editor</h3>
              <button 
                onClick={addEmptyItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              >
                <Plus size={16} /> Thêm Câu Mới
              </button>
            </div>

            <div className="space-y-8">
              {(localData[activePart] || []).map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                  <button 
                    onClick={() => deleteItem(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                    title="Xóa câu này"
                  >
                    <Trash2 size={20} />
                  </button>

                  <h4 className="font-bold text-gray-700 mb-4 pb-2 border-b">Item #{idx + 1} (ID: {item.id})</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Common Fields */}
                    <div>
                      <label className="text-xs font-bold text-gray-500">ID Câu hỏi</label>
                      <input type="number" value={item.id || ''} onChange={e => updateItem(idx, 'id', Number(e.target.value))} className="w-full border p-2 rounded mt-1" />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-gray-500">Audio URL (Link mp3, drive...)</label>
                      <input type="text" value={item.audioUrl || ''} onChange={e => updateItem(idx, 'audioUrl', e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="https://..." />
                    </div>

                    {/* Part Specific Fields - Simple dynamic rendering */}
                    {activePart === 'part1' && (
                      <>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-500">Image URL</label>
                          <input type="text" value={item.imageUrl || ''} onChange={e => updateItem(idx, 'imageUrl', e.target.value)} className="w-full border p-2 rounded mt-1" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-500">Correct Statement</label>
                          <input type="text" value={item.correctStatement || ''} onChange={e => updateItem(idx, 'correctStatement', e.target.value)} className="w-full border p-2 rounded mt-1" />
                        </div>
                      </>
                    )}

                    {(activePart === 'part2' || activePart === 'part3' || activePart === 'part4') && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500">Question Text</label>
                        <input type="text" value={item.questionText || item.question || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border p-2 rounded mt-1" />
                      </div>
                    )}

                    {(activePart === 'part5' || activePart === 'part6' || activePart === 'part7') && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500">Question / Sentence (Dùng ------- cho chỗ trống)</label>
                        <textarea value={item.question || ''} onChange={e => updateItem(idx, 'question', e.target.value)} className="w-full border p-2 rounded mt-1 h-20" />
                      </div>
                    )}
                    
                    {(activePart === 'part6' || activePart === 'part7') && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500">Passage Title (Tên đoạn văn để gộp chung)</label>
                        <input type="text" value={item.passageTitle || item.passage || ''} onChange={e => updateItem(idx, 'passageTitle', e.target.value)} className="w-full border p-2 rounded mt-1" />
                      </div>
                    )}
                    
                    {(activePart === 'part7') && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500">Passage Text (Nội dung bài đọc)</label>
                        <textarea value={item.passageText || ''} onChange={e => updateItem(idx, 'passageText', e.target.value)} className="w-full border p-2 rounded mt-1 h-32" />
                      </div>
                    )}

                    {/* All parts usually have a correct answer */}
                    <div>
                      <label className="text-xs font-bold text-gray-500">Correct Answer (A, B, C, D)</label>
                      <input type="text" value={item.correctAnswer || ''} onChange={e => updateItem(idx, 'correctAnswer', e.target.value)} className="w-full border p-2 rounded mt-1 font-bold" />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-gray-500">Correct Answer Text</label>
                      <input type="text" value={item.correctAnswerText || ''} onChange={e => updateItem(idx, 'correctAnswerText', e.target.value)} className="w-full border p-2 rounded mt-1" />
                    </div>

                    {activePart === 'part5' && (
                      <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt}>
                            <label className="text-xs font-bold text-gray-500">Option {opt}</label>
                            <input type="text" value={item.options?.[opt] || ''} onChange={e => updateItem(idx, `options.${opt}`, e.target.value)} className="w-full border p-2 rounded mt-1" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-yellow-600">Trap (Giải thích Bẫy)</label>
                      <input type="text" value={item.trap || ''} onChange={e => updateItem(idx, 'trap', e.target.value)} className="w-full border-yellow-300 p-2 rounded mt-1 bg-yellow-50" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-blue-600">Recognition Key (Câu thần chú nhận diện)</label>
                      <input type="text" value={item.recognitionKey || ''} onChange={e => updateItem(idx, 'recognitionKey', e.target.value)} className="w-full border-blue-300 p-2 rounded mt-1 bg-blue-50" />
                    </div>

                    {activePart === 'part7' && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-green-600">Evidence In Passage (Copy y nguyên cụm từ trong bài đọc làm bằng chứng)</label>
                        <input type="text" value={item.evidenceInPassage || ''} onChange={e => updateItem(idx, 'evidenceInPassage', e.target.value)} className="w-full border-green-300 p-2 rounded mt-1 bg-green-50" />
                      </div>
                    )}
                    
                    {(activePart === 'part3' || activePart === 'part4') && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-purple-600">Transcript</label>
                        <textarea value={item.transcript || ''} onChange={e => updateItem(idx, 'transcript', e.target.value)} className="w-full border-purple-300 p-2 rounded mt-1 h-24" />
                      </div>
                    )}
                    
                  </div>
                </div>
              ))}
              
              {(localData[activePart] || []).length === 0 && (
                <div className="text-center py-10 text-gray-400 font-bold">
                  Chưa có câu hỏi nào. Hãy bấm "Thêm Câu Mới".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
