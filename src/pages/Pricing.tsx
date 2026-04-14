import { useState } from "react";

const tiers = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    description: "Begin your journey",
    features: [
      "Daily horoscope",
      "Daily numerology",
      "1 Oracle question per day",
      "Basic palm scan",
    ],
    cta: "Start Free",
    highlight: false,
    variantId: null,
  },
  {
    name: "Essential",
    monthlyPrice: "$8.88",
    annualPrice: "$88",
    description: "Full access to your frequency",
    features: [
      "Everything in Free",
      "Unlimited Oracle questions",
      "Full palm reading report",
      "All 432Hz & 528Hz frequencies",
      "7-day reading archive",
      "Ad-free experience",
      "Community access",
    ],
    cta: "Start Essential",
    highlight: true,
    monthlyVariantId: "ESSENTIAL_MONTHLY_VARIANT_ID",
    annualVariantId: "ESSENTIAL_ANNUAL_VARIANT_ID",
  },
  {
    name: "Lifetime",
    monthlyPrice: "$688",
    annualPrice: "$688",
    description: "One payment. Everything. Forever.",
    features: [
      "All Essential features",
      "All future features included",
      "Never pay again",
      "Founding member status",
    ],
    cta: "Get Lifetime Access",
    highlight: false,
    variantId: "LIFETIME_VARIANT_ID",
  },
  {
    name: "Inner Circle",
    monthlyPrice: "$1,888",
    annualPrice: "$1,888",
    description: "100 seats. Never reopens.",
    features: [
      "All Lifetime features",
      "Monthly private call with David",
      "Behind-the-scenes app access",
      "Early feature access",
      "Exclusive merchandise drops",
      "Priority event tickets",
      "Permanent seat at the table",
    ],
    cta: "Claim Your Seat",
    highlight: false,
    variantId: "INNER_CIRCLE_VARIANT_ID",
    cap: 100,
  },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1A1A] text-[#FFFDD0] px-4 py-12">
      <h1 className="text-center font-display text-3xl text-[#F5D060] mb-2">
        Choose Your Sanctuary
      </h1>
      <p className="text-center text-[#FFFDD0]/60 text-sm mb-8">
        Decode your frequency. Own your path.
      </p>

      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm ${!isAnnual ? "text-[#F5D060]" : "text-[#FFFDD0]/40"}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isAnnual ? "bg-[#F5D060]" : "bg-[#FFFDD0]/20"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              isAnnual ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm ${isAnnual ? "text-[#F5D060]" : "text-[#FFFDD0]/40"}`}>
          Annual <span className="text-xs text-green-400 ml-1">Save 17%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl p-6 border backdrop-blur-md flex flex-col ${
              tier.highlight
                ? "border-[#F5D060] bg-[#F5D060]/5"
                : "border-[#B87333]/20 bg-[#2A1F0F]/30"
            }`}
          >
            {tier.highlight && (
              <span className="text-xs text-[#0B1A1A] bg-[#F5D060] rounded-full px-3 py-0.5 self-start mb-3 font-bold">
                MOST POPULAR
              </span>
            )}
            {tier.cap && (
              <span className="text-xs text-red-400 border border-red-400/30 rounded-full px-3 py-0.5 self-start mb-3">
                100 SEATS ONLY
              </span>
            )}

            <h3 className="text-[#F5D060] font-display text-xl mb-1">{tier.name}</h3>
            <p className="text-[#FFFDD0]/50 text-xs mb-4">{tier.description}</p>

            <div className="mb-6">
              <span className="text-3xl font-bold text-[#FFFDD0]">
                {isAnnual ? tier.annualPrice : tier.monthlyPrice}
              </span>
              {tier.name === "Essential" && (
                <span className="text-[#FFFDD0]/40 text-sm ml-1">
                  {isAnnual ? "/yr" : "/mo"}
                </span>
              )}
              {(tier.name === "Lifetime" || tier.name === "Inner Circle") && (
                <span className="text-[#FFFDD0]/40 text-sm ml-1">one-time</span>
              )}
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#FFFDD0]/80">
                  <span className="text-[#F5D060] mt-0.5">✦</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-xl text-sm font-semibold tracking-widest transition-all ${
                tier.highlight
                  ? "bg-[#F5D060] text-[#0B1A1A] hover:bg-[#FFBF00]"
                  : tier.name === "Inner Circle"
                  ? "bg-transparent border border-[#F5D060] text-[#F5D060] hover:bg-[#F5D060]/10"
                  : "bg-[#FFFDD0]/10 text-[#FFFDD0] hover:bg-[#FFFDD0]/20"
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
