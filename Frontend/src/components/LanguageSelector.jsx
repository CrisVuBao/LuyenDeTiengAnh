import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', short: 'VI' },
  { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'zh', label: '中文 (HSK)', flag: '🇨🇳', short: 'ZH' }
];

export default function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === (i18n.language?.slice(0, 2) || 'vi')) || LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', code);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-xs font-semibold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
        title="Chuyển đổi ngôn ngữ / Switch Language / 切换语言"
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        {!compact && <span className="font-bold tracking-tight">{currentLang.short}</span>}
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 overflow-hidden"
          >
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
              Ngôn ngữ hiển thị
            </div>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
