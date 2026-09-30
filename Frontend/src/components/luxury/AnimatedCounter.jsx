import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * AnimatedCounter - Apple & luxury watch grade smooth rolling odometer.
 * Smoothly interpolates from prev value to target value with spring physics.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1.2,
  className = '',
  suffix = '',
  prefix = ''
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  return (
    <span className={`inline-block tabular-nums font-feature-settings-tnum ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}
