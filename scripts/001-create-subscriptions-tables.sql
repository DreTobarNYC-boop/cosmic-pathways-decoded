-- Create subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'essential', 'lifetime', 'inner_circle', 'founders');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, expired, paused
  billing_cycle TEXT, -- monthly, yearly, lifetime, null for free
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL, -- 'percentage', 'free_days'
  discount_value INTEGER NOT NULL, -- percentage (0-100) or days (30, 365)
  max_uses INTEGER, -- null for unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  tier_granted subscription_tier, -- for free access coupons
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create coupon redemptions table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- when the free access expires
  UNIQUE(coupon_id, user_id)
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inner circle seats tracker
CREATE TABLE IF NOT EXISTS inner_circle_seats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single row
  seats_taken INTEGER NOT NULL DEFAULT 0,
  max_seats INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial inner circle seats row
INSERT INTO inner_circle_seats (id, seats_taken, max_seats) VALUES (1, 0, 100)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON coupon_redemptions(user_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inner_circle_seats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- RLS Policies for coupons (admins can manage, users can read active coupons)
CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- RLS Policies for coupon_redemptions
CREATE POLICY "Users can view own redemptions" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem coupons" ON coupon_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for admins
CREATE POLICY "Admins can view admins" ON admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- RLS Policies for inner_circle_seats
CREATE POLICY "Anyone can view seats" ON inner_circle_seats
  FOR SELECT USING (true);

CREATE POLICY "Service role can update seats" ON inner_circle_seats
  FOR UPDATE USING (true);
