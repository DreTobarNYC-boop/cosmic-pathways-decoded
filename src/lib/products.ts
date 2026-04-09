// DCode Payment Products - Lemon Squeezy
// Source of truth for all subscription tiers and pricing
// Configure variant IDs in environment variables after creating products in Lemon Squeezy

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
  // Lemon Squeezy variant ID - configure in env vars
  variantId?: string;
}

// Lemon Squeezy configuration
export const LEMON_SQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '',
  // Variant IDs for each product (set in Lemon Squeezy dashboard)
  variants: {
    'essential-monthly': import.meta.env.VITE_LEMONSQUEEZY_ESSENTIAL_MONTHLY_VARIANT_ID || '',
    'essential-yearly': import.meta.env.VITE_LEMONSQUEEZY_ESSENTIAL_YEARLY_VARIANT_ID || '',
    'lifetime': import.meta.env.VITE_LEMONSQUEEZY_LIFETIME_VARIANT_ID || '',
    'inner-circle': import.meta.env.VITE_LEMONSQUEEZY_INNER_CIRCLE_VARIANT_ID || '',
  } as Record<string, string>,
};

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

// Get Lemon Squeezy variant ID for a product
export function getVariantId(productId: string): string | undefined {
  return LEMON_SQUEEZY_CONFIG.variants[productId];
}

// Build Lemon Squeezy checkout URL
export function buildCheckoutUrl(
  variantId: string,
  options?: {
    email?: string;
    userId?: string;
    discountCode?: string;
    redirectUrl?: string;
  }
): string {
  const params = new URLSearchParams();
  
  if (options?.email) {
    params.set('checkout[email]', options.email);
  }
  if (options?.userId) {
    params.set('checkout[custom][user_id]', options.userId);
  }
  if (options?.discountCode) {
    params.set('checkout[discount_code]', options.discountCode);
  }
  if (options?.redirectUrl) {
    params.set('checkout[custom][redirect_url]', options.redirectUrl);
  }
  
  const queryString = params.toString();
  return `https://dcode.lemonsqueezy.com/checkout/buy/${variantId}${queryString ? `?${queryString}` : ''}`;
}
