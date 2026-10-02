import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Flame, Target, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LeaderboardPanel from './components/LeaderboardPanel';
import AchievementGallery from './components/AchievementGallery';
import StreakCalendar from './components/StreakCalendar';
import DailyQuestsPanel from './components/DailyQuestsPanel';
import useGamificationStore from './store/useGamificationStore';
import useBrandingStore from '../../store/useBrandingStore';
import SeoMeta from '../../components/SeoMeta';

export default function GamificationHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'leaderboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const brandName = useBrandingStore((s) => s.branding.brandName);

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
      <SeoMeta
        title="Bảng Xếp Hạng & Đấu Trường Danh Vọng"
        description={`Theo dõi thứ hạng tuần, huy hiệu thành tích và chuỗi ngày học tập tại ${brandName}.`}
      />
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => navigate('/home')}
          className="duo-btn duo-btn-white duo-btn-xs inline-flex items-center gap-2 self-start"
        >
          <ArrowLeft size={16} />
          <span>Quay lại Trang chủ</span>
        </button>

        {profile && (
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <span className="px-3.5 py-1.5 rounded-full duo-card text-xs font-black text-[#1cb0f6] dark:text-[#1cb0f6]">
              Lv.{profile.currentLevel || 1} {profile.levelTitle || 'Tân binh'}
            </span>
            <span className="duo-pill-xp text-xs font-black">
              ⚡ {profile.totalXP || 0} XP
            </span>
            <span className="duo-pill-streak text-xs font-black">
              🔥 {profile.currentStreak || 0} ngày
            </span>
          </div>
        )}
      </div>

      {/* Main Tab Pills (Duolingo 3D Feather Tabs) */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar sm:flex-wrap pb-2 w-full max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          let activeClass = 'duo-btn-blue';
          if (tab.id === 'leaderboard') activeClass = 'duo-btn-yellow';
          if (tab.id === 'achievements') activeClass = 'duo-btn-purple';
          if (tab.id === 'streak') activeClass = 'duo-btn-orange';
          if (tab.id === 'quests') activeClass = 'duo-btn-green';

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap shrink-0 uppercase tracking-wide ${
                isActive
                  ? `duo-btn ${activeClass}`
                  : 'duo-btn duo-btn-white text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon size={16} className={`shrink-0 ${isActive ? 'animate-duo-bounce' : ''}`} />
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
