import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

/**
 * LuxurySpotlightCard - Inspired by Apple Pro & Haute Horlogerie / Dior digital boutiques.
 * Tracks cursor position with high-precision GPU transforms to create an ethereal,
 * satin-sheen specular reflection moving across the glass surface.
 */
export default function LuxurySpotlightCard({
  children,
  className = '',
  contentClassName = '',
  spotlightColor = 'rgba(0, 113, 227, 0.08)', // Apple Sapphire blue default
  borderColor = 'rgba(0, 113, 227, 0.22)',
  onClick,
  hoverLift = true
}) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  };

  const backgroundRadial = useMotionTemplate`radial-gradient(550px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;
  const borderRadial = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${borderColor}, transparent 75%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={hoverLift ? { y: -4 } : {}}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-[30px] sm:rounded-[34px] bg-white dark:bg-[#0c101a] border border-slate-200/85 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_14px_36px_rgba(0,113,227,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Dynamic Specular Sheen Layer (Follows Mouse with 0ms Latency) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{ background: backgroundRadial }}
      />

      {/* Dynamic Interactive Border Glow Layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: 'inset 0 0 0 1px transparent',
          background: borderRadial,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px'
        }}
      />

      {/* Inner ambient hairline rim highlight (Apple/LV style) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent z-10" />

      {/* Actual Children Content */}
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </motion.div>
  );
}
