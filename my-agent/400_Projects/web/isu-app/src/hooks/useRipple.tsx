'use client';

import { useState, useCallback } from 'react';

interface RippleDot {
  id: number;
  x: number;
  y: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<RippleDot[]>([]);

  const trigger = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dot: RippleDot = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setRipples(prev => [...prev, dot]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== dot.id)), 650);
  }, []);

  const elements = ripples.map(r => (
    <span
      key={r.id}
      className="ripple-el"
      style={{ left: r.x, top: r.y }}
    />
  ));

  return { trigger, elements };
}
