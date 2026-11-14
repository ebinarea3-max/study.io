'use client';

import { useEffect, useState, RefObject } from 'react';

type Listener = (canAnimate: boolean) => void;

interface RegisteredIcon {
  id: string;
  element: HTMLElement;
  isStudying: boolean;
  isVisible: boolean;
  distanceFromCenter: number;
  notify: Listener;
}

class IconVisibilityManager {
  private icons = new Map<string, RegisteredIcon>();
  private observer: IntersectionObserver | null = null;
  private isTabVisible = true;
  private rafId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isTabVisible = !document.hidden;
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('scroll', this.scheduleUpdate, { passive: true });
      window.addEventListener('resize', this.scheduleUpdate, { passive: true });
    }
  }

  private initObserver() {
    if (this.observer || typeof window === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.studyIconId;
          if (id && this.icons.has(id)) {
            const icon = this.icons.get(id)!;
            const isVisible = entry.isIntersecting;
            if (icon.isVisible !== isVisible) {
              icon.isVisible = isVisible;
              changed = true;
            }
          }
        });
        if (changed) {
          this.scheduleUpdate();
        }
      },
      { threshold: 0.1 }
    );
  }

  private handleVisibilityChange = () => {
    this.isTabVisible = !document.hidden;
    this.scheduleUpdate();
  };

  private scheduleUpdate = () => {
    if (this.rafId !== null) return;
    this.rafId = window.requestAnimationFrame(() => {
      this.rafId = null;
      this.recalculateAnimationSlots();
    });
  };

  private recalculateAnimationSlots() {
    if (typeof window === 'undefined') return;

    if (!this.isTabVisible) {
      // Pause all icons when tab is hidden
      this.icons.forEach((icon) => icon.notify(false));
      return;
    }

    const vCenterX = window.innerWidth / 2;
    const vCenterY = window.innerHeight / 2;

    const candidates: RegisteredIcon[] = [];

    this.icons.forEach((icon) => {
      if (icon.isStudying && icon.isVisible) {
        const rect = icon.element.getBoundingClientRect();
        const iconCenterX = rect.left + rect.width / 2;
        const iconCenterY = rect.top + rect.height / 2;
        const dist = Math.hypot(iconCenterX - vCenterX, iconCenterY - vCenterY);
        icon.distanceFromCenter = dist;
        candidates.push(icon);
      } else {
        icon.notify(false);
      }
    });

    // Sort by distance to viewport center (nearest first)
    candidates.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

    // Cap at 24 simultaneously animated icons
    const maxActive = 24;
    candidates.forEach((icon, index) => {
      icon.notify(index < maxActive);
    });
  }

  register(id: string, element: HTMLElement, isStudying: boolean, notify: Listener) {
    this.initObserver();
    const entry: RegisteredIcon = {
      id,
      element,
      isStudying,
      isVisible: false,
      distanceFromCenter: Infinity,
      notify,
    };
    element.dataset.studyIconId = id;
    this.icons.set(id, entry);
    this.observer?.observe(element);
    this.scheduleUpdate();
  }

  updateStudying(id: string, isStudying: boolean) {
    const entry = this.icons.get(id);
    if (entry) {
      entry.isStudying = isStudying;
      this.scheduleUpdate();
    }
  }

  unregister(id: string) {
    const entry = this.icons.get(id);
    if (entry) {
      this.observer?.unobserve(entry.element);
      this.icons.delete(id);
      this.scheduleUpdate();
    }
  }
}

let managerInstance: IconVisibilityManager | null = null;

function getManager(): IconVisibilityManager | null {
  if (typeof window === 'undefined') return null;
  if (!managerInstance) {
    managerInstance = new IconVisibilityManager();
  }
  return managerInstance;
}

export function useCanAnimateIcon(
  ref: RefObject<HTMLElement | null>,
  isStudying: boolean
): boolean {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const manager = getManager();
    if (!manager) return;

    const id = Math.random().toString(36).slice(2, 9);
    manager.register(id, el, isStudying, setCanAnimate);

    return () => {
      manager.unregister(id);
    };
  }, [ref, isStudying]);

  return canAnimate;
}
