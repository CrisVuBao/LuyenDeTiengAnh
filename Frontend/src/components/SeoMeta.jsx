import React from 'react';
import { Helmet } from 'react-helmet-async';
import useBrandingStore from '../store/useBrandingStore';

export default function SeoMeta({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  structuredData
}) {
  const branding = useBrandingStore((s) => s.branding);

  const siteName = branding.brandName || 'VBaceEnglish';
  const defaultDesc = branding.slogan || 'Luyện phản xạ giao tiếp tiếng Anh 1500 câu, 3000 từ vựng Oxford với thuật toán FSRS, Shadowing thực chiến và trợ lý AI thông minh.';
  const finalDesc = description || defaultDesc;
  const fullTitle = title 
    ? `${title} | ${siteName}` 
    : `${siteName} — ${branding.tagline || 'Nền Tảng Học Tiếng Anh Giao Tiếp & Luyện Thi Đỉnh Cao'}`;
  const finalOgImage = ogImage || branding.logoUrl || '/favicon.svg';
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow, max-image-preview:large" />

      {/* Canonical Link */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDesc} />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDesc} />
      {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}

      {/* JSON-LD Structured Data for Google Rich Snippets */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
