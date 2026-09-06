import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentNavbar from './StudentNavbar';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Navbar Header */}
      <StudentNavbar />

      {/* Main Content Area (Full width, No sidebar) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50">
        <p>© 2026 VBaceEnglish. Nền tảng học và luyện thi tiếng Anh chuẩn quốc tế.</p>
      </footer>

    </div>
  );
}
