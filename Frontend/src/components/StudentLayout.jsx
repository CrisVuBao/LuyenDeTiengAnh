import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import StudentNavbar from './StudentNavbar';
import BinoPlaylistModal from '../features/bino/components/BinoPlaylistModal';
import CelebrationEffects from '../features/gamification/components/CelebrationEffects';

import useBrandingStore from '../store/useBrandingStore';

function ProgressivePageSkeleton() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-fade-in">
      <div className="h-56 sm:h-72 rounded-[28px] bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div className="flex gap-2">
          <div className="h-6 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-2/3 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-1/2 rounded-lg bg-slate-200/60 dark:bg-slate-800/70 animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-40 rounded-full bg-[#0071e3]/20 animate-pulse" />
          <div className="h-10 w-32 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-36 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 animate-pulse" />
        <div className="h-36 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 animate-pulse" />
        <div className="h-36 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function StudentLayout() {
  const branding = useBrandingStore((s) => s.branding);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Navbar Header */}
      <StudentNavbar />

      {/* Main Content Area (Full width, No sidebar, safe bottom clearance for mobile nav) */}
      <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 md:py-8 pb-24 md:pb-8 overflow-x-clip">
        <Suspense fallback={<ProgressivePageSkeleton />}>
          <Outlet />
        </Suspense>
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

