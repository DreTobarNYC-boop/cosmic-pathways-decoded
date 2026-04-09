-- DCode Payment System Database Schema
-- Creates tables for subscriptions, coupons, founders access, and admin management

-- Create subscription tier enum (includes hidden 'founders' tier)
CREATE TYPE subscription_tier AS ENUM ('free', 'essential', 'lifetime', 'inner_circle', 'founders');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE coupon_type AS ENUM ('free_access', 'percentage_discount');

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_interval TEXT, -- 'month', 'year', or null for one-time
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Inner Circle seats (capped at 100)
CREATE TABLE inner_circle_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seat_number INT CHECK (seat_number >= 1 AND seat_number <= 100) UNIQUE,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage tracking for free tier
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  oracle_questions_used INT DEFAULT 0,
  palm_scans_used INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Coupon codes table
CREATE TABLE coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type coupon_type NOT NULL,
  value INT NOT NULL, -- Days for free_access, percentage (1-100) for discount
  applies_to_tiers subscription_tier[] DEFAULT '{essential, lifetime, inner_circle}',
  max_uses INT, -- NULL = unlimited
  times_used INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Coupon redemptions tracking
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupon_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- For free_access coupons
  discount_applied INT, -- For percentage coupons, the actual $ discount
  UNIQUE(coupon_id, user_id)
);

-- Founders access table (hidden tier for team/beta testers)
CREATE TABLE founders_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT -- "Beta tester", "Team member", etc.
);

-- Admin users table (for dashboard access)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inner_circle_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE founders_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Inner Circle policies (anyone can view count, only service can insert)
CREATE POLICY "Anyone can view inner circle seats" ON inner_circle_seats
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage inner circle" ON inner_circle_seats
  FOR ALL USING (auth.role() = 'service_role');

-- Usage limits policies
CREATE POLICY "Users can view own usage" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Coupon codes policies
CREATE POLICY "Users can view active coupons for validation" ON coupon_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON coupon_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Coupon redemptions policies
CREATE POLICY "Users can view own redemptions" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions" ON coupon_redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage redemptions" ON coupon_redemptions
  FOR ALL USING (auth.role() = 'service_role');

-- Founders access policies
CREATE POLICY "Users can view own founders status" ON founders_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage founders" ON founders_access
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admin users policies
CREATE POLICY "Admins can view admin list" ON admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Function to get next available Inner Circle seat
CREATE OR REPLACE FUNCTION get_next_inner_circle_seat()
RETURNS INT AS $$
DECLARE
  next_seat INT;
BEGIN
  SELECT COALESCE(MAX(seat_number), 0) + 1 INTO next_seat FROM inner_circle_seats;
  IF next_seat > 100 THEN
    RETURN NULL; -- No seats available
  END IF;
  RETURN next_seat;
END;
$$ LANGUAGE plpgsql;

-- Function to check user's effective tier (considers founders + active coupons)
CREATE OR REPLACE FUNCTION get_user_effective_tier(p_user_id UUID)
RETURNS subscription_tier AS $$
DECLARE
  v_tier subscription_tier;
  v_has_founders BOOLEAN;
  v_has_active_coupon BOOLEAN;
BEGIN
  -- Check for founders access first (highest priority)
  SELECT EXISTS(SELECT 1 FROM founders_access WHERE user_id = p_user_id) INTO v_has_founders;
  IF v_has_founders THEN
    RETURN 'founders';
  END IF;
  
  -- Check for active free_access coupon
  SELECT EXISTS(
    SELECT 1 FROM coupon_redemptions cr
    JOIN coupon_codes cc ON cr.coupon_id = cc.id
    WHERE cr.user_id = p_user_id
    AND cc.type = 'free_access'
    AND (cr.access_expires_at IS NULL OR cr.access_expires_at > NOW())
  ) INTO v_has_active_coupon;
  
  IF v_has_active_coupon THEN
    RETURN 'essential'; -- Free access coupons grant Essential tier
  END IF;
  
  -- Return actual subscription tier
  SELECT tier INTO v_tier FROM subscriptions WHERE user_id = p_user_id AND status = 'active';
  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_limits_user_date ON usage_limits(user_id, date);
CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX idx_founders_access_user ON founders_access(user_id);
