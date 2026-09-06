import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Plus, Upload, Trash2, FileJson, 
  CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toeicApi from '../../../api/toeicApi';
import toast from 'react-hot-toast';

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchTests = () => {
    toeicApi.getAllTests()
      .then((res) => {
        if (res?.data) setTests(res.data);
      })
      .catch((err) => console.error('Lỗi lấy danh sách đề:', err));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkJson(ev.target.result);
      setStatusMsg({ 
        type: 'info', 
        text: `Đã nạp file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Bấm "Lưu Vào Database" để hoàn tất.` 
      });
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleImport = async () => {
    if (!bulkJson.trim()) {
      toast.error('Vui lòng dán JSON hoặc chọn file JSON');
      return;
    }

    try {
      setLoading(true);
      JSON.parse(bulkJson); // Validate syntax

      const res = await toeicApi.bulkImport(bulkJson);
      toast.success(res.message || 'Import đề thi thành công vào Database!');
      setBulkJson('');
      setStatusMsg({ type: 'success', text: res.message });
      fetchTests();
      setShowImportModal(false);
    } catch (err) {
      toast.error('Lỗi import: ' + err.message);
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (id, testId) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi "${testId}" khỏi Database? Thao tác này không thể hoàn tác!`)) {
      return;
    }

    try {
      await toeicApi.deleteTest(id);
      toast.success(`Đã xóa đề "${testId}"`);
      fetchTests();
    } catch (err) {
      toast.error('Lỗi khi xóa đề: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Quản Trị Kho Đề
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Quản Lý Đề Thi TOEIC
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh sách đề thi trong Microsoft SQL Server và công cụ nạp thêm đề mới
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
          >
            <Plus size={16} /> Import Đề Mới (JSON)
          </button>
          <button
            onClick={fetchTests}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div 
            key={test.id} 
            className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                  {test.testId}
                </span>
                <button
                  onClick={() => handleDeleteTest(test.id, test.testId)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  title="Xóa đề này"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {test.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {test.description || 'Bộ đề luyện thi chuẩn format TOEIC mới nhất với đầy đủ dẫn chứng và giải thích.'}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Số câu hỏi: <strong className="text-green-600 dark:text-green-400 font-bold">{test.totalQuestions} câu</strong></span>
                <span>{new Date(test.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => navigate('/toeic')}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Eye size={15} /> Kiểm tra đề thi
              </button>
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div className="col-span-full text-center py-16 glass-card rounded-3xl text-slate-400 text-sm">
            Chưa có đề thi nào trong cơ sở dữ liệu. Hãy bấm "Import Đề Mới (JSON)" để nạp đề.
          </div>
        )}
      </div>

      {/* Modal / Dialog Import JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-2xl p-6 md:p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <FileJson size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Import Đề Thi Mới (JSON)</h3>
                  <p className="text-xs text-slate-400">Chọn file hoặc dán JSON đề thi trực tiếp vào khung</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Upload size={14} /> Chọn file JSON từ máy tính
              </button>
            </div>

            <textarea
              rows={10}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='[ { "testId": "READING_TEST_6", "title": "Đề thi số 6", "part5": [...], ... } ]'
              className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-200 rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {statusMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                statusMsg.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !bulkJson.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
              >
                <Plus size={15} /> {loading ? 'Đang lưu vào SQL...' : 'Lưu Vào Database'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
