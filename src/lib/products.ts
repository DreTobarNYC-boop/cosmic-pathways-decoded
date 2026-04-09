// DCode Payment Products
// Source of truth for all subscription tiers and pricing

export type SubscriptionTier = 'free' | 'essential' | 'lifetime' | 'inner_circle' | 'founders';

export interface Product {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceInCents: number;
  billingInterval?: 'month' | 'year' | 'one_time';
  features: string[];
  highlighted?: boolean;
  limitedSeats?: number;
  badge?: string;
}

// Free tier features (baseline)
export const FREE_FEATURES = [
  'Daily horoscope',
  'Daily numerology',
  '1 Oracle question per day',
  'Basic palm scan',
];

// Essential tier features
export const ESSENTIAL_FEATURES = [
  ...FREE_FEATURES,
  'No ads',
  'Full Oracle chat (unlimited)',
  'Full palm reading analysis',
  'All frequency scans',
  '7-day reading archive',
  'Full community access',
];

// Lifetime features (same as Essential)
export const LIFETIME_FEATURES = [
  ...ESSENTIAL_FEATURES,
  'One-time payment',
  'Lifetime access forever',
];

// Inner Circle features
export const INNER_CIRCLE_FEATURES = [
  ...LIFETIME_FEATURES,
  'Direct access to David Christian',
  'Monthly private group calls with David',
  'Behind-the-scenes access',
  'Early access to all new features',
  'Exclusive physical merchandise drops',
  'Priority event tickets',
];

export const PRODUCTS: Product[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    description: 'Begin your cosmic journey',
    priceInCents: 0,
    features: FREE_FEATURES,
  },
  {
    id: 'essential-monthly',
    tier: 'essential',
    name: 'Essential',
    description: 'Unlock the full experience',
    priceInCents: 888, // $8.88
    billingInterval: 'month',
    features: ESSENTIAL_FEATURES,
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'essential-yearly',
    tier: 'essential',
    name: 'Essential (Annual)',
    description: 'Best value - save $18.56/year',
    priceInCents: 8800, // $88/year
    billingInterval: 'year',
    features: ESSENTIAL_FEATURES,
    badge: 'Best Value',
  },
  {
    id: 'lifetime',
    tier: 'lifetime',
    name: 'Lifetime',
    description: 'Own it forever',
    priceInCents: 68800, // $688
    billingInterval: 'one_time',
    features: LIFETIME_FEATURES,
  },
  {
    id: 'inner-circle',
    tier: 'inner_circle',
    name: 'The Inner Circle',
    description: 'A permanent seat at the table',
    priceInCents: 188800, // $1,888
    billingInterval: 'one_time',
    features: INNER_CIRCLE_FEATURES,
    limitedSeats: 100,
    badge: 'Exclusive',
  },
];

// Helper to get product by ID
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}

// Helper to get products by tier
export function getProductsByTier(tier: SubscriptionTier): Product[] {
  return PRODUCTS.filter(p => p.tier === tier);
}

// Format price for display
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
}

// Get price display string
export function getPriceDisplay(product: Product): string {
  if (product.priceInCents === 0) return 'Free';
  
  const price = formatPrice(product.priceInCents);
  
  switch (product.billingInterval) {
    case 'month':
      return `${price}/month`;
    case 'year':
      return `${price}/year`;
    case 'one_time':
      return `${price} once`;
    default:
      return price;
  }
}
