import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getTierFeatures, type TierFeatures } from '@/lib/subscription';
import type { SubscriptionTier } from '@/lib/products';

interface UsageData {
  oracle_questions_used: number;
  palm_scans_used: number;
}

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  features: TierFeatures;
  isLoading: boolean;
  usage: UsageData;
  innerCircleSeatsRemaining: number;
  refreshSubscription: () => Promise<void>;
  incrementUsage: (type: 'oracle_question' | 'palm_scan') => Promise<void>;
  canUseFeature: (feature: keyof TierFeatures) => boolean;
  canAskOracle: () => { allowed: boolean; reason?: string };
  canScanPalm: () => { allowed: boolean; reason?: string };
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [usage, setUsage] = useState<UsageData>({ oracle_questions_used: 0, palm_scans_used: 0 });
  const [innerCircleSeatsRemaining, setInnerCircleSeatsRemaining] = useState(100);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier('free');
      setUsage({ oracle_questions_used: 0, palm_scans_used: 0 });
      setIsLoading(false);
      return;
    }

    try {
      // Check founders access first (hidden tier)
      const { data: foundersData } = await supabase
        .from('founders_access')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (foundersData) {
        setTier('founders');
        setIsLoading(false);
        return;
      }

      // Check for active free-access coupon
      const { data: couponData } = await supabase
        .from('coupon_redemptions')
        .select(`
          access_expires_at,
          coupon_codes!inner(type)
        `)
        .eq('user_id', user.id)
        .eq('coupon_codes.type', 'free_access')
        .or('access_expires_at.is.null,access_expires_at.gt.now()')
        .limit(1);

      if (couponData && couponData.length > 0) {
        setTier('essential');
        setIsLoading(false);
        return;
      }

      // Check regular subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subData?.tier) {
        setTier(subData.tier as SubscriptionTier);
      } else {
        setTier('free');
      }

      // Fetch today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await supabase
        .from('usage_limits')
        .select('oracle_questions_used, palm_scans_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (usageData) {
        setUsage(usageData);
      } else {
        setUsage({ oracle_questions_used: 0, palm_scans_used: 0 });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setTier('free');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch Inner Circle seats count
  const fetchInnerCircleSeats = useCallback(async () => {
    const { count } = await supabase
      .from('inner_circle_seats')
      .select('*', { count: 'exact', head: true });
    
    setInnerCircleSeatsRemaining(100 - (count || 0));
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchInnerCircleSeats();
  }, [fetchSubscription, fetchInnerCircleSeats]);

  const incrementUsage = useCallback(async (type: 'oracle_question' | 'palm_scan') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const column = type === 'oracle_question' ? 'oracle_questions_used' : 'palm_scans_used';

    // Upsert usage record
    const { error } = await supabase
      .from('usage_limits')
      .upsert(
        {
          user_id: user.id,
          date: today,
          [column]: (type === 'oracle_question' ? usage.oracle_questions_used : usage.palm_scans_used) + 1,
        },
        { onConflict: 'user_id,date' }
      );

    if (!error) {
      setUsage(prev => ({
        ...prev,
        [column]: prev[column as keyof UsageData] + 1,
      }));
    }
  }, [user, usage]);

  const features = getTierFeatures(tier);

  const canUseFeature = useCallback((feature: keyof TierFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'number') return value !== 0;
    return Boolean(value);
  }, [features]);

  const canAskOracle = useCallback((): { allowed: boolean; reason?: string } => {
    const limit = features.oracleQuestionsPerDay;
    if (limit === -1) return { allowed: true };
    if (usage.oracle_questions_used >= limit) {
      return {
        allowed: false,
        reason: `You've used your ${limit} free Oracle question${limit > 1 ? 's' : ''} for today. Upgrade to Essential for unlimited access.`,
      };
    }
    return { allowed: true };
  }, [features, usage.oracle_questions_used]);

  const canScanPalm = useCallback((): { allowed: boolean; reason?: string } => {
    if (features.palmScanFull) return { allowed: true };
    if (usage.palm_scans_used >= 1) {
      return {
        allowed: false,
        reason: 'Free users get one basic palm scan per day. Upgrade to Essential for unlimited full readings.',
      };
    }
    return { allowed: true };
  }, [features, usage.palm_scans_used]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        features,
        isLoading,
        usage,
        innerCircleSeatsRemaining,
        refreshSubscription: fetchSubscription,
        incrementUsage,
        canUseFeature,
        canAskOracle,
        canScanPalm,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
