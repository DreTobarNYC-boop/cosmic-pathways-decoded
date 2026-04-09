import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "essential" | "lifetime" | "inner_circle" | "founders";

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  billing_interval: string | null;
  current_period_end: string | null;
}

interface UsageLimit {
  oracle_questions_used: number;
  palm_scans_used: number;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  usage: UsageLimit | null;
  isLoading: boolean;
  isPremium: boolean;
  canAccessFeature: (feature: FeatureKey) => boolean;
  incrementUsage: (feature: "oracle" | "palm") => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

type FeatureKey = 
  | "full_oracle"
  | "full_palm"
  | "frequencies"
  | "reading_archive"
  | "community"
  | "inner_circle_calls"
  | "early_access"
  | "merch"
  | "event_tickets";

// Feature access by tier
const FEATURE_ACCESS: Record<FeatureKey, SubscriptionTier[]> = {
  full_oracle: ["essential", "lifetime", "inner_circle", "founders"],
  full_palm: ["essential", "lifetime", "inner_circle", "founders"],
  frequencies: ["essential", "lifetime", "inner_circle", "founders"],
  reading_archive: ["essential", "lifetime", "inner_circle", "founders"],
  community: ["essential", "lifetime", "inner_circle", "founders"],
  inner_circle_calls: ["inner_circle", "founders"],
  early_access: ["inner_circle", "founders"],
  merch: ["inner_circle", "founders"],
  event_tickets: ["inner_circle", "founders"],
};

// Daily limits for free tier
const FREE_LIMITS = {
  oracle_questions: 1,
  palm_scans: 1,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageLimit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchUsage();
    } else {
      setSubscription(null);
      setUsage(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      // First check for founders access
      const { data: foundersData } = await supabase
        .from("founders_access")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (foundersData) {
        setSubscription({
          tier: "founders",
          status: "active",
          billing_interval: null,
          current_period_end: null,
        });
        setIsLoading(false);
        return;
      }

      // Then check regular subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status, billing_interval, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (data && !error) {
        setSubscription(data as Subscription);
      } else {
        // Default to free tier
        setSubscription({
          tier: "free",
          status: "active",
          billing_interval: null,
          current_period_end: null,
        });
      }
    } catch (err) {
      setSubscription({
        tier: "free",
        status: "active",
        billing_interval: null,
        current_period_end: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("usage_limits")
      .select("oracle_questions_used, palm_scans_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (data) {
      setUsage(data);
    } else {
      setUsage({ oracle_questions_used: 0, palm_scans_used: 0 });
    }
  };

  const isPremium = subscription?.tier !== "free";

  const canAccessFeature = (feature: FeatureKey): boolean => {
    if (!subscription) return false;
    return FEATURE_ACCESS[feature].includes(subscription.tier);
  };

  const incrementUsage = async (feature: "oracle" | "palm"): Promise<boolean> => {
    if (!user || !subscription) return false;

    // Premium users have no limits
    if (isPremium) return true;

    const today = new Date().toISOString().split("T")[0];
    const field = feature === "oracle" ? "oracle_questions_used" : "palm_scans_used";
    const limit = feature === "oracle" ? FREE_LIMITS.oracle_questions : FREE_LIMITS.palm_scans;
    const currentUsage = feature === "oracle" ? usage?.oracle_questions_used : usage?.palm_scans_used;

    if ((currentUsage || 0) >= limit) {
      return false;
    }

    // Upsert usage record
    const { error } = await supabase
      .from("usage_limits")
      .upsert(
        {
          user_id: user.id,
          date: today,
          [field]: (currentUsage || 0) + 1,
        },
        { onConflict: "user_id,date" }
      );

    if (!error) {
      await fetchUsage();
      return true;
    }

    return false;
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
    await fetchUsage();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        isLoading,
        isPremium,
        canAccessFeature,
        incrementUsage,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
