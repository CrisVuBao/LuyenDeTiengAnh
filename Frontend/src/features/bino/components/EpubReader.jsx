import React, { useState, useEffect, useRef, useCallback } from 'react';
import ePub from 'epubjs';
import {
  ChevronLeft, ChevronRight, Menu, X, Search, Bookmark, BookmarkCheck,
  Sun, Moon, Type, Maximize, Minimize, Upload, RotateCcw,
  Sliders, Sparkles, BookOpen, Layers, List, Check, ArrowRight, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const THEMES = {
  light: {
    name: 'Sáng',
    bg: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    cardBg: '#f8fafc',
    styles: {
      body: {
        background: '#ffffff !important',
        color: '#1e293b !important',
        'font-family': 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) !important',
        'line-height': 'var(--line-height, 1.7) !important',
      },
      p: { color: '#334155 !important' },
      h1: { color: '#d97706 !important', 'border-bottom': '2px solid #f59e0b !important' },
      h2: { color: '#b45309 !important' },
      h3: { color: '#92400e !important' },
      'a, a:link, a:visited': { color: '#2563eb !important' },
      '.keywords-box': { background: '#fef3c7 !important', border: '1px solid #fde68a !important', 'border-left': '5px solid #d97706 !important' },
      '.dialogue-section': { background: '#f8fafc !important', border: '1px solid #e2e8f0 !important' },
      '.speaker-name': { color: '#1e3a8a !important' },
      '.speaker-en': { color: '#0f172a !important' },
      '.speaker-vi': { color: '#dc2626 !important' }
    }
  },
  sepia: {
    name: 'Giấy cũ (Sepia)',
    bg: '#fbf0d9',
    text: '#45321e',
    border: '#eedcbd',
    cardBg: '#f4e5c5',
    styles: {
      body: {
        background: '#fbf0d9 !important',
        color: '#45321e !important',
        'font-family': 'var(--font-family, Georgia, serif) !important',
        'line-height': 'var(--line-height, 1.7) !important',
      },
      p: { color: '#45321e !important' },
      h1: { color: '#8c4b12 !important', 'border-bottom': '2px solid #d49b57 !important' },
      h2: { color: '#8c4b12 !important' },
      h3: { color: '#6d3b0e !important' },
      'a, a:link, a:visited': { color: '#9a3412 !important' },
      '.keywords-box': { background: '#f5e4c3 !important', border: '1px solid #e7ce9e !important', 'border-left': '5px solid #b45309 !important' },
      '.dialogue-section': { background: '#f5e8cf !important', border: '1px solid #e2d1b1 !important' },
      '.speaker-name': { color: '#78350f !important' },
      '.speaker-en': { color: '#3d250c !important' },
      '.speaker-vi': { color: '#b91c1c !important' }
    }
  },
  dark: {
    name: 'Tối (Night)',
    bg: '#18181b',
    text: '#e4e4e7',
    border: '#27272a',
    cardBg: '#27272a',
    styles: {
      body: {
        background: '#18181b !important',
        color: '#e4e4e7 !important',
        'font-family': 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) !important',
        'line-height': 'var(--line-height, 1.7) !important',
      },
      p: { color: '#d4d4d8 !important' },
      h1: { color: '#fbbf24 !important', 'border-bottom': '2px solid #f59e0b !important' },
      h2: { color: '#f59e0b !important' },
      h3: { color: '#fbbf24 !important' },
      'a, a:link, a:visited': { color: '#60a5fa !important' },
      '.keywords-box': { background: '#27272a !important', border: '1px solid #3f3f46 !important', 'border-left': '5px solid #f59e0b !important' },
      '.dialogue-section': { background: '#27272a !important', border: '1px solid #3f3f46 !important' },
      '.speaker-name': { color: '#93c5fd !important' },
      '.speaker-en': { color: '#f1f5f9 !important' },
      '.speaker-vi': { color: '#f87171 !important' }
    }
  },
  mint: {
    name: 'Xanh Mát (Mint)',
    bg: '#f0fdf4',
    text: '#14532d',
    border: '#bbf7d0',
    cardBg: '#dcfce7',
    styles: {
      body: {
        background: '#f0fdf4 !important',
        color: '#14532d !important',
        'font-family': 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) !important',
        'line-height': 'var(--line-height, 1.7) !important',
      },
      p: { color: '#166534 !important' },
      h1: { color: '#15803d !important', 'border-bottom': '2px solid #22c55e !important' },
      h2: { color: '#166534 !important' },
      h3: { color: '#15803d !important' },
      'a, a:link, a:visited': { color: '#047857 !important' },
      '.keywords-box': { background: '#dcfce7 !important', border: '1px solid #86efac !important', 'border-left': '5px solid #16a34a !important' },
      '.dialogue-section': { background: '#dcfce7 !important', border: '1px solid #86efac !important' },
      '.speaker-name': { color: '#065f46 !important' },
      '.speaker-en': { color: '#064e3b !important' },
      '.speaker-vi': { color: '#b91c1c !important' }
    }
  }
};

const FONT_FAMILIES = [
  { label: 'Sans-serif (Mặc định)', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { label: 'Serif (Sách in)', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Monospace (Lập trình)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }
];

export default function EpubReader({ 
  initialUrl = '/ebooks/chem_tieng_anh_bino.epub',
  bookTitle = 'Chém Tiếng Anh không cần động não',
  onClose
}) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  // Reader State
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [locationInfo, setLocationInfo] = useState({
    percentage: 0,
    currentChapter: '',
    cfi: null,
    page: null,
    total: null
  });

  // Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('vbace_epub_theme') || 'sepia');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('vbace_epub_fontsize')) || 17);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('vbace_epub_fontfamily') || FONT_FAMILIES[0].value);
  const [lineHeight, setLineHeight] = useState(() => localStorage.getItem('vbace_epub_lineheight') || '1.7');
  const [flowMode, setFlowMode] = useState('paginated'); // 'paginated' | 'scrolled-doc'
  const [spreadMode, setSpreadMode] = useState('auto'); // 'auto' | 'none'

  // Panels & Drawers
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vbace_epub_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // Custom Local File Source
  const [customSource, setCustomSource] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState('');

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('vbace_epub_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('vbace_epub_fontsize', fontSize);
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem('vbace_epub_fontfamily', fontFamily);
  }, [fontFamily]);
  useEffect(() => {
    localStorage.setItem('vbace_epub_lineheight', lineHeight);
  }, [lineHeight]);

  // Load Book
  const loadBook = useCallback((source) => {
    if (!viewerRef.current) return;
    setLoading(true);
    setLoadingProgress(15);

    // Cleanup existing book & rendition
    if (renditionRef.current) {
      try {
        renditionRef.current.destroy();
      } catch (e) {
        console.warn('Destroy rendition error:', e);
      }
      renditionRef.current = null;
    }
    if (bookRef.current) {
      try {
        bookRef.current.destroy();
      } catch (e) {
        console.warn('Destroy book error:', e);
      }
      bookRef.current = null;
    }

    viewerRef.current.innerHTML = '';

    try {
      const book = ePub(source);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: flowMode,
        spread: spreadMode,
        manager: 'default'
      });
      renditionRef.current = rendition;

      // Register all themes
      Object.entries(THEMES).forEach(([key, cfg]) => {
        rendition.themes.register(key, cfg.styles);
      });

      // Apply initial theme & styles
      rendition.themes.select(theme);
      rendition.themes.fontSize(`${fontSize}px`);

      // Load Navigation & Metadata
      book.loaded.navigation.then(nav => {
        setToc(nav.toc || []);
        setLoadingProgress(45);
      }).catch(err => console.warn('Nav load err:', err));

      book.loaded.metadata.then(meta => {
        setMetadata(meta);
        setLoadingProgress(60);
      }).catch(err => console.warn('Meta load err:', err));

      // Display initial page (or saved CFI)
      const savedCfi = localStorage.getItem(`vbace_epub_last_cfi_${bookTitle}`);
      rendition.display(savedCfi || undefined).then(() => {
        setLoading(false);
        setLoadingProgress(100);
      }).catch(err => {
        console.warn('Rendition display error:', err);
        // Retry with default
        rendition.display();
        setLoading(false);
      });

      // Generate locations for page & slider accuracy
      book.ready.then(() => {
        return book.locations.generate(1000);
      }).then(() => {
        if (rendition.location) {
          updateLocationInfo(rendition.location);
        }
      }).catch(err => console.warn('Locations generation notice:', err));

      // Relocated event
      rendition.on('relocated', (location) => {
        updateLocationInfo(location);
        if (location && location.start && location.start.cfi) {
          localStorage.setItem(`vbace_epub_last_cfi_${bookTitle}`, location.start.cfi);
        }
      });

      // Handle Key Navigation inside rendition iframe
      rendition.on('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          rendition.prev();
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          rendition.next();
        }
      });

    } catch (err) {
      console.error('Failed to initialize EPUB:', err);
      toast.error('Không thể tải file EPUB này. Vui lòng kiểm tra định dạng file.');
      setLoading(false);
    }
  }, [flowMode, spreadMode, theme, fontSize, bookTitle]);

  const updateLocationInfo = (location) => {
    if (!location || !location.start) return;
    const book = bookRef.current;
    let percentage = 0;
    let page = null;
    let total = null;

    if (book && book.locations && book.locations.length() > 0) {
      percentage = Math.round(book.locations.percentageFromCfi(location.start.cfi) * 100);
      page = book.locations.locationFromCfi(location.start.cfi);
      total = book.locations.length();
    }

    // Attempt to match chapter from TOC
    let currentChapter = '';
    if (toc.length > 0 && location.start.href) {
      const match = toc.find(t => location.start.href.includes(t.href) || t.href.includes(location.start.href));
      if (match) currentChapter = match.label.trim();
    }

    setLocationInfo({
      percentage: Math.min(100, Math.max(0, percentage)),
      currentChapter,
      cfi: location.start.cfi,
      page,
      total
    });
  };

  // Trigger book load on source or layout mode change
  useEffect(() => {
    loadBook(customSource || initialUrl);
  }, [customSource, initialUrl, flowMode, spreadMode]);

  // Dynamic Theme & Typography Updates
  useEffect(() => {
    if (!renditionRef.current) return;
    renditionRef.current.themes.select(theme);
    renditionRef.current.themes.fontSize(`${fontSize}px`);
  }, [theme, fontSize]);

  // Window Resize & Keyboard Event Listeners
  useEffect(() => {
    const handleResize = () => {
      if (renditionRef.current) {
        renditionRef.current.resize();
      }
    };

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        nextPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        setShowToc(false);
        setShowSettings(false);
        setShowSearch(false);
        setShowBookmarks(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Controls
  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const jumpToHref = (href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  };

  const jumpToCfi = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi);
    }
  };

  const handleSeek = (e) => {
    const targetPct = Number(e.target.value);
    if (bookRef.current && bookRef.current.locations && renditionRef.current) {
      try {
        const cfi = bookRef.current.locations.cfiFromPercentage(targetPct / 100);
        renditionRef.current.display(cfi);
      } catch (err) {
        console.warn('Seek error:', err);
      }
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.warn('Fullscreen err:', err);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => {
        console.warn('Exit fullscreen err:', err);
      });
    }
  };

  // Search inside EPUB
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !bookRef.current) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const query = searchQuery.toLowerCase().trim();
      const results = [];
      const spineItems = bookRef.current.spine.spineItems;

      for (const item of spineItems) {
        await item.load(bookRef.current.load.bind(bookRef.current));
        const matches = item.find(query);
        item.unload();

        if (matches && matches.length > 0) {
          matches.forEach(m => {
            results.push({
              cfi: m.cfi,
              excerpt: m.excerpt,
              sectionHref: item.href
            });
          });
        }
      }

      setSearchResults(results);
      if (results.length === 0) {
        toast('Không tìm thấy kết quả phù hợp trong sách', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  // Bookmark Toggle
  const isCurrentBookmarked = bookmarks.some(b => b.cfi === locationInfo.cfi);

  const toggleBookmark = () => {
    if (!locationInfo.cfi) return;

    if (isCurrentBookmarked) {
      const updated = bookmarks.filter(b => b.cfi !== locationInfo.cfi);
      setBookmarks(updated);
      localStorage.setItem('vbace_epub_bookmarks', JSON.stringify(updated));
      toast.success('Đã xóa đánh dấu trang');
    } else {
      const newBm = {
        id: Date.now(),
        cfi: locationInfo.cfi,
        chapter: locationInfo.currentChapter || 'Trang sách',
        percentage: locationInfo.percentage,
        date: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      const updated = [newBm, ...bookmarks];
      setBookmarks(updated);
      localStorage.setItem('vbace_epub_bookmarks', JSON.stringify(updated));
      toast.success('Đã đánh dấu trang thành công');
    }
  };

  // Handle Local EPUB File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.epub')) {
      toast.error('Vui lòng chọn file có định dạng .epub');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      setCustomSource(arrayBuffer);
      setLoadedFileName(file.name);
      toast.success(`Đã nạp file sách: ${file.name}`);
    };
    reader.readAsArrayBuffer(file);
  };

  // Current Theme Config
  const activeTheme = THEMES[theme] || THEMES.sepia;

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col h-[82vh] min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-300 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen min-h-screen' : ''
      }`}
      style={{
        backgroundColor: activeTheme.bg,
        borderColor: activeTheme.border,
        color: activeTheme.text
      }}
    >
      {/* Top Navbar */}
      <header 
        className="px-4 py-3 border-b flex items-center justify-between gap-2 z-20 transition-colors"
        style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.bg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title="Mục lục sách"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black truncate">
              {loadedFileName || metadata?.title || bookTitle}
            </h2>
            <div className="flex items-center gap-2 text-[11px] opacity-70">
              <span className="truncate">{metadata?.creator || 'Bino Chém Tiếng Anh'}</span>
              {locationInfo.percentage > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold">{locationInfo.percentage}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isCurrentBookmarked ? 'bg-amber-500 text-white border-amber-600' : 'hover:opacity-80'
            }`}
            style={{ borderColor: isCurrentBookmarked ? undefined : activeTheme.border, backgroundColor: isCurrentBookmarked ? undefined : activeTheme.cardBg }}
            title={isCurrentBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu trang'}
          >
            {isCurrentBookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          </button>

          {/* Bookmarks List Modal Trigger */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all relative"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title="Danh sách trang đã đánh dấu"
          >
            <List size={17} />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Search in Book */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title="Tìm kiếm từ khóa trong sách"
          >
            <Search size={17} />
          </button>

          {/* Settings / Typography Drawer */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title="Cài đặt giao diện & cỡ chữ"
          >
            <Sliders size={17} />
          </button>

          {/* Open local file button */}
          <label
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title="Mở file EPUB từ máy tính"
          >
            <Upload size={17} />
            <span className="hidden md:inline">Mở EPUB</span>
            <input
              type="file"
              accept=".epub"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all hidden sm:flex"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border hover:opacity-80 active:scale-95 transition-all"
              style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
              title="Đóng trình đọc"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </header>

      {/* Main Reading Canvas */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div 
            className="absolute inset-0 z-30 flex flex-col items-center justify-center space-y-4 transition-opacity"
            style={{ backgroundColor: activeTheme.bg }}
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <BookOpen className="absolute inset-0 m-auto text-amber-500" size={24} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold">Đang nạp dữ liệu EPUB...</p>
              <p className="text-xs opacity-60">Chuẩn hóa dàn trang và mục lục tương tác</p>
            </div>
          </div>
        )}

        {/* Left TOC Drawer */}
        {showToc && (
          <aside 
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] z-30 border-r shadow-2xl p-4 flex flex-col backdrop-blur-md transition-all animate-fade-in"
            style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: activeTheme.border }}>
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-amber-500" />
                <h3 className="font-black text-sm">Mục Lục Sách</h3>
              </div>
              <button 
                onClick={() => setShowToc(false)}
                className="p-1 rounded-lg hover:opacity-70"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
              {toc.length === 0 ? (
                <p className="text-center py-8 opacity-60">Đang tải mục lục...</p>
              ) : (
                toc.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToHref(item.href)}
                    className="w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2 hover:bg-black/5 dark:hover:bg-white/5 active:scale-98"
                  >
                    <span className="font-bold opacity-40 mt-0.5">{idx + 1}.</span>
                    <span className="font-semibold leading-relaxed line-clamp-2">{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Settings Popover Drawer */}
        {showSettings && (
          <aside 
            className="absolute top-2 right-2 w-80 max-w-[90vw] z-30 border rounded-2xl shadow-2xl p-4 backdrop-blur-md space-y-4 animate-fade-in"
            style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: activeTheme.border }}>
              <span className="font-black text-xs uppercase tracking-wider">Cài Đặt Đọc Sách</span>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            {/* Theme selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold opacity-70">Chủ đề giao diện (Theme):</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(THEMES).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
                      theme === key ? 'ring-2 ring-amber-500 font-black' : ''
                    }`}
                    style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                  >
                    <span>{cfg.name}</span>
                    {theme === key && <Check size={14} className="text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold opacity-70">
                <span>Cỡ chữ:</span>
                <span className="font-black">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="flex-1 py-1.5 rounded-xl border text-xs font-bold hover:opacity-80 active:scale-95"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                  className="flex-1 py-1.5 rounded-xl border text-xs font-bold hover:opacity-80 active:scale-95"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Flow Mode */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold opacity-70">Kiểu hiển thị trang:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setFlowMode('paginated')}
                  className={`py-1.5 px-2 rounded-xl border font-bold transition-all ${
                    flowMode === 'paginated' ? 'bg-amber-500 text-white border-amber-600' : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: flowMode === 'paginated' ? undefined : activeTheme.border }}
                >
                  Lật từng trang
                </button>
                <button
                  onClick={() => setFlowMode('scrolled-doc')}
                  className={`py-1.5 px-2 rounded-xl border font-bold transition-all ${
                    flowMode === 'scrolled-doc' ? 'bg-amber-500 text-white border-amber-600' : 'hover:opacity-80'
                  }`}
                  style={{ borderColor: flowMode === 'scrolled-doc' ? undefined : activeTheme.border }}
                >
                  Cuộn liên tục
                </button>
              </div>
            </div>

            {/* Spread Mode */}
            {flowMode === 'paginated' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold opacity-70">Dàn trang:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSpreadMode('none')}
                    className={`py-1.5 px-2 rounded-xl border font-bold transition-all ${
                      spreadMode === 'none' ? 'bg-amber-500 text-white border-amber-600' : 'hover:opacity-80'
                    }`}
                    style={{ borderColor: spreadMode === 'none' ? undefined : activeTheme.border }}
                  >
                    1 Trang
                  </button>
                  <button
                    onClick={() => setSpreadMode('auto')}
                    className={`py-1.5 px-2 rounded-xl border font-bold transition-all ${
                      spreadMode === 'auto' ? 'bg-amber-500 text-white border-amber-600' : 'hover:opacity-80'
                    }`}
                    style={{ borderColor: spreadMode === 'auto' ? undefined : activeTheme.border }}
                  >
                    2 Trang (Auto)
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Search Modal Drawer */}
        {showSearch && (
          <aside 
            className="absolute top-2 right-2 w-96 max-w-[92vw] max-h-[85%] z-30 border rounded-2xl shadow-2xl p-4 backdrop-blur-md flex flex-col space-y-3 animate-fade-in"
            style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: activeTheme.border }}>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-amber-500" />
                <span className="font-black text-xs uppercase">Tìm Trong Sách</span>
              </div>
              <button onClick={() => setShowSearch(false)} className="p-1 hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nhập từ hoặc câu cần tra..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-black/5 dark:bg-white/5"
                style={{ borderColor: activeTheme.border }}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
              >
                {isSearching ? '...' : 'Tìm'}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs max-h-72">
              {isSearching && (
                <div className="py-6 text-center opacity-60">Đang quét từ khóa qua toàn bộ sách...</div>
              )}
              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="py-6 text-center opacity-60">Không tìm thấy kết quả</div>
              )}
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    jumpToCfi(res.cfi);
                    setShowSearch(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border hover:border-amber-500 transition-all group"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
                >
                  <p className="line-clamp-2 opacity-90 leading-relaxed font-medium">
                    {res.excerpt}
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold group-hover:underline mt-1 inline-block">
                    Nhảy tới đoạn này &rarr;
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Bookmarks Modal Drawer */}
        {showBookmarks && (
          <aside 
            className="absolute top-2 right-2 w-80 max-w-[90vw] max-h-[80%] z-30 border rounded-2xl shadow-2xl p-4 backdrop-blur-md flex flex-col space-y-3 animate-fade-in"
            style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: activeTheme.border }}>
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-amber-500" />
                <span className="font-black text-xs uppercase">Trang Đã Đánh Dấu</span>
              </div>
              <button onClick={() => setShowBookmarks(false)} className="p-1 hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs max-h-72">
              {bookmarks.length === 0 ? (
                <div className="py-6 text-center opacity-60">Chưa có trang nào được đánh dấu</div>
              ) : (
                bookmarks.map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => {
                      jumpToCfi(bm.cfi);
                      setShowBookmarks(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border hover:border-amber-500 transition-all group"
                    style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.cardBg }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold truncate">{bm.chapter}</span>
                      <span className="text-[10px] font-black text-amber-500">{bm.percentage}%</span>
                    </div>
                    <span className="text-[10px] opacity-50">{bm.date}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        {/* epubjs Render Mount Point */}
        <div 
          ref={viewerRef} 
          className="w-full h-full"
          style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s ease-in-out' }}
        />

        {/* Floating Page Navigation Buttons */}
        {flowMode === 'paginated' && (
          <>
            <button
              onClick={prevPage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full border shadow-xl hover:scale-110 active:scale-95 transition-all opacity-40 hover:opacity-100 z-10"
              style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border, color: activeTheme.text }}
              title="Trang trước (Phím Mũi tên trái)"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={nextPage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full border shadow-xl hover:scale-110 active:scale-95 transition-all opacity-40 hover:opacity-100 z-10"
              style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border, color: activeTheme.text }}
              title="Trang tiếp theo (Phím Mũi tên phải)"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Bottom Footer Scrubber Bar */}
      <footer 
        className="px-4 py-2.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs z-20 transition-colors"
        style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.bg }}
      >
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 min-w-0">
          <span className="font-bold text-[11px] truncate max-w-[200px] sm:max-w-xs opacity-80">
            {locationInfo.currentChapter || 'Chương đang đọc'}
          </span>
          {locationInfo.page && (
            <span className="text-[11px] font-semibold opacity-60">
              Vị trí: {locationInfo.page} {locationInfo.total ? `/ ${locationInfo.total}` : ''}
            </span>
          )}
        </div>

        {/* Progress Slider */}
        <div className="w-full sm:w-72 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={locationInfo.percentage}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="font-black text-[11px] min-w-9 text-right">
            {locationInfo.percentage}%
          </span>
        </div>
      </footer>
    </div>
  );
}
