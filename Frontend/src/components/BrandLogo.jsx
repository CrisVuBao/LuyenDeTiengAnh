import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import useBrandingStore from '../store/useBrandingStore';
import useThemeStore from '../store/themeStore';

/**
 * BrandLogo - Hiển thị Logo & Tên thương hiệu động từ cấu hình Hệ thống Admin
 * Hỗ trợ tự động chuyển đổi Logo Light/Dark mode, ảnh tải lên hoặc biểu tượng nhận diện mặc định.
 */
export default function BrandLogo({
  size = 'md',
  showText = true,
  showTagline = true,
  customTitle,
  customTagline,
  customLogoUrl,
  isDark = null,
  className = '',
  iconClassName = '',
  textClassName = ''
}) {
  const branding = useBrandingStore((s) => s.branding);
  const themeMode = useThemeStore((s) => s.mode);
  const [imageError, setImageError] = useState(false);

  const effectiveDark = isDark !== null ? isDark : themeMode === 'dark';
  const effectiveLogoUrl = customLogoUrl !== undefined
    ? customLogoUrl
    : (effectiveDark && branding.logoDarkUrl ? branding.logoDarkUrl : branding.logoUrl);

  const titleText = customTitle || branding.brandName || 'VBaceEnglish';
  const taglineText = customTagline || branding.tagline || 'By Vũ Bảo Software';

  const sizeClasses = {
    sm: {
      box: 'w-8 h-8 rounded-xl',
      icon: 16,
      img: 'h-8 max-w-[120px]',
      title: 'text-sm font-extrabold',
      tagline: 'text-[9px] font-bold'
    },
    md: {
      box: 'w-10 h-10 rounded-xl sm:rounded-2xl',
      icon: 20,
      img: 'h-9 max-w-[150px]',
      title: 'text-base sm:text-lg font-black',
      tagline: 'text-[10px] sm:text-[11px] font-semibold'
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      icon: 24,
      img: 'h-11 max-w-[180px]',
      title: 'text-xl sm:text-2xl font-black',
      tagline: 'text-xs font-semibold'
    },
    xl: {
      box: 'w-14 h-14 rounded-2xl',
      icon: 28,
      img: 'h-14 max-w-[220px]',
      title: 'text-2xl sm:text-3xl font-black',
      tagline: 'text-xs sm:text-sm font-semibold'
    }
  };

  const sc = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 shrink-0 ${className}`}>
      {/* 1. Logo Container (Image or Gradient Squircle) */}
      {effectiveLogoUrl && !imageError ? (
        <div className={`flex items-center justify-center shrink-0 ${iconClassName}`}>
          <img
            src={effectiveLogoUrl}
            alt={titleText}
            onError={() => setImageError(true)}
            className={`${sc.img} object-contain transition-transform duration-200`}
          />
        </div>
      ) : (
        <div
          className={`${sc.box} bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
        >
          <Sparkles size={sc.icon} />
        </div>
      )}

      {/* 2. Brand Typography (Title & Tagline) */}
      {showText && (
        <div className={`flex flex-col leading-none text-left min-w-0 ${textClassName}`}>
          <span className={`${sc.title} tracking-tight text-slate-900 dark:text-white truncate`}>
            {titleText}
          </span>
          {showTagline && taglineText && (
            <span className={`${sc.tagline} text-slate-500 dark:text-slate-400 tracking-tight mt-0.5 block truncate`}>
              {taglineText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
