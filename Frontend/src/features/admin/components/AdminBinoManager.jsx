import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Upload, Video, Volume2, FileText, CheckCircle2, 
  Trash2, Plus, Sparkles, Folder, ExternalLink, RefreshCw 
} from 'lucide-react';
import binoApi from '../../../api/binoApi';
import toast from 'react-hot-toast';

export default function AdminBinoManager() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('audios'); // 'audios' | 'videos' | 'ebooks' | 'images'
  const [uploadedUrl, setUploadedUrl] = useState('');

  const loadData = () => {
    setLoading(true);
    binoApi.getBookOverview()
      .then((res) => {
        if (res?.data) setBook(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Lỗi tải dữ liệu sách');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', selectedFolder);

    setUploading(true);
    try {
      const res = await binoApi.uploadMedia(formData, selectedFolder);
      if (res?.data) {
        setUploadedUrl(res.data);
        toast.success(`Đã tải file lên thành công: ${res.data}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Tải file thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={26} className="text-amber-500" />
            <span>Quản Trị Sách Bino & Tải Lên Media</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý 12 chương, 72 bài hội thoại, tải lên file Video (MP4), Audio (MP3) và Ebook (PDF/EPUB).
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Media Upload Center Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Upload size={18} className="text-blue-500" />
            <span>Khu Vực Tải Lên Media Mới (Tối đa 100MB/file)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            File tải lên sẽ được lưu trữ trực tiếp trên máy chủ và sẵn sàng stream cho học viên.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">1. Chọn loại file / thư mục lưu:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'audios', label: 'Audio MP3', icon: Volume2 },
                { id: 'videos', label: 'Video MP4', icon: Video },
                { id: 'ebooks', label: 'Ebook (EPUB/PDF)', icon: FileText },
                { id: 'images', label: 'Hình ảnh', icon: Folder },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      selectedFolder === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">2. Chọn file từ máy tính:</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="mediaFileInput"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label htmlFor="mediaFileInput" className="cursor-pointer space-y-2 block">
                <Upload size={28} className="mx-auto text-blue-500 animate-bounce" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {uploading ? 'Đang tải file lên...' : 'Nhấp để chọn file hoặc kéo thả vào đây'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Hỗ trợ: .mp3, .mp4, .pdf, .epub, .jpg, .png
                </p>
              </label>
            </div>
          </div>
        </div>

        {uploadedUrl && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">URL file vừa tải lên: </span>
              <code className="text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                {uploadedUrl}
              </code>
            </div>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Xem thử</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* Chapters & Lessons Summary Table */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Danh Sách 12 Chương & 72 Bài Hội Thoại
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {book?.chapters?.map((chap) => (
            <div key={chap.id} className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                    {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {chap.title}
                    </h4>
                    <p className="text-xs text-slate-400">{chap.titleVi || 'Chào hỏi & Làm quen'}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {chap.totalLessons} bài hội thoại
                </span>
              </div>

              {/* Dialogues list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pl-10">
                {chap.dialogues?.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Hội thoại {d.dialogueNumber}: {d.title}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {d.durationSeconds}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
