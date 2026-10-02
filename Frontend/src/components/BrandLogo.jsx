import React, { useState } from 'react';
import useBrandingStore from '../store/useBrandingStore';
import useThemeStore from '../store/themeStore';

/**
 * BrandFaviconSvg - Vector SVG biểu tượng chuẩn thương hiệu VBaceEnglish
 * Dựng trực tiếp từ favicon.svg gốc, đảm bảo hiển thị sắc nét 100% tại mọi tỉ lệ
 * Không bao giờ bị lỗi 404, MIME types trên IIS / MonsterASP hay chập chờn mạng.
 */
export function BrandFaviconSvg({ className = 'w-8 h-8 rounded-xl', ...props }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="VBaceEnglish Logo"
      {...props}
    >
      <defs>
        {/* Background Gradient: Deep Apple Royal Blue to Electric Indigo */}
        <linearGradient id="vbaceBrandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Golden Sparkle & Soundwave Gradient */}
        <linearGradient id="vbaceBrandAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Soft Depth Filter */}
        <filter id="vbaceBrandGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Modern Squircle Base */}
      <rect width="64" height="64" rx="16" fill="url(#vbaceBrandBgGrad)" />

      {/* Inner Soft Bevel Border */}
      <rect x="1" y="1" width="62" height="62" rx="15" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" />

      {/* English Learning Elements: Stylized Open Knowledge Book & Fluent Sound Waves */}
      <g filter="url(#vbaceBrandGlow)">
        {/* Open Book Pages (Left & Right Wings) */}
        <path
          d="M14 43.5C20.5 40.5 27 41.5 32 44.5C37 41.5 43.5 40.5 50 43.5V23C43.5 20 37 21 32 24C27 21 20.5 20 14 23V43.5Z"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Center Spine Line */}
        <path d="M32 24V44.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Bold Vibrant "V" Crest (VBace / Victory in English Fluency) */}
        <path
          d="M21 20L32 38L43 20"
          stroke="url(#vbaceBrandAccentGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Speech / Audio Wave Arc (Speaking & Listening Reflex) */}
        <path
          d="M47 16C50 19 51.5 23 51.5 27.5C51.5 32 50 36 47 39"
          stroke="#38bdf8"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M52 12C56 16.5 58 22 58 27.5C58 33 56 38.5 52 43"
          stroke="#7dd3fc"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* AI / Excellence Sparkle Star (Top Left) */}
        <path
          d="M18 11L19.2 14.8L23 16L19.2 17.2L18 21L16.8 17.2L13 16L16.8 14.8L18 11Z"
          fill="#fef08a"
        />
      </g>
    </svg>
  );
}

/**
 * BrandLogo - Hiển thị Logo & Tên thương hiệu động từ cấu hình Hệ thống Admin
 * Hỗ trợ tự động chuyển đổi Logo Light/Dark mode, ảnh tải lên hoặc biểu tượng nhận diện mặc định favicon.svg.
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
    : (effectiveDark && branding.logoDarkUrl ? branding.logoDarkUrl : (branding.logoUrl || '/favicon.svg'));

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

  // Kiểm tra xem logo có phải là favicon.svg mặc định hay không
  const isDefaultFavicon = !effectiveLogoUrl || effectiveLogoUrl === '/favicon.svg' || effectiveLogoUrl.endsWith('/favicon.svg');

  return (
    <div className={`flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 ${className}`}>
      {/* 1. Logo Container (Vector SVG trực tiếp nếu dùng favicon.svg, hoặc Img với fallback vector) */}
      {isDefaultFavicon || imageError ? (
        <div className={`flex items-center justify-center shrink-0 ${iconClassName}`}>
          <BrandFaviconSvg className={`${sc.box} transition-transform duration-200 group-hover:scale-105 shadow-md shadow-blue-500/20`} />
        </div>
      ) : (
        <div className={`flex items-center justify-center shrink-0 ${iconClassName}`}>
          <img
            src={effectiveLogoUrl}
            alt={titleText}
            onError={() => setImageError(true)}
            className={`${sc.img} object-contain transition-transform duration-200`}
          />
        </div>
      )}

      {/* 2. Brand Typography (Title & Tagline) */}
      {showText && (
        <div className={`flex flex-col leading-none text-left min-w-0 ${textClassName}`}>
          <span className={`${sc.title} tracking-tight text-slate-900 dark:text-white truncate`}>
            {titleText}
          </span>
          {showTagline && taglineText && (
            <span className={`${sc.tagline} text-slate-500 dark:text-slate-400 tracking-tight mt-0.5 ${size === 'sm' ? 'hidden sm:block' : 'block'} truncate`}>
              {taglineText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
