import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = 'VBaceEnglish — Nền Tảng Học Tiếng Anh Giao Tiếp & Luyện Thi Đỉnh Cao';
const DEFAULT_DESCRIPTION = 'Luyện phản xạ giao tiếp tiếng Anh 1500 câu, 3000 từ vựng Oxford với thuật toán FSRS, Shadowing thực chiến và trợ lý AI thông minh.';
const SITE_NAME = 'VBaceEnglish';
const DEFAULT_IMAGE = '/favicon.svg';

export default function SeoMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  canonicalUrl,
  structuredData
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow, max-image-preview:large" />

      {/* Canonical Link */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* JSON-LD Structured Data for Google Rich Snippets */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
