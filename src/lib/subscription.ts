// Subscription feature gating logic
// Defines what each tier can access

import type { SubscriptionTier } from './products';

export interface TierFeatures {
  dailyHoroscope: boolean;
  dailyNumerology: boolean;
  oracleQuestionsPerDay: number; // -1 = unlimited
  palmScanBasic: boolean;
  palmScanFull: boolean;
  oracleFullChat: boolean;
  allFrequencies: boolean;
  archive7Day: boolean;
  communityAccess: boolean;
  showAds: boolean;
  directAccessDavid: boolean;
  monthlyGroupCalls: boolean;
  earlyAccess: boolean;
  exclusiveMerch: boolean;
  priorityEventTickets: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    dailyHoroscope: true,
    dailyNumerology: true,
    oracleQuestionsPerDay: 1,
    palmScanBasic: true,
    palmScanFull: false,
    oracleFullChat: false,
    allFrequencies: false,
    archive7Day: false,
    communityAccess: false,
    showAds: true,
    directAccessDavid: false,
    monthlyGroupCalls: false,
    earlyAccess: false,
    exclusiveMerch: false,
    priorityEventTickets: false,
  },
  essential: {
    dailyHoroscope: true,
    dailyNumerology: true,
    oracleQuestionsPerDay: -1, // unlimited
    palmScanBasic: true,
    palmScanFull: true,
    oracleFullChat: true,
    allFrequencies: true,
    archive7Day: true,
    communityAccess: true,
    showAds: false,
    directAccessDavid: false,
    monthlyGroupCalls: false,
    earlyAccess: false,
    exclusiveMerch: false,
    priorityEventTickets: false,
  },
  lifetime: {
    dailyHoroscope: true,
    dailyNumerology: true,
    oracleQuestionsPerDay: -1,
    palmScanBasic: true,
    palmScanFull: true,
    oracleFullChat: true,
    allFrequencies: true,
    archive7Day: true,
    communityAccess: true,
    showAds: false,
    directAccessDavid: false,
    monthlyGroupCalls: false,
    earlyAccess: false,
    exclusiveMerch: false,
    priorityEventTickets: false,
  },
  inner_circle: {
    dailyHoroscope: true,
    dailyNumerology: true,
    oracleQuestionsPerDay: -1,
    palmScanBasic: true,
    palmScanFull: true,
    oracleFullChat: true,
    allFrequencies: true,
    archive7Day: true,
    communityAccess: true,
    showAds: false,
    directAccessDavid: true,
    monthlyGroupCalls: true,
    earlyAccess: true,
    exclusiveMerch: true,
    priorityEventTickets: true,
  },
  founders: {
    // Founders get everything except David-specific perks
    dailyHoroscope: true,
    dailyNumerology: true,
    oracleQuestionsPerDay: -1,
    palmScanBasic: true,
    palmScanFull: true,
    oracleFullChat: true,
    allFrequencies: true,
    archive7Day: true,
    communityAccess: true,
    showAds: false,
    directAccessDavid: false, // Not for founders
    monthlyGroupCalls: false, // Not for founders
    earlyAccess: true, // Beta testers get early access
    exclusiveMerch: false,
    priorityEventTickets: false,
  },
};

// Get features for a tier
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
}

// Check if a tier has access to a specific feature
export function hasFeature(tier: SubscriptionTier, feature: keyof TierFeatures): boolean {
  const features = getTierFeatures(tier);
  const value = features[feature];
  
  // Handle numeric values (like oracleQuestionsPerDay)
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
}

// Check if user can perform action based on daily limits
export function canPerformAction(
  tier: SubscriptionTier,
  action: 'oracle_question' | 'palm_scan',
  usedToday: number
): { allowed: boolean; reason?: string } {
  const features = getTierFeatures(tier);
  
  if (action === 'oracle_question') {
    const limit = features.oracleQuestionsPerDay;
    if (limit === -1) return { allowed: true };
    if (usedToday >= limit) {
      return {
        allowed: false,
        reason: `You've used your ${limit} free Oracle question${limit > 1 ? 's' : ''} for today. Upgrade to Essential for unlimited access.`,
      };
    }
    return { allowed: true };
  }
  
  if (action === 'palm_scan') {
    if (!features.palmScanFull && usedToday >= 1) {
      return {
        allowed: false,
        reason: 'Free users get one basic palm scan. Upgrade to Essential for unlimited full readings.',
      };
    }
    return { allowed: true };
  }
  
  return { allowed: true };
}

// Compare tiers (for upgrade prompts)
export function isHigherTier(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'essential', 'lifetime', 'inner_circle', 'founders'];
  return tierOrder.indexOf(targetTier) > tierOrder.indexOf(currentTier);
}

// Get minimum required tier for a feature
export function getRequiredTierForFeature(feature: keyof TierFeatures): SubscriptionTier {
  const tierOrder: SubscriptionTier[] = ['free', 'essential', 'lifetime', 'inner_circle'];
  
  for (const tier of tierOrder) {
    if (hasFeature(tier, feature)) {
      return tier;
    }
  }
  
  return 'inner_circle';
}
