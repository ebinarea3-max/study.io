'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NavTabType } from './Navbar';

const TABS: NavTabType[] = ['timer', 'tasks', 'analytics', 'settings'];

interface SwipeTabContainerProps {
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  children: {
    timer: React.ReactNode;
    tasks: React.ReactNode;
    analytics: React.ReactNode;
    settings: React.ReactNode;
  };
}

export function SwipeTabContainer({
  activeTab,
  onChangeTab,
  children,
}: SwipeTabContainerProps) {
  const currentIndex = TABS.indexOf(activeTab);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalLockRef = useRef<boolean | null>(null);

  // Check if touch originated from a non-swipable element (horizontal carousels, sliders, text inputs)
  const isNonSwipableElement = (el: HTMLElement | null): boolean => {
    let curr = el;
    while (curr && curr !== document.body) {
      if (curr.getAttribute('data-no-swipe') === 'true') return true;
      if (curr.tagName === 'INPUT' || curr.tagName === 'TEXTAREA' || curr.tagName === 'SELECT') return true;
      // If element is horizontally scrollable
      const style = window.getComputedStyle(curr);
      if (
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        curr.scrollWidth > curr.clientWidth
      ) {
        return true;
      }
      curr = curr.parentElement;
    }
    return false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (isNonSwipableElement(target)) {
      touchStartRef.current = null;
      return;
    }

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    isHorizontalLockRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - touchStartRef.current.x;
    const dy = currentY - touchStartRef.current.y;

    // Disambiguate horizontal vs vertical swipe
    if (isHorizontalLockRef.current === null) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > 8 || absDy > 8) {
        // High ratio threshold to prevent accidental hijacking of vertical scroll
        if (absDx > absDy * 1.25) {
          isHorizontalLockRef.current = true;
          setIsDragging(true);
        } else {
          isHorizontalLockRef.current = false;
          touchStartRef.current = null;
          return;
        }
      }
    }

    if (isHorizontalLockRef.current) {
      // Rubber-band resistance at boundary edges
      let effectiveDx = dx;
      if ((currentIndex === 0 && dx > 0) || (currentIndex === TABS.length - 1 && dx < 0)) {
        effectiveDx = dx * 0.25;
      }
      setDragX(effectiveDx);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !isHorizontalLockRef.current) {
      touchStartRef.current = null;
      isHorizontalLockRef.current = null;
      setIsDragging(false);
      setDragX(0);
      return;
    }

    const dt = Math.max(1, Date.now() - touchStartRef.current.time);
    const velocity = Math.abs(dragX) / dt; // px/ms
    const distanceThreshold = 80; // px
    const velocityThreshold = 0.28; // px/ms

    if ((Math.abs(dragX) > distanceThreshold || velocity > velocityThreshold) && Math.abs(dragX) > 25) {
      if (dragX < 0 && currentIndex < TABS.length - 1) {
        // Swipe Left -> Next Tab
        onChangeTab(TABS[currentIndex + 1]);
      } else if (dragX > 0 && currentIndex > 0) {
        // Swipe Right -> Previous Tab
        onChangeTab(TABS[currentIndex - 1]);
      }
    }

    // Reset drag with spring transition
    touchStartRef.current = null;
    isHorizontalLockRef.current = null;
    setIsDragging(false);
    setDragX(0);
  };

  return (
    <div
      className="w-full overflow-hidden relative flex-1 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 4-Column Sliding Track */}
      <div
        className="flex w-full flex-1"
        style={{
          width: '400%',
          transform: `translateX(calc(-${currentIndex * 25}% + ${dragX}px))`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      >
        {TABS.map((tab, idx) => (
          <div
            key={tab}
            className="w-1/4 flex-shrink-0 flex flex-col transition-opacity duration-300"
            style={{
              opacity: isDragging
                ? Math.max(0.6, 1 - Math.abs(dragX) / 300)
                : currentIndex === idx
                ? 1
                : 0.3,
            }}
          >
            {children[tab]}
          </div>
        ))}
      </div>
    </div>
  );
}
