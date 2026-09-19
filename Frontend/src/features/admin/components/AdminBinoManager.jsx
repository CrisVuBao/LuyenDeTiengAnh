import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Upload, Video, Volume2, FileText, CheckCircle2, 
  Trash2, Plus, Sparkles, Folder, ExternalLink, RefreshCw,
  Edit, Eye, Layers, List, Save, X, AlertCircle, Copy, Check, ArrowRight
} from 'lucide-react';
import binoApi from '../../../api/binoApi';
import toast from 'react-hot-toast';

export default function AdminBinoManager() {
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'media' | 'sync'
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Modals
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    id: 0,
    chapterNumber: 1,
    title: '',
    titleVi: '',
    description: '',
    bonusTitle: '',
    bonusContentHtml: '',
    bonusSlangs: []
  });

  const [showDialogueModal, setShowDialogueModal] = useState(false);
  const [dialogueModalTab, setDialogueModalTab] = useState('general'); // 'general' | 'vocab' | 'lines'
  const [dialogueForm, setDialogueForm] = useState({
    id: 0,
    chapterId: 0,
    dialogueNumber: 1,
    title: '',
    titleVi: '',
    situationDescription: '',
    videoUrl: '',
    audioUrl: '',
    durationSeconds: 180,
    vocabularies: [],
    dialogueLines: []
  });

  // Media Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('audios');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // EPUB Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Load all chapters
  const loadChapters = async () => {
    try {
      setLoading(true);
      const res = await binoApi.adminGetChapters();
      if (res?.data) {
        setChapters(res.data);
        if (res.data.length > 0 && !selectedChapterId) {
          setSelectedChapterId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chương:', err);
      toast.error('Không thể tải danh sách chương từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, []);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  // ================= CHAPTER CRUD =================
  const handleOpenAddChapter = () => {
    const nextNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 : 1;
    setChapterForm({
      id: 0,
      chapterNumber: nextNumber,
      title: '',
      titleVi: '',
      description: '',
      bonusTitle: `Góc Tiếng Lóng & Mẹo Văn Hóa - Chương ${String(nextNumber).padStart(2, '0')}`,
      bonusContentHtml: '',
      bonusSlangs: []
    });
    setShowChapterModal(true);
  };

  const handleOpenEditChapter = (ch) => {
    setChapterForm({
      id: ch.id,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      titleVi: ch.titleVi || '',
      description: ch.description || '',
      bonusTitle: ch.bonusTitle || '',
      bonusContentHtml: ch.bonusContentHtml || '',
      bonusSlangs: ch.bonusSlangs || []
    });
    setShowChapterModal(true);
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tiếng Anh cho chương');
      return;
    }

    try {
      if (chapterForm.id === 0) {
        await binoApi.adminCreateChapter(chapterForm);
        toast.success('Đã thêm chương mới thành công');
      } else {
        await binoApi.adminUpdateChapter(chapterForm.id, chapterForm);
        toast.success('Đã cập nhật chương thành công');
      }
      setShowChapterModal(false);
      await loadChapters();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu thông tin chương');
    }
  };

  const handleDeleteChapter = async (ch) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Chương ${ch.chapterNumber}: "${ch.title}" cùng toàn bộ bài học bên trong không?`)) {
      return;
    }

    try {
      await binoApi.adminDeleteChapter(ch.id);
      toast.success('Đã xóa chương thành công');
      await loadChapters();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa chương');
    }
  };

  // ================= DIALOGUE CRUD =================
  const handleOpenAddDialogue = () => {
    if (!selectedChapter) return;
    const nextNum = (selectedChapter.dialogues?.length || 0) + 1;
    setDialogueForm({
      id: 0,
      chapterId: selectedChapter.id,
      dialogueNumber: nextNum,
      title: '',
      titleVi: '',
      situationDescription: '',
      videoUrl: `/videos/bino/ch${String(selectedChapter.chapterNumber).padStart(2, '0')}_d${String(nextNum).padStart(2, '0')}.mp4`,
      audioUrl: `/audios/bino/ch${String(selectedChapter.chapterNumber).padStart(2, '0')}_d${String(nextNum).padStart(2, '0')}.mp3`,
      durationSeconds: 180,
      vocabularies: [
        { id: 0, word: '', phonetic: '', wordType: 'v', meaning: '', exampleSentence: '' }
      ],
      dialogueLines: [
        { id: 0, characterName: 'BINO', englishText: '', vietnameseText: '', isUserRole: false },
        { id: 0, characterName: 'FRIEND', englishText: '', vietnameseText: '', isUserRole: true }
      ]
    });
    setDialogueModalTab('general');
    setShowDialogueModal(true);
  };

  const handleOpenEditDialogue = async (dialogueId) => {
    try {
      const res = await binoApi.adminGetDialogue(dialogueId);
      if (res?.data) {
        const d = res.data;
        setDialogueForm({
          id: d.id,
          chapterId: d.chapterId,
          dialogueNumber: d.dialogueNumber,
          title: d.title,
          titleVi: d.titleVi || '',
          situationDescription: d.situationDescription || '',
          videoUrl: d.videoUrl || '',
          audioUrl: d.audioUrl || '',
          durationSeconds: d.durationSeconds || 180,
          vocabularies: d.vocabularies || [],
          dialogueLines: d.dialogueLines || []
        });
        setDialogueModalTab('general');
        setShowDialogueModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy dữ liệu chi tiết bài hội thoại');
    }
  };

  const handleSaveDialogue = async (e) => {
    e?.preventDefault();
    if (!dialogueForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài hội thoại');
      return;
    }

    try {
      if (dialogueForm.id === 0) {
        await binoApi.adminCreateDialogue(dialogueForm);
        toast.success('Đã thêm bài hội thoại mới thành công');
      } else {
        await binoApi.adminUpdateDialogue(dialogueForm.id, dialogueForm);
        toast.success('Đã cập nhật bài hội thoại thành công');
      }
      setShowDialogueModal(false);
      await loadChapters();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu bài hội thoại');
    }
  };

  const handleDeleteDialogue = async (d) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Bài hội thoại ${d.dialogueNumber}: "${d.title}" không?`)) {
      return;
    }

    try {
      await binoApi.adminDeleteDialogue(d.id);
      toast.success('Đã xóa bài hội thoại thành công');
      await loadChapters();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa bài hội thoại');
    }
  };

  // Vocab Rows helpers
  const handleAddVocabRow = () => {
    setDialogueForm(prev => ({
      ...prev,
      vocabularies: [
        ...prev.vocabularies,
        { id: 0, word: '', phonetic: '', wordType: 'v', meaning: '', exampleSentence: '' }
      ]
    }));
  };

  const handleUpdateVocabRow = (index, field, value) => {
    setDialogueForm(prev => {
      const updated = [...prev.vocabularies];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, vocabularies: updated };
    });
  };

  const handleRemoveVocabRow = (index) => {
    setDialogueForm(prev => ({
      ...prev,
      vocabularies: prev.vocabularies.filter((_, idx) => idx !== index)
    }));
  };

  // Line Rows helpers
  const handleAddLineRow = () => {
    setDialogueForm(prev => ({
      ...prev,
      dialogueLines: [
        ...prev.dialogueLines,
        { id: 0, characterName: 'BINO', englishText: '', vietnameseText: '', isUserRole: false }
      ]
    }));
  };

  const handleUpdateLineRow = (index, field, value) => {
    setDialogueForm(prev => {
      const updated = [...prev.dialogueLines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, dialogueLines: updated };
    });
  };

  const handleRemoveLineRow = (index) => {
    setDialogueForm(prev => ({
      ...prev,
      dialogueLines: prev.dialogueLines.filter((_, idx) => idx !== index)
    }));
  };

  // Media upload handler
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
        toast.success(`Tải lên thành công: ${res.data}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Tải file thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Đã sao chép đường dẫn vào bộ nhớ tạm');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Real Data EPUB Sync
  const handleSyncRealData = async () => {
    if (!window.confirm('Hệ thống sẽ đồng bộ 100% dữ liệu thực tế từ sách TiengAnhBi.epub (16 bài hội thoại, 100 từ vựng và 174 câu thoại) vào cơ sở dữ liệu. Tiếp tục?')) {
      return;
    }

    setSyncing(true);
    try {
      const res = await binoApi.adminSyncRealData();
      if (res?.data) {
        setSyncResult(res.data);
        toast.success(res.data.message || 'Đồng bộ dữ liệu thật thành công!');
        await loadChapters();
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đồng bộ dữ liệu từ file EPUB');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
              Bino CMS Admin Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">12 Chương &amp; 72 Bài Học</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BookOpen size={26} className="text-amber-500" />
            <span>Hệ Thống Quản Trị &amp; Nhập Liệu "Chém Tiếng Anh"</span>
          </h1>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncRealData}
            disabled={syncing}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            title="Đồng bộ ngay dữ liệu thật từ TiengAnhBi.epub"
          >
            <Sparkles size={14} />
            <span>{syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Từ EPUB'}</span>
          </button>

          <button
            onClick={loadChapters}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs flex items-center transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'curriculum'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={15} />
          <span>Quản Lý Nội Dung &amp; Soạn Bài</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'media'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Upload size={15} />
          <span>Thư Viện Media &amp; Tải Lên</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'sync'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles size={15} />
          <span>Đồng Bộ TiengAnhBi.epub</span>
        </button>
      </div>

      {/* TAB 1: CURRICULUM & LESSON CMS */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Chapter List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Danh Sách Chương</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold">
                  {chapters.length}
                </span>
              </h3>
              <button
                onClick={handleOpenAddChapter}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Plus size={13} /> Thêm Chương
              </button>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
                          Chương {String(ch.chapterNumber).padStart(2, '0')}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {ch.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                          {ch.titleVi}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditChapter(ch)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa chương"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(ch)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Xóa chương"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 font-semibold">
                      <span>{ch.dialoguesCount || 0} bài học</span>
                      <span>•</span>
                      <span>{ch.vocabulariesCount || 0} từ khóa</span>
                      <span>•</span>
                      <span>{ch.linesCount || 0} câu thoại</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dialogue Lessons under Selected Chapter */}
          <div className="lg:col-span-8 space-y-4">
            {selectedChapter ? (
              <div className="space-y-4">
                {/* Chapter Banner */}
                <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Chương {String(selectedChapter.chapterNumber).padStart(2, '0')}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedChapter.title}
                    </h2>
                    <p className="text-xs text-slate-500 italic">{selectedChapter.titleVi}</p>
                    {selectedChapter.bonusTitle && (
                      <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg inline-block border border-emerald-200 dark:border-emerald-900/40">
                        🎁 {selectedChapter.bonusTitle}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleOpenAddDialogue}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Thêm Bài Hội Thoại
                  </button>
                </div>

                {/* Dialogues Table / Cards */}
                <div className="space-y-3">
                  {(!selectedChapter.dialogues || selectedChapter.dialogues.length === 0) ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
                      <BookOpen size={32} className="mx-auto text-slate-300" />
                      <p>Chương này chưa có bài hội thoại nào.</p>
                      <button
                        onClick={handleOpenAddDialogue}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Bấm vào đây để thêm bài học đầu tiên
                      </button>
                    </div>
                  ) : (
                    selectedChapter.dialogues.map((d) => (
                      <div
                        key={d.id}
                        className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                            {d.dialogueNumber}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {d.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 italic">{d.titleVi}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {d.situationDescription || 'Chưa có mô tả ngữ cảnh'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-2">
                            <span>{d.vocabulariesCount || 0} từ khóa</span>
                            <span>•</span>
                            <span>{d.linesCount || 0} câu thoại</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditDialogue(d.id)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit size={12} /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteDialogue(d)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Xóa bài học"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">Vui lòng chọn một chương để xem bài học.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEDIA LIBRARY */}
      {activeTab === 'media' && (
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
                  const isCur = selectedFolder === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolder(f.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        isCur
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
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
              <label className="text-xs font-bold text-slate-500">2. Chọn file để tải lên:</label>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all text-center">
                <Upload size={24} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {uploading ? 'Đang tải lên máy chủ...' : 'Nhấp để chọn file hoặc kéo thả vào đây'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Đang chọn thư mục: /uploads/{selectedFolder}/</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {uploadedUrl && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={16} />
                <span>File đã tải lên thành công:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={uploadedUrl}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-mono select-all"
                />
                <button
                  onClick={() => handleCopyUrl(uploadedUrl)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedUrl ? 'Đã sao chép' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REAL DATA SYNC */}
      {activeTab === 'sync' && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                <span>Đồng Bộ 100% Dữ Liệu Thật Từ Sách TiengAnhBi.epub</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tự động nạp toàn bộ 16 bài hội thoại, 100 từ vựng cốt lõi (kèm phiên âm IPA) và 174 câu thoại song ngữ từ file <code>TiengAnhBi.epub</code> (đến trang 51) vào cơ sở dữ liệu.
              </p>
            </div>

            <button
              onClick={handleSyncRealData}
              disabled={syncing}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              <Sparkles size={16} />
              <span>{syncing ? 'Đang đồng bộ dữ liệu...' : 'Bắt Đầu Đồng Bộ Ngay'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">16</span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">Bài Hội Thoại Thật</p>
              <p className="text-[10px] text-slate-400">Chương 1 (6 bài), Chương 2 (6 bài), Chương 3 (4 bài)</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">100</span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">Từ Khóa &amp; Cụm Từ</p>
              <p className="text-[10px] text-slate-400">Có phiên âm IPA, loại từ và nghĩa tự nhiên</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">174</span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">Lượt Thoại Song Ngữ</p>
              <p className="text-[10px] text-slate-400">Phân vai Bino và nhân vật, hỗ trợ luyện nói 1:1</p>
            </div>
          </div>

          {syncResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">✅ Kết Quả Đồng Bộ:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{syncResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: THÊM / SỬA CHƯƠNG ================= */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {chapterForm.id === 0 ? 'Thêm Chương Mới' : `Sửa Chương ${chapterForm.chapterNumber}`}
              </h3>
              <button onClick={() => setShowChapterModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400">Số thứ tự chương:</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={chapterForm.chapterNumber}
                    onChange={e => setChapterForm({ ...chapterForm, chapterNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-bold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Tiêu đề tiếng Anh:</label>
                  <input
                    type="text"
                    placeholder="e.g. Greetings and Introductions"
                    value={chapterForm.title}
                    onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">Tiêu đề tiếng Việt:</label>
                <input
                  type="text"
                  placeholder="e.g. Chào hỏi và giới thiệu bản thân"
                  value={chapterForm.titleVi}
                  onChange={e => setChapterForm({ ...chapterForm, titleVi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400">Mô tả tóm tắt chương:</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả mục tiêu phản xạ của chương..."
                  value={chapterForm.description}
                  onChange={e => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-bold text-amber-600 dark:text-amber-400">🎁 Góc Tiếng Lóng &amp; Triết Lý Bino:</span>
                <div>
                  <label className="font-bold text-slate-500">Tiêu đề mục bổ sung:</label>
                  <input
                    type="text"
                    value={chapterForm.bonusTitle}
                    onChange={e => setChapterForm({ ...chapterForm, bonusTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500">Từ lóng (phân cách bằng dấu phẩy):</label>
                  <input
                    type="text"
                    placeholder="e.g. No worries, Make it, Vibe"
                    value={chapterForm.bonusSlangs?.join(', ') || ''}
                    onChange={e => setChapterForm({
                      ...chapterForm,
                      bonusSlangs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-md"
                >
                  <Save size={14} /> Lưu Chương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM / SỬA BÀI HỘI THOẠI (FULL DETAIL) ================= */}
      {showDialogueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase">
                  Chương {String(selectedChapter?.chapterNumber).padStart(2, '0')} - {selectedChapter?.title}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {dialogueForm.id === 0 ? 'Thêm Bài Hội Thoại Mới' : `Sửa Bài Hội Thoại ${dialogueForm.dialogueNumber}`}
                </h3>
              </div>
              <button onClick={() => setShowDialogueModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setDialogueModalTab('general')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dialogueModalTab === 'general'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                1. Thông Tin Chung &amp; Media
              </button>
              <button
                type="button"
                onClick={() => setDialogueModalTab('vocab')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  dialogueModalTab === 'vocab'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>2. Từ Khóa (Key Words)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                  {dialogueForm.vocabularies?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDialogueModalTab('lines')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  dialogueModalTab === 'lines'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>3. Kịch Bản Hội Thoại (Lines)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                  {dialogueForm.dialogueLines?.length || 0}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* SUBTAB 1: GENERAL INFO */}
              {dialogueModalTab === 'general' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400">Số bài (1 - 6):</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={dialogueForm.dialogueNumber}
                        onChange={e => setDialogueForm({ ...dialogueForm, dialogueNumber: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-bold"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-bold text-slate-600 dark:text-slate-400">Tiêu đề tiếng Anh:</label>
                      <input
                        type="text"
                        placeholder="e.g. At Bino's New Friend's Party"
                        value={dialogueForm.title}
                        onChange={e => setDialogueForm({ ...dialogueForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400">Tiêu đề tiếng Việt:</label>
                    <input
                      type="text"
                      placeholder="e.g. Tại bữa tiệc của người bạn mới"
                      value={dialogueForm.titleVi}
                      onChange={e => setDialogueForm({ ...dialogueForm, titleVi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400">Mô tả tình huống / Ngữ cảnh:</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Bino đến dự tiệc tại nhà bạn mới và được giới thiệu làm quen với những người bạn khác..."
                      value={dialogueForm.situationDescription}
                      onChange={e => setDialogueForm({ ...dialogueForm, situationDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Volume2 size={13} className="text-blue-500" />
                        <span>Đường dẫn Audio MP3:</span>
                      </label>
                      <input
                        type="text"
                        placeholder="/audios/bino/ch01_d01.mp3"
                        value={dialogueForm.audioUrl}
                        onChange={e => setDialogueForm({ ...dialogueForm, audioUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Video size={13} className="text-purple-500" />
                        <span>Đường dẫn Video MP4 (Luyện nói 1:1):</span>
                      </label>
                      <input
                        type="text"
                        placeholder="/videos/bino/ch01_d01.mp4"
                        value={dialogueForm.videoUrl}
                        onChange={e => setDialogueForm({ ...dialogueForm, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mt-1 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: VOCABULARY / KEY WORDS */}
              {dialogueModalTab === 'vocab' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      Danh sách từ khóa (Note ghim):
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVocabRow}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <Plus size={13} /> Thêm từ khóa
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dialogueForm.vocabularies.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Từ vựng (e.g. Party)"
                            value={v.word}
                            onChange={e => handleUpdateVocabRow(idx, 'word', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Phiên âm IPA (/ˈpɑːrti/)"
                            value={v.phonetic}
                            onChange={e => handleUpdateVocabRow(idx, 'phonetic', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Loại từ (n, v, idiom)"
                            value={v.wordType}
                            onChange={e => handleUpdateVocabRow(idx, 'wordType', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Nghĩa tiếng Việt (Bữa tiệc)"
                            value={v.meaning}
                            onChange={e => handleUpdateVocabRow(idx, 'meaning', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            required
                          />
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVocabRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Xóa từ này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: DIALOGUE LINES */}
              {dialogueModalTab === 'lines' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      Kịch bản từng câu thoại:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddLineRow}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <Plus size={13} /> Thêm câu thoại
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dialogueForm.dialogueLines.map((l, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border grid grid-cols-12 gap-2 items-center ${
                          l.characterName === 'BINO'
                            ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Nhân vật (BINO / FRIEND)"
                            value={l.characterName}
                            onChange={e => handleUpdateLineRow(idx, 'characterName', e.target.value.toUpperCase())}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-center"
                            required
                          />
                        </div>

                        <div className="col-span-4">
                          <textarea
                            rows="2"
                            placeholder="Câu thoại tiếng Anh..."
                            value={l.englishText}
                            onChange={e => handleUpdateLineRow(idx, 'englishText', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                            required
                          />
                        </div>

                        <div className="col-span-4">
                          <textarea
                            rows="2"
                            placeholder="Lời dịch tiếng Việt (mộc mạc)..."
                            value={l.vietnameseText}
                            onChange={e => handleUpdateLineRow(idx, 'vietnameseText', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 italic text-red-600 dark:text-red-400"
                            required
                          />
                        </div>

                        <div className="col-span-1 text-center">
                          <label className="flex flex-col items-center gap-1 cursor-pointer" title="Tích chọn nếu muốn học viên đóng vai câu này">
                            <span className="text-[9px] font-bold text-slate-400">Đóng vai</span>
                            <input
                              type="checkbox"
                              checked={l.isUserRole}
                              onChange={e => handleUpdateLineRow(idx, 'isUserRole', e.target.checked)}
                              className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Xóa câu thoại"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-[11px] text-slate-400">
                {dialogueForm.vocabularies.length} từ vựng • {dialogueForm.dialogueLines.length} câu thoại
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDialogueModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveDialogue}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-md"
                >
                  <Save size={14} /> Lưu Bài Học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
