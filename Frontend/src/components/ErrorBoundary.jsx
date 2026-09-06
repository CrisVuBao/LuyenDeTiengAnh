import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Lỗi giao diện bị bắt bởi ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-slate-950">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đã xảy ra lỗi giao diện</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Hệ thống đã ghi nhận lỗi. Bạn vui lòng tải lại trang hoặc quay về trang chủ.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95"
            >
              <RotateCcw size={16} /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
