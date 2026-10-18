'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, the navigation has completed
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on internal links to start progress immediately
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Only trigger for internal links that don't open in new tabs/downloads/anchors
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !targetAttr &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // If it's navigating to the current exact URL, ignore
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        setIsVisible(true);
        setProgress(25);

        // Gradually increment to show ongoing progress
        const p1 = setTimeout(() => setProgress(55), 150);
        const p2 = setTimeout(() => setProgress(80), 400);

        // Cleanup if page doesn't switch
        return () => {
          clearTimeout(p1);
          clearTimeout(p2);
        };
      }
    };

    // Custom event listener for programmatic navigation (e.g., router.push)
    const handleCustomNavStart = () => {
      setIsVisible(true);
      setProgress(30);
      setTimeout(() => setProgress(75), 200);
    };

    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('app-nav-start', handleCustomNavStart);

    return () => {
      window.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('app-nav-start', handleCustomNavStart);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div 
        className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(251,191,36,0.8)]"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
