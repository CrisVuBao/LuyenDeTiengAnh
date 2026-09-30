import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentNavbar from './StudentNavbar';
import BinoPlaylistModal from '../features/bino/components/BinoPlaylistModal';
import CelebrationEffects from '../features/gamification/components/CelebrationEffects';

import useBrandingStore from '../store/useBrandingStore';

export default function StudentLayout() {
  const branding = useBrandingStore((s) => s.branding);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Navbar Header */}
      <StudentNavbar />

      {/* Main Content Area (Full width, No sidebar, safe bottom clearance for mobile nav) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Trình phát âm thanh & Playlist toàn cục — Không bao giờ bị thoát khi chuyển trang */}
      <BinoPlaylistModal />
      <CelebrationEffects />

      {/* Simple Clean Footer */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50">
        <p>{branding.copyright || `© ${new Date().getFullYear()} ${branding.brandName} — By ${branding.companyName || 'Software'}. Nền tảng học và luyện thi tiếng Anh chuẩn quốc tế.`}</p>
      </footer>

    </div>
  );
}

