import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Star, Crown, Sparkles, Users, Lock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type BillingCycle = "monthly" | "yearly";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  yearlyPrice?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
  tier: "free" | "essential" | "lifetime" | "inner_circle";
  hidden?: boolean; // Set to true to hide tier from public view
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Begin your cosmic journey",
    features: [
      "Daily horoscope reading",
      "Daily numerology insight",
      "1 Oracle question per day",
      "Basic palm scan",
      "No credit card required",
    ],
    cta: "Get Started",
    tier: "free",
  },
  {
    id: "essential",
    name: "Essential",
    price: "$8.88",
    yearlyPrice: "$88",
    description: "Unlock your full cosmic potential",
    features: [
      "Everything in Free",
      "Ad-free experience",
      "Unlimited Oracle conversations",
      "Full detailed palm reading",
      "All frequency tools",
      "7-day reading archive",
      "Full community access",
    ],
    highlighted: true,
    badge: "Most Popular",
    cta: "Subscribe Now",
    tier: "essential",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$688",
    description: "One payment, eternal access",
    features: [
      "Everything in Essential",
      "Lifetime access forever",
      "All current features",
      "All future features included",
      "Priority support",
      "Never pay again",
    ],
    badge: "Best Value",
    cta: "Get Lifetime Access",
    tier: "lifetime",
    hidden: true, // Hidden for now - payment processor concerns
  },
  {
    id: "inner_circle",
    name: "Inner Circle",
    price: "$1,888",
    description: "A permanent seat at the table",
    features: [
      "Everything in Lifetime",
      "Monthly private group call with David Christian",
      "Behind-the-scenes access",
      "Early access to all new features",
      "Exclusive physical merchandise drops",
      "Priority event tickets",
      "Limited to 100 members worldwide",
    ],
    badge: "Exclusive",
    cta: "Claim Your Seat",
    tier: "inner_circle",
    hidden: true, // Hidden for now - payment processor concerns
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [innerCircleSeats, setInnerCircleSeats] = useState({ taken: 0, max: 100 });
  const [currentTier, setCurrentTier] = useState<string | null>(null);

  useEffect(() => {
    fetchInnerCircleSeats();
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchInnerCircleSeats = async () => {
    const { data, error } = await supabase
      .from("inner_circle_seats")
      .select("*")
      .limit(1);
    
    if (data && data.length > 0) {
      setInnerCircleSeats({ taken: data.length, max: 100 });
    }
  };

  const fetchCurrentSubscription = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    
    if (data) {
      setCurrentTier(data.tier);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        toast({
          title: "Invalid coupon",
          description: "This coupon code is not valid or has expired.",
          variant: "destructive",
        });
        return;
      }

      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Coupon expired",
          description: "This coupon code has expired.",
          variant: "destructive",
        });
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
        toast({
          title: "Coupon exhausted",
          description: "This coupon has reached its maximum number of uses.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Coupon applied!",
        description: coupon.type === "free_access" 
          ? `You'll receive ${coupon.value} days of free access!`
          : `${coupon.value}% discount will be applied at checkout.`,
      });
      
      // Store coupon for checkout
      sessionStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.tier === "free") {
      if (!user) {
        navigate("/");
        toast({
          title: "Sign up to get started",
          description: "Create a free account to begin your cosmic journey.",
        });
      } else {
        navigate("/");
      }
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan.",
      });
      navigate("/");
      return;
    }

    // Check Inner Circle availability
    if (tier.tier === "inner_circle" && innerCircleSeats.taken >= innerCircleSeats.max) {
      toast({
        title: "Inner Circle is full",
        description: "All 100 seats have been claimed. This tier is permanently closed.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrate with Stripe checkout
    toast({
      title: "Redirecting to checkout...",
      description: `Setting up ${tier.name} subscription.`,
    });
  };

  const seatsRemaining = innerCircleSeats.max - innerCircleSeats.taken;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-primary">Choose Your Path</h1>
            <p className="text-sm text-muted-foreground">Unlock your cosmic potential</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-card/50 rounded-full p-1 flex items-center gap-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs opacity-75">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PRICING_TIERS.filter((t) => !t.hidden).map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border ${
                tier.highlighted
                  ? "border-primary bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-border/50 bg-card/30"
              } p-6 flex flex-col`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  {tier.id === "free" && <Sparkles className="w-6 h-6 text-primary" />}
                  {tier.id === "essential" && <Star className="w-6 h-6 text-primary" />}
                  {tier.id === "lifetime" && <Crown className="w-6 h-6 text-primary" />}
                  {tier.id === "inner_circle" && <Users className="w-6 h-6 text-primary" />}
                </div>

                <h3 className="font-display text-xl text-foreground mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                <div className="mb-2">
                  <span className="text-4xl font-bold text-primary">
                    {tier.id === "essential" && billingCycle === "yearly"
                      ? tier.yearlyPrice
                      : tier.price}
                  </span>
                  {tier.id === "essential" && (
                    <span className="text-muted-foreground ml-1">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  )}
                  {(tier.id === "lifetime" || tier.id === "inner_circle") && (
                    <span className="text-muted-foreground ml-1">one-time</span>
                  )}
                </div>

                {tier.id === "inner_circle" && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {seatsRemaining > 0 ? (
                      <>
                        <span className="text-primary font-semibold">{seatsRemaining}</span>
                        <span className="text-muted-foreground">seats remaining</span>
                      </>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Permanently Closed
                      </span>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(tier)}
                className={`w-full ${
                  tier.highlighted
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-card hover:bg-card/80 text-foreground border border-border"
                }`}
                disabled={
                  currentTier === tier.tier ||
                  (tier.id === "inner_circle" && seatsRemaining === 0)
                }
              >
                {currentTier === tier.tier ? "Current Plan" : tier.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Coupon Code Section */}
        <div className="max-w-md mx-auto">
          <div className="bg-card/30 rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg">Have a coupon code?</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-background/50 border-border/50 uppercase"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>

        {/* Inner Circle Warning - Hidden while tier is hidden */}
        {/* Uncomment when Inner Circle tier is re-enabled:
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card/20 rounded-2xl border border-primary/30 p-6">
            <Crown className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="font-display text-lg text-primary mb-2">
              Inner Circle: A Permanent Seat at the Table
            </h3>
            <p className="text-sm text-muted-foreground">
              Strictly capped at 100 members worldwide. Once all 100 seats are filled, 
              this tier closes forever with no exceptions. This is not a marketing tactic - 
              it&apos;s a commitment to maintain an intimate, high-value community.
            </p>
          </div>
        </div>
        */}
      </main>
    </div>
  );
}
