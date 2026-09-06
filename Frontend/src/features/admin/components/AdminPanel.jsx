import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileJson, CheckCircle2, AlertCircle, Plus, BookOpen, RefreshCw } from 'lucide-react';
import toeicApi from '../../../api/toeicApi';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const fileInputRef = useRef(null);

  const fetchTests = () => {
    toeicApi.getAllTests()
      .then((res) => {
        if (res?.data) setTests(res.data);
      })
      .catch((err) => console.error("Lỗi lấy danh sách đề:", err));
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
      setStatusMsg({ type: 'info', text: `Đã nạp file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Bấm "Lưu Vào Database" để hoàn tất.` });
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
      // Validate JSON syntax first
      JSON.parse(bulkJson);
      
      const res = await toeicApi.bulkImport(bulkJson);
      toast.success(res.message || 'Import đề thi thành công vào Database!');
      setBulkJson('');
      setStatusMsg({ type: 'success', text: res.message });
      fetchTests();
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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Trung Tâm Quản Trị Đề Thi</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Nhập dữ liệu đề thi mới vào Microsoft SQL Server hoặc quản lý kho đề hiện có
        </p>
      </div>

      {/* Bulk Import Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileJson size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Bulk Import JSON Đề Thi</h3>
              <p className="text-xs text-slate-400">Hỗ trợ 1 đề hoặc mảng nhiều đề thi TOEIC đầy đủ các Part</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Upload size={15} /> Tải file JSON
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !bulkJson.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus size={15} /> {loading ? 'Đang lưu...' : 'Lưu Vào Database'}
            </button>
          </div>
        </div>

        <textarea
          rows={8}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='Dán nội dung file JSON vào đây (VD: [ { "testId": "READING_TEST_6", "part5": [...], ... } ])'
          className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-200 rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {statusMsg && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900' :
            statusMsg.type === 'error' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900' :
            'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Existing Tests Management */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" /> Các Đề Thi Đang Có Trong SQL Server ({tests.length})
          </h3>
          <button
            onClick={fetchTests}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tests.map((t) => (
            <div key={t.id} className="py-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.title || t.testId}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Mã: <strong className="text-slate-600 dark:text-slate-300">{t.testId}</strong></span>
                  <span>•</span>
                  <span>Tổng số câu: <strong className="text-green-600 dark:text-green-400">{t.totalQuestions}</strong></span>
                  <span>•</span>
                  <span>Tạo lúc: {new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTest(t.id, t.testId)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                title="Xóa đề này khỏi database"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {tests.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có đề thi nào trong cơ sở dữ liệu. Hãy import đề thi ở trên!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
