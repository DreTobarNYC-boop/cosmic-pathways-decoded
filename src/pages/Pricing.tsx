import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles, Star, Infinity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { PRODUCTS, getVariantId, buildCheckoutUrl, formatPrice, type Product } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tier, isLoading: subLoading } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [couponCode, setCouponCode] = useState("");
  const [innerCircleSeats, setInnerCircleSeats] = useState<number>(0);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);

  // Check for success/canceled from checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Welcome!",
        description: "Your subscription is now active. Enjoy full access to DCode.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Checkout canceled",
        description: "No worries - you can upgrade anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  // Fetch Inner Circle seats count
  useEffect(() => {
    async function fetchSeats() {
      const { count } = await supabase
        .from("inner_circle_seats")
        .select("*", { count: "exact", head: true });
      setInnerCircleSeats(count || 0);
      setIsLoadingSeats(false);
    }
    fetchSeats();
  }, []);

  const handleCheckout = (product: Product) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade your account.",
        variant: "destructive",
      });
      return;
    }

    const variantId = getVariantId(product.id);
    if (!variantId) {
      toast({
        title: "Configuration error",
        description: "This product is not configured yet. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    const checkoutUrl = buildCheckoutUrl(variantId, {
      email: user.email,
      userId: user.id,
      discountCode: couponCode || undefined,
      redirectUrl: window.location.origin + "/pricing?success=true",
    });

    window.location.href = checkoutUrl;
  };

  const essentialProduct = PRODUCTS.find(
    (p) => p.id === (billingCycle === "month" ? "essential-monthly" : "essential-yearly")
  );
  const lifetimeProduct = PRODUCTS.find((p) => p.id === "lifetime");
  const innerCircleProduct = PRODUCTS.find((p) => p.id === "inner-circle");

  const seatsRemaining = 100 - innerCircleSeats;
  const innerCircleSoldOut = seatsRemaining <= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Upgrade</h1>
          <p className="text-sm text-muted-foreground">Unlock your full potential</p>
        </div>
      </header>

      <main className="px-5 pb-10 space-y-6 max-w-lg mx-auto">
        {/* Current tier indicator */}
        {tier !== "free" && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-sm text-primary font-medium">
              You&apos;re currently on the <span className="capitalize">{tier}</span> plan
            </p>
          </div>
        )}

        {/* Billing toggle for Essential */}
        <div className="flex items-center justify-center gap-2 p-1 bg-muted/30 rounded-full max-w-xs mx-auto">
          <button
            onClick={() => setBillingCycle("month")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
              billingCycle === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("year")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
              billingCycle === "year"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-primary">Save 17%</span>
          </button>
        </div>

        {/* Essential Plan */}
        {essentialProduct && (
          <div className="relative bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary rounded-2xl p-6 space-y-4">
            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-bold">{essentialProduct.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{essentialProduct.description}</p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold">
                  {formatPrice(essentialProduct.priceInCents)}
                </div>
                <div className="text-xs text-muted-foreground">
                  /{billingCycle === "month" ? "month" : "year"}
                </div>
              </div>
            </div>
            <ul className="space-y-2">
              {essentialProduct.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(essentialProduct)}
              className="w-full"
              disabled={tier === "essential" || tier === "lifetime" || tier === "inner_circle" || tier === "founders"}
            >
              {tier === "essential" ? "Current Plan" : "Get Essential"}
            </Button>
          </div>
        )}

        {/* Lifetime Plan */}
        {lifetimeProduct && (
          <div className="bg-muted/20 border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Infinity className="w-5 h-5 text-amber-500" />
                  <h2 className="font-display text-lg font-bold">{lifetimeProduct.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{lifetimeProduct.description}</p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-bold">
                  {formatPrice(lifetimeProduct.priceInCents)}
                </div>
                <div className="text-xs text-muted-foreground">one-time</div>
              </div>
            </div>
            <ul className="space-y-2">
              {lifetimeProduct.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(lifetimeProduct)}
              variant="outline"
              className="w-full"
              disabled={tier === "lifetime" || tier === "inner_circle" || tier === "founders"}
            >
              {tier === "lifetime" ? "Current Plan" : "Get Lifetime Access"}
            </Button>
          </div>
        )}

        {/* Inner Circle */}
        {innerCircleProduct && (
          <div className="relative bg-gradient-to-br from-amber-900/20 via-background to-background border border-amber-500/30 rounded-2xl p-6 space-y-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h2 className="font-display text-lg font-bold">{innerCircleProduct.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{innerCircleProduct.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-amber-500">
                    {formatPrice(innerCircleProduct.priceInCents)}
                  </div>
                  <div className="text-xs text-muted-foreground">one-time</div>
                </div>
              </div>

              {/* Seat counter */}
              <div className="my-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">
                      {innerCircleSoldOut ? "Sold Out" : `${seatsRemaining} seats remaining`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {innerCircleSeats}/100 claimed
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                    style={{ width: `${(innerCircleSeats / 100) * 100}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-2">
                {innerCircleProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-muted-foreground mt-4 italic">
                Once 100 seats are filled, this tier closes forever. No exceptions.
              </p>

              <Button
                onClick={() => handleCheckout(innerCircleProduct)}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                disabled={innerCircleSoldOut || tier === "inner_circle" || tier === "founders"}
              >
                {tier === "inner_circle"
                  ? "You're in the Circle"
                  : innerCircleSoldOut
                  ? "Sold Out"
                  : "Join The Inner Circle"}
              </Button>
            </div>
          </div>
        )}

        {/* Coupon code */}
        <div className="bg-muted/20 rounded-xl p-4 space-y-3">
          <label className="text-sm font-medium">Have a coupon code?</label>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Coupon will be applied at checkout
          </p>
        </div>

        {/* Free tier features */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Free tier includes:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="bg-muted/30 px-2 py-1 rounded">Daily horoscope</span>
            <span className="bg-muted/30 px-2 py-1 rounded">Daily numerology</span>
            <span className="bg-muted/30 px-2 py-1 rounded">1 Oracle question/day</span>
            <span className="bg-muted/30 px-2 py-1 rounded">Basic palm scan</span>
          </div>
        </div>
      </main>
    </div>
  );
}
