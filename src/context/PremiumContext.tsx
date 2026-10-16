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
  loading: boolean;
  refresh: () => Promise<void>;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  isModalOpen: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [rawIsPremium, setRawIsPremium] = useState<boolean>(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('none');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Tracks the user ID for which entitlements were fetched to avoid redundant re-fetches
  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchEntitlements = useCallback(async (isInitial = false) => {
    const supabase = getSupabase();
    const userId = user?.id;

    // Check if user is a real authenticated user
    const isRealUser =
      Boolean(userId) &&
      !userId?.startsWith('guest') &&
      !userId?.startsWith('user-scholar') &&
      isAuthenticated;

    if (!supabase || !isRealUser) {
      setRawIsPremium(false);
      setPremiumUntil(null);
      setPlan(null);
      setStatus('none');
      setLoading(false);
      fetchedUserIdRef.current = null;
      return;
    }

    if (isInitial) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.rpc('get_my_entitlements');

      if (error) {
        console.warn('[Premium] get_my_entitlements RPC error:', error);
        setRawIsPremium(false);
        setPremiumUntil(null);
        setPlan(null);
        setStatus('none');
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          const rawUntil = row.premium_until ? String(row.premium_until) : null;
          const isUntilFuture = rawUntil
            ? new Date(rawUntil).getTime() > Date.now()
            : false;
          const active = Boolean(row.is_premium) && isUntilFuture;

          setRawIsPremium(active);
          setPremiumUntil(rawUntil);
          setPlan(row.plan ?? null);
          setStatus(row.status ?? 'none');
        } else {
          setRawIsPremium(false);
          setPremiumUntil(null);
          setPlan(null);
          setStatus('none');
        }
      }
    } catch (err) {
      console.warn('[Premium] Exception while fetching entitlements:', err);
      setRawIsPremium(false);
      setPremiumUntil(null);
      setPlan(null);
      setStatus('none');
    } finally {
      setLoading(false);
      fetchedUserIdRef.current = userId;
    }
  }, [user?.id, isAuthenticated]);

  // Initial fetch once after sign-in
  useEffect(() => {
    if (authLoading) return;

    if (user?.id !== fetchedUserIdRef.current) {
      fetchEntitlements(true);
    }
  }, [user?.id, authLoading, fetchEntitlements]);

  // Refresh on window focus or visibility change
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
    if (!premiumUntil || !rawIsPremium) return;

    const expiryTime = new Date(premiumUntil).getTime();
    const remainingMs = expiryTime - Date.now();

    if (remainingMs <= 0) {
      setRawIsPremium(false);
      return;
    }

    const timer = setTimeout(() => {
      setRawIsPremium(false);
    }, remainingMs + 50);

    return () => clearTimeout(timer);
  }, [premiumUntil, rawIsPremium]);

  // Dynamic derivation of isPremium: never true if expired
  const isPremium = Boolean(
    rawIsPremium &&
      premiumUntil &&
      new Date(premiumUntil).getTime() > Date.now()
  );

  const refresh = useCallback(async () => {
    await fetchEntitlements(false);
  }, [fetchEntitlements]);

  const openPremiumModal = useCallback(() => setIsModalOpen(true), []);
  const closePremiumModal = useCallback(() => setIsModalOpen(false), []);

  const value: PremiumContextType = {
    isPremium,
    premiumUntil,
    plan,
    status,
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
    // Return safe fallback if used outside provider (never grants premium)
    return {
      isPremium: false,
      premiumUntil: null,
      plan: null,
      status: 'none',
      loading: false,
      refresh: async () => {},
      openPremiumModal: () => {},
      closePremiumModal: () => {},
      isModalOpen: false,
    };
  }
  return context;
}
