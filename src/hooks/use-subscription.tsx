import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

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

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // PAYWALL DISABLED — everyone gets full access during testing
  const subscription: Subscription = {
    tier: "founders",
    status: "active",
    billing_interval: null,
    current_period_end: null,
  };

  const usage: UsageLimit = {
    oracle_questions_used: 0,
    palm_scans_used: 0,
  };

  const isPremium = true;

  const canAccessFeature = (_feature: FeatureKey): boolean => true;

  const incrementUsage = async (_feature: "oracle" | "palm"): Promise<boolean> => true;

  const refreshSubscription = async () => {};

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