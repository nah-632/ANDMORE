'use client';

/**
 * Reveal on scroll (ADR-0002 motion system): CSS-only entrance,
 * IntersectionObserver adds .is-visible. Respects prefers-reduced-motion.
 * Zero dependencies — GPU-friendly (opacity + translate).
 */
import { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** Stagger delay in ms (for sibling reveals). */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
};

export function Reveal({ children, delay = 0, className = '', as = 'div' }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced motion or no IO support → show immediately.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
