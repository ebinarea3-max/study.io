'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { PremiumModal } from '../components/premium/PremiumModal';

export interface PremiumContextType {
  isPremium: boolean;
  premiumUntil: string | null;
  plan: string | null;
  status: string;
  cancelAtCycleEnd: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  isModalOpen: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [rawIsPremium, setRawIsPremium] = useState<boolean>(false);
  const [premiumUntilDate, setPremiumUntilDate] = useState<Date | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('none');
  const [cancelAtCycleEnd, setCancelAtCycleEnd] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Single error logging guard
  const hasLoggedErrorRef = useRef(false);

  const fetchEntitlements = useCallback(async (isInitial = false) => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    if (isInitial) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.rpc('get_my_entitlements');
      console.log('[usePremium] Raw RPC response:', { data, error });

      if (error) {
        if (!hasLoggedErrorRef.current) {
          console.warn('[usePremium] get_my_entitlements error:', error);
          hasLoggedErrorRef.current = true;
        }
        // If initial and error occurred (such as unauthenticated), reset to free
        if (isInitial) {
          setRawIsPremium(false);
          setPremiumUntilDate(null);
          setPlan(null);
          setStatus('none');
          setCancelAtCycleEnd(false);
        }
      } else {
        hasLoggedErrorRef.current = false;
        // Supabase returns table functions as an array of rows
        const row = Array.isArray(data) ? data[0] : data;
        console.log('[usePremium] Parsed entitlement row:', row);

        // Map snake_case columns to app's names:
        const serverIsPremium = Boolean(row?.is_premium);
        const parsedUntil = row?.premium_until ? new Date(row.premium_until) : null;
        const isValidDate = parsedUntil instanceof Date && !isNaN(parsedUntil.getTime());
        const mappedPlan = row?.plan ?? null;
        const mappedStatus = row?.status ?? 'none';
        const mappedCancelAtCycleEnd = Boolean(row?.cancel_at_cycle_end);

        // Trust the server's is_premium value.
        // The only local check allowed is: if premiumUntil is a VALID date (not NaN)
        // and current time is past it, treat user as free.
        // An unparseable or missing date must never turn a premium user into a free one.
        let isPrem = serverIsPremium;
        if (serverIsPremium && isValidDate && parsedUntil.getTime() <= Date.now()) {
          isPrem = false;
        }

        console.log('[usePremium] Computed entitlement state:', {
          serverIsPremium,
          isPrem,
          parsedUntil,
          isValidDate,
          mappedPlan,
          mappedStatus,
          mappedCancelAtCycleEnd,
        });

        setRawIsPremium(isPrem);
        setPremiumUntilDate(isValidDate ? parsedUntil : null);
        setPlan(mappedPlan);
        setStatus(mappedStatus);
        setCancelAtCycleEnd(mappedCancelAtCycleEnd);
      }
    } catch (err) {
      if (!hasLoggedErrorRef.current) {
        console.warn('[usePremium] Exception fetching entitlements:', err);
        hasLoggedErrorRef.current = true;
      }
    } finally {
      // loading must always become false, even when the call fails
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount & auth state subscription
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    fetchEntitlements(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log('[usePremium] onAuthStateChange event:', event);
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        fetchEntitlements(false);
      } else if (event === 'SIGNED_OUT') {
        setRawIsPremium(false);
        setPremiumUntilDate(null);
        setPlan(null);
        setStatus('none');
        setCancelAtCycleEnd(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEntitlements]);

  // Refresh on user ID changes if present
  useEffect(() => {
    if (user?.id && !user.id.startsWith('guest')) {
      fetchEntitlements(false);
    }
  }, [user?.id, fetchEntitlements]);

  // Listen to custom auth events from AuthContext
  useEffect(() => {
    const handleAuthChanged = () => {
      fetchEntitlements(false);
    };
    window.addEventListener('studypulse:auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('studypulse:auth-changed', handleAuthChanged);
    };
  }, [fetchEntitlements]);

  // Refresh on window focus and visibility change
  useEffect(() => {
    const onFocus = () => {
      fetchEntitlements(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEntitlements(false);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchEntitlements]);

  // Self-expiration: turn isPremium false on its own when current time passes premiumUntil
  useEffect(() => {
    if (!rawIsPremium || !premiumUntilDate) return;

    const remainingMs = premiumUntilDate.getTime() - Date.now();
    if (remainingMs <= 0) {
      setRawIsPremium(false);
      return;
    }

    const timer = setTimeout(() => {
      setRawIsPremium(false);
    }, remainingMs + 50);

    return () => clearTimeout(timer);
  }, [rawIsPremium, premiumUntilDate]);

  // The only local check allowed is: if premiumUntil is a VALID date (not NaN) and the current time is past it, treat user as free
  const isPastExpiry =
    premiumUntilDate instanceof Date &&
    !isNaN(premiumUntilDate.getTime()) &&
    premiumUntilDate.getTime() <= Date.now();

  const isPremium = rawIsPremium && !isPastExpiry;

  const refresh = useCallback(async () => {
    await fetchEntitlements(false);
  }, [fetchEntitlements]);

  const openPremiumModal = useCallback(() => setIsModalOpen(true), []);
  const closePremiumModal = useCallback(() => setIsModalOpen(false), []);

  const value: PremiumContextType = {
    isPremium,
    premiumUntil: premiumUntilDate ? premiumUntilDate.toISOString() : null,
    plan,
    status,
    cancelAtCycleEnd,
    loading,
    refresh,
    openPremiumModal,
    closePremiumModal,
    isModalOpen,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
      <PremiumModal isOpen={isModalOpen} onClose={closePremiumModal} />
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    return {
      isPremium: false,
      premiumUntil: null,
      plan: null,
      status: 'none',
      cancelAtCycleEnd: false,
      loading: false,
      refresh: async () => {},
      openPremiumModal: () => {},
      closePremiumModal: () => {},
      isModalOpen: false,
    };
  }
  return context;
}
