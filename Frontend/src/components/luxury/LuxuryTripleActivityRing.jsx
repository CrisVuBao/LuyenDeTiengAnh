import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

/**
 * LuxuryTripleActivityRing - Inspired by Apple Watch Ultra & Hermès Double Tour.
 * Features 3 concentric activity rings tracking:
 * 1. Outer Ring: Giao Tiếp Thực Chiến (Electric Sapphire #0071E3)
 * 2. Middle Ring: Phản Xạ 50 Chủ Đề (Hermès Saffron Amber #F59E0B)
 * 3. Inner Ring: 3000 Từ Vựng FSRS (Emerald Diamond #10B981)
 */
export default function LuxuryTripleActivityRing({
  ring1 = { label: 'Hội Thoại', percent: 0, color: '#0071E3' },
  ring2 = { label: 'Phản Xạ', percent: 0, color: '#38BDF8' },
  ring3 = { label: 'Từ Vựng', percent: 0, color: '#10B981' },
  overallScore = 0,
  size = 136
}) {
  // Ring geometry
  const center = 60;
  const strokeWidth = 5.2;

  // Ring 1 (Outer)
  const r1 = 48;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (Math.max(3, Math.min(100, ring1.percent)) / 100) * c1;

  // Ring 2 (Middle)
  const r2 = 38;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (Math.max(3, Math.min(100, ring2.percent)) / 100) * c2;

  // Ring 3 (Inner)
  const r3 = 28;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 - (Math.max(3, Math.min(100, ring3.percent)) / 100) * c3;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full -rotate-90 drop-shadow-sm"
        viewBox="0 0 120 120"
      >
        {/* Track 1 */}
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke={ring1.color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.16}
        />
        {/* Track 2 */}
        <circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke={ring2.color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.16}
        />
        {/* Track 3 */}
        <circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke={ring3.color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.16}
        />

        {/* Animated Progress 1 (Outer - Sapphire) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r1}
          fill="none"
          stroke={ring1.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c1}
          initial={{ strokeDashoffset: c1 }}
          animate={{ strokeDashoffset: offset1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Animated Progress 2 (Middle - Amber) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r2}
          fill="none"
          stroke={ring2.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c2}
          initial={{ strokeDashoffset: c2 }}
          animate={{ strokeDashoffset: offset2 }}
          transition={{ duration: 1.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Animated Progress 3 (Inner - Emerald) */}
        <motion.circle
          cx={center}
          cy={center}
          r={r3}
          fill="none"
          stroke={ring3.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c3}
          initial={{ strokeDashoffset: c3 }}
          animate={{ strokeDashoffset: offset3 }}
          transition={{ duration: 1.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Center Monogram / Mastery Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
          <AnimatedCounter value={overallScore} suffix="%" />
        </span>
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
          TỔNG HỢP
        </span>
      </div>
    </div>
  );
}
