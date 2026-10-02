import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

/**
 * LuxuryTripleActivityRing - Inspired by Apple Watch Ultra & Haute Horlogerie.
 * Supports interactive ring focus (`activeRingIndex`) and click-to-select pillar.
 * 1. Outer Ring (index 0): Giao Tiếp Thực Chiến (Electric Sapphire #0071E3)
 * 2. Middle Ring (index 1): Phản Xạ 50 Chủ Đề (Golden Amber #F59E0B)
 * 3. Inner Ring (index 2): 3000 Từ Vựng FSRS (Emerald Diamond #10B981)
 */
export default function LuxuryTripleActivityRing({
  ring1 = { label: 'Hội Thoại', percent: 0, color: '#0071E3' },
  ring2 = { label: 'Phản Xạ', percent: 0, color: '#F59E0B' },
  ring3 = { label: 'Từ Vựng', percent: 0, color: '#10B981' },
  overallScore = 0,
  activeRingIndex = null, // null = overall, 0 = ring1, 1 = ring2, 2 = ring3
  onSelectRing,
  size = 136
}) {
  const center = 60;
  const baseStroke = 5.4;

  const r1 = 48;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (Math.max(4, Math.min(100, ring1.percent)) / 100) * c1;

  const r2 = 38;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (Math.max(4, Math.min(100, ring2.percent)) / 100) * c2;

  const r3 = 28;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 - (Math.max(4, Math.min(100, ring3.percent)) / 100) * c3;

  const rings = [ring1, ring2, ring3];
  const focusedRing = activeRingIndex !== null && rings[activeRingIndex] ? rings[activeRingIndex] : null;
  const displayPercent = focusedRing ? focusedRing.percent : overallScore;
  const displayLabel = focusedRing ? focusedRing.label : 'TỔNG HỢP';
  const displayColor = focusedRing ? focusedRing.color : undefined;

  const getOpacity = (idx) => {
    if (activeRingIndex === null) return 1;
    return activeRingIndex === idx ? 1 : 0.25;
  };

  const getStroke = (idx) => {
    if (activeRingIndex === null) return baseStroke;
    return activeRingIndex === idx ? baseStroke + 1.4 : baseStroke - 0.6;
  };

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90 drop-shadow-xs" viewBox="0 0 120 120">
        {/* Track 1 */}
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke={ring1.color}
          strokeWidth={baseStroke}
          strokeOpacity={0.14}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(0);
            }
          }}
        />
        {/* Track 2 */}
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke={ring2.color}
          strokeWidth={baseStroke}
          strokeOpacity={0.14}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(1);
            }
          }}
        />
        {/* Track 3 */}
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke={ring3.color}
          strokeWidth={baseStroke}
          strokeOpacity={0.14}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(2);
            }
          }}
        />

        {/* Animated Progress 1 (Outer - Sapphire) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke={ring1.color}
          strokeLinecap="round"
          strokeDasharray={c1}
          initial={{ strokeDashoffset: c1 }}
          animate={{
            strokeDashoffset: offset1,
            strokeOpacity: getOpacity(0),
            strokeWidth: getStroke(0)
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(0);
            }
          }}
        />

        {/* Animated Progress 2 (Middle - Electric Violet) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke={ring2.color}
          strokeLinecap="round"
          strokeDasharray={c2}
          initial={{ strokeDashoffset: c2 }}
          animate={{
            strokeDashoffset: offset2,
            strokeOpacity: getOpacity(1),
            strokeWidth: getStroke(1)
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(1);
            }
          }}
        />

        {/* Animated Progress 3 (Inner - Emerald) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke={ring3.color}
          strokeLinecap="round"
          strokeDasharray={c3}
          initial={{ strokeDashoffset: c3 }}
          animate={{
            strokeDashoffset: offset3,
            strokeOpacity: getOpacity(2),
            strokeWidth: getStroke(2)
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={onSelectRing ? 'cursor-pointer' : ''}
          onClick={(e) => {
            if (onSelectRing) {
              e.stopPropagation();
              onSelectRing(2);
            }
          }}
        />
      </svg>

      {/* Center Monogram / Dynamic Mastery Score */}
      <div
        onClick={(e) => {
          if (onSelectRing) {
            e.stopPropagation();
            onSelectRing(null);
          }
        }}
        className={`absolute inset-0 flex flex-col items-center justify-center select-none ${
          onSelectRing ? 'cursor-pointer' : 'pointer-events-none'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayLabel}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center"
          >
            <span
              className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none"
              style={displayColor ? { color: displayColor } : undefined}
            >
              <AnimatedCounter value={displayPercent} suffix="%" />
            </span>
            <span className="text-[8.5px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              {displayLabel}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
