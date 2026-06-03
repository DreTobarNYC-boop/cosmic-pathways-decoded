import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PaywallModal } from "@/components/PaywallModal";

export type SubscriptionTier = "free" | "essential" | "lifetime" | "inner_circle" | "founders";

// ─────────────────────────────────────────────────────────────
// MASTER PAYWALL SWITCH
// false = everyone gets full access (testing mode — current)
// true  = free tier limits + paywall active (flip ON for June 11 launch)
// ─────────────────────────────────────────────────────────────
export const PAYWALL_ENABLED = false;

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
  /** True when paywall is active AND user is not premium — gate content with this */
  isLocked: boolean;
  canAccessFeature: (feature: FeatureKey) => boolean;
  incrementUsage: (feature: "oracle" | "palm") => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  /** Open the paywall modal from anywhere */
  openPaywall: (feature?: string) => void;
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
  const [isLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string | undefined>(undefined);

  // TODO (post-launch): read real subscription from Supabase / Whop webhook.
  // For now: when PAYWALL_ENABLED is false, everyone is premium (testing).
  // When true, everyone is treated as free until real subscription data is wired.
  const isPremium = !PAYWALL_ENABLED;
  const isLocked = PAYWALL_ENABLED && !isPremium;

  const subscription: Subscription = {
    tier: isPremium ? "founders" : "free",
    status: "active",
    billing_interval: null,
    current_period_end: null,
  };

  const usage: UsageLimit = {
    oracle_questions_used: 0,
    palm_scans_used: 0,
  };

  const canAccessFeature = (_feature: FeatureKey): boolean => isPremium;

  const incrementUsage = async (_feature: "oracle" | "palm"): Promise<boolean> => true;

  const refreshSubscription = async () => {};

  const openPaywall = useCallback((feature?: string) => {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        isLoading,
        isPremium,
        isLocked,
        canAccessFeature,
        incrementUsage,
        refreshSubscription,
        openPaywall,
      }}
    >
      {children}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        feature={paywallFeature}
      />
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