import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, FileText, Download, Sparkles, 
  HelpCircle, Keyboard, Search, Bookmark, Sliders, ExternalLink
} from 'lucide-react';
import EpubReader from './components/EpubReader';
import { binoApi } from '../../api/binoApi';

export default function BinoEbookViewerPage() {
  const navigate = useNavigate();
  const [readerMode, setReaderMode] = useState('epub'); // Default to 'epub' as requested
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await binoApi.getBook('chem-tieng-anh-khong-can-dong-nao');
        if (data) {
          setBook(data);
        }
      } catch (err) {
        console.warn('Could not fetch book details from API, using default data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, []);

  const epubUrl = book?.epubFileUrl || '/ebooks/chem_tieng_anh_bino.epub';
  const pdfUrl = book?.pdfFileUrl || '/ebooks/chem_tieng_anh_bino.pdf';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bino')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Trình Đọc Ebook Chuẩn Quốc Tế</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                epub.js v0.3
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {book?.title || 'Chém Tiếng Anh không cần động não - Bino'}
            </h1>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setReaderMode('epub')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'epub'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen size={14} />
              <span>Trình Đọc EPUB Chuẩn</span>
            </button>

            <button
              onClick={() => setReaderMode('pdf')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'pdf'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>Bản In Gốc &amp; Scan</span>
            </button>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
            title="Hướng dẫn sử dụng & phím tắt"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Guide Panel (Collapsible) */}
      {showGuide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3 animate-fade-in text-xs sm:text-sm">
          <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Keyboard size={16} />
              <span>Hướng Dẫn Sử Dụng Trình Đọc EPUB Chuẩn &amp; Phím Tắt Tiện Lợi</span>
            </div>
            <button onClick={() => setShowGuide(false)} className="text-xs hover:underline opacity-70">
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-100 dark:border-amber-900/30 space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400">⌨️ Phím tắt:</span>
              <p>• <strong>← / →</strong>: Lật trang trước / sau</p>
              <p>• <strong>Space / PageDown</strong>: Tiến một trang</p>
              <p>• <strong>F</strong>: Toàn màn hình</p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-100 dark:border-amber-900/30 space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400">🔍 Tra cứu &amp; Đánh dấu:</span>
              <p>• Bấm <strong>kính lúp</strong> để tìm từ khóa trong toàn bộ cuốn sách</p>
              <p>• Bấm <strong>Bookmark</strong> để lưu vị trí đang đọc dở</p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-100 dark:border-amber-900/30 space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400">📂 Mở file từ máy tính:</span>
              <p>• Bấm nút <strong>"Mở EPUB"</strong> ở góc trên bên phải để chọn bất kỳ file sách <code>.epub</code> nào từ máy tính của bạn!</p>
            </div>
          </div>
        </div>
      )}

      {/* Reader Body */}
      {readerMode === 'epub' ? (
        <EpubReader 
          initialUrl={epubUrl}
          bookTitle={book?.title || 'Chém Tiếng Anh không cần động não'}
        />
      ) : (
        /* PDF and Scanned Book View */
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl p-4 sm:p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <span>Bản in giấy thực tế cuốn sách của Bino (Trang 15 &amp; 16 - Chương 01).</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/bino/dialogue/3')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span>Học tương tác bài 3</span>
                <Sparkles size={13} />
              </button>
              <a
                href={pdfUrl}
                download
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Tải PDF</span>
              </a>
            </div>
          </div>

          {/* Scanned Sample View */}
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Trang 15 (Chương 01 - Hội thoại 3: At Bino's New Friend's Party)</span>
                <span className="text-amber-600 dark:text-amber-400">Bản in gốc Bino</span>
              </div>
              <img 
                src="/images/bino/page15.jpg" 
                alt="Trang 15" 
                className="w-full max-h-[850px] object-contain bg-slate-50 dark:bg-slate-900 mx-auto" 
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Trang 16 (Chương 01 - Hội thoại 4: Catching up with an Old Friend)</span>
                <span className="text-amber-600 dark:text-amber-400">Bản in gốc Bino</span>
              </div>
              <img 
                src="/images/bino/page16.jpg" 
                alt="Trang 16" 
                className="w-full max-h-[850px] object-contain bg-slate-50 dark:bg-slate-900 mx-auto" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
