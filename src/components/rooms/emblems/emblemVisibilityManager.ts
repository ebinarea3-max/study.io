'use client';

import { useEffect, useState, RefObject } from 'react';

type Listener = (canAnimate: boolean) => void;

interface RegisteredEmblem {
  id: string;
  element: HTMLElement;
  isStudying: boolean;
  isVisible: boolean;
  distanceFromCenter: number;
  notify: Listener;
}

class EmblemVisibilityManager {
  private emblems = new Map<string, RegisteredEmblem>();
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
          const id = (entry.target as HTMLElement).dataset.studyEmblemId;
          if (id && this.emblems.has(id)) {
            const emblem = this.emblems.get(id)!;
            const isVisible = entry.isIntersecting;
            if (emblem.isVisible !== isVisible) {
              emblem.isVisible = isVisible;
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
      this.emblems.forEach((emblem) => emblem.notify(false));
      return;
    }

    const vCenterX = window.innerWidth / 2;
    const vCenterY = window.innerHeight / 2;

    const candidates: RegisteredEmblem[] = [];

    this.emblems.forEach((emblem) => {
      if (emblem.isStudying && emblem.isVisible) {
        const rect = emblem.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        emblem.distanceFromCenter = Math.hypot(centerX - vCenterX, centerY - vCenterY);
        candidates.push(emblem);
      } else {
        emblem.notify(false);
      }
    });

    // Nearest to viewport center gets top priority
    candidates.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

    // Strict cap at 24 simultaneous active CSS animations
    const maxActive = 24;
    candidates.forEach((emblem, index) => {
      emblem.notify(index < maxActive);
    });
  }

  register(id: string, element: HTMLElement, isStudying: boolean, notify: Listener) {
    this.initObserver();
    const entry: RegisteredEmblem = {
      id,
      element,
      isStudying,
      isVisible: false,
      distanceFromCenter: Infinity,
      notify,
    };
    element.dataset.studyEmblemId = id;
    this.emblems.set(id, entry);
    this.observer?.observe(element);
    this.scheduleUpdate();
  }

  updateStudying(id: string, isStudying: boolean) {
    const entry = this.emblems.get(id);
    if (entry) {
      entry.isStudying = isStudying;
      this.scheduleUpdate();
    }
  }

  unregister(id: string) {
    const entry = this.emblems.get(id);
    if (entry) {
      this.observer?.unobserve(entry.element);
      this.emblems.delete(id);
      this.scheduleUpdate();
    }
  }
}

let managerInstance: EmblemVisibilityManager | null = null;

function getManager(): EmblemVisibilityManager | null {
  if (typeof window === 'undefined') return null;
  if (!managerInstance) {
    managerInstance = new EmblemVisibilityManager();
  }
  return managerInstance;
}

export function useCanAnimateEmblem(
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
