'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const isNavigatingRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const currentPathRef = useRef(pathname);

  // Helper to clear all pending progress timers
  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  // Start progress bar animation
  const startProgress = () => {
    clearTimers();
    isNavigatingRef.current = true;
    setIsVisible(true);
    setProgress(30);

    // Gradual progression
    const t1 = setTimeout(() => {
      if (isNavigatingRef.current) setProgress(65);
    }, 150);

    const t2 = setTimeout(() => {
      if (isNavigatingRef.current) setProgress(85);
    }, 400);

    // Safety timeout: automatically finish and dismiss after 1.5s so it NEVER gets stuck
    const tSafety = setTimeout(() => {
      if (isNavigatingRef.current) {
        completeProgress();
      }
    }, 1500);

    timersRef.current.push(t1, t2, tSafety);
  };

  // Complete and hide progress bar
  const completeProgress = () => {
    clearTimers();
    isNavigatingRef.current = false;
    setProgress(100);

    const tFinish = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);

    timersRef.current.push(tFinish);
  };

  // Detect when route navigation finishes
  useEffect(() => {
    // If the path or search params changed, complete the bar
    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      if (isNavigatingRef.current || isVisible) {
        completeProgress();
      }
    }
  }, [pathname, searchParams, isVisible]);

  useEffect(() => {
    // Intercept clicks on internal links
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Only handle internal links that don't open in new tabs/downloads/anchors
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
        // If it's the exact same URL, do nothing
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        startProgress();
      }
    };

    // Custom event for programmatic navigation (e.g. card click with router.push)
    const handleCustomNavStart = () => {
      startProgress();
    };

    // Also handle browser back / forward buttons
    const handlePopState = () => {
      completeProgress();
    };

    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('app-nav-start', handleCustomNavStart);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimers();
      window.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('app-nav-start', handleCustomNavStart);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div 
        className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 0 ? 'none' : 'width 250ms ease-out, opacity 300ms ease',
        }}
      />
    </div>
  );
}
