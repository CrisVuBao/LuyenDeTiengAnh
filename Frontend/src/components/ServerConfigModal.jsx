import React, { useState, useEffect } from 'react';
import { Server, Wifi, CheckCircle2, XCircle, Loader2, X, RefreshCw, Smartphone, Laptop, Globe } from 'lucide-react';
import axios from 'axios';
import { getServerUrl, setServerUrl, DEFAULT_LAN_SERVER_URL } from '../api/axiosClient';
import toast from 'react-hot-toast';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string, pingMs?: number }

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getServerUrl() || DEFAULT_LAN_SERVER_URL);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const targetUrl = urlInput.trim().replace(/\/+$/, '');
    if (!targetUrl && targetUrl !== '') {
      setTestResult({ success: false, message: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      // Test gọi endpoint public của backend hoặc profile
      const testEndpoint = targetUrl ? `${targetUrl}/api/account/profile` : '/api/account/profile';
      
      const response = await axios.get(testEndpoint, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // 200, 401, 403 đều chứng minh server đang phản hồi!
      });

      const pingMs = Date.now() - startTime;
      setTestResult({
        success: true,
        pingMs,
        message: `Kết nối máy chủ thành công! (Độ trễ: ${pingMs}ms)`
      });
    } catch (err) {
      const pingMs = Date.now() - startTime;
      let errorMsg = 'Không thể kết nối tới máy chủ.';
      if (err.code === 'ECONNABORTED') {
        errorMsg = 'Quá thời gian phản hồi (Timeout 5s). Server phản hồi quá chậm.';
      } else if (err.message?.includes('Network Error')) {
        errorMsg = 'Lỗi mạng (Network Error). Hãy chắc chắn Backend ASP.NET Core đang chạy và điện thoại đang bắt cùng mạng Wifi!';
      }
      setTestResult({
        success: false,
        pingMs,
        message: errorMsg
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = urlInput.trim().replace(/\/+$/, '');
    setServerUrl(cleanUrl);
    toast.success('Đã lưu cấu hình máy chủ!');
    onClose();
  };

  const applyPreset = (presetUrl) => {
    setUrlInput(presetUrl);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Cài Đặt Kết Nối Máy Chủ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cấu hình IP máy tính hoặc domain Backend cho Mobile App
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Địa chỉ Backend API (Server URL)
          </label>
          <div className="relative">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://192.168.88.233:5199"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
              >
                Xóa
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Gợi ý: Nhập địa chỉ IP máy tính đang chạy backend (ví dụ: <span className="font-mono text-indigo-500 font-semibold">{DEFAULT_LAN_SERVER_URL}</span>)
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Gợi ý nhanh 1-chạm
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_LAN_SERVER_URL)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-left transition text-xs"
            >
              <Laptop size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-indigo-700 dark:text-indigo-300 truncate">Máy tính LAN (Wifi)</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">192.168.88.233:5199</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('http://10.0.2.2:5199')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition text-xs"
            >
              <Smartphone size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">Android Emulator</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">10.0.2.2:5199</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('http://localhost:5199')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition text-xs"
            >
              <Server size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">Localhost:5199</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">localhost:5199</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition text-xs"
            >
              <Globe size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">Mặc định Web</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">Same-origin (/api)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Test Connection Button & Result */}
        <div className="mb-6">
          <button
            type="button"
            disabled={testing}
            onClick={handleTestConnection}
            className="w-full py-2.5 px-4 rounded-xl border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang kiểm tra kết nối...</span>
              </>
            ) : (
              <>
                <Wifi size={16} />
                <span>Kiểm tra kết nối (Ping Test)</span>
              </>
            )}
          </button>

          {/* Test Status Banner */}
          {testResult && (
            <div 
              className={`mt-3 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-grow">
                <p className="font-semibold">{testResult.success ? 'Thành công!' : 'Kết nối thất bại'}</p>
                <p className="mt-0.5 opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]"
          >
            Lưu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
}
