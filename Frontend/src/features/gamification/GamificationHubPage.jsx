import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Flame, Target, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LeaderboardPanel from './components/LeaderboardPanel';
import AchievementGallery from './components/AchievementGallery';
import StreakCalendar from './components/StreakCalendar';
import DailyQuestsPanel from './components/DailyQuestsPanel';
import useGamificationStore from './store/useGamificationStore';

export default function GamificationHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'leaderboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  const { profile, fetchProfile } = useGamificationStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'leaderboard', label: 'Bảng Xếp Hạng', icon: Trophy },
    { id: 'achievements', label: 'Huy Hiệu & Thành Tựu', icon: Award },
    { id: 'streak', label: 'Lịch Chuỗi Ngày', icon: Flame },
    { id: 'quests', label: 'Nhiệm Vụ Ngày', icon: Target }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={16} />
          <span>Quay lại Trang chủ</span>
        </button>

        {profile && (
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold shadow-xs">
            <span className="text-[#0071e3] dark:text-sky-400">
              Lv.{profile.currentLevel || 1} {profile.levelTitle || 'Tân binh'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-amber-500">
              {profile.totalXP || 0} Total XP
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-orange-500 flex items-center gap-1">
              <Flame size={13} className="fill-orange-500" />
              {profile.currentStreak || 0} ngày
            </span>
          </div>
        )}
      </div>

      {/* Main Tab Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'leaderboard' && <LeaderboardPanel />}
            {activeTab === 'achievements' && <AchievementGallery />}
            {activeTab === 'streak' && <StreakCalendar />}
            {activeTab === 'quests' && <DailyQuestsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
