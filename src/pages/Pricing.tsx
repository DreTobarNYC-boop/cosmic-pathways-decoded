import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1A1A] text-[#FFFDD0] px-5 py-12 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#FFFDD0]/50 hover:text-[#FFFDD0] text-sm mb-10 transition-colors"
      >
        ← Back
      </button>

      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mb-6">
          <span className="text-2xl">✦</span>
        </div>

        <h1 className="text-center font-display text-3xl text-[#C5A059] mb-2">
          Unlock Full Access
        </h1>
        <p className="text-center text-[#FFFDD0]/50 text-sm mb-10">
          Every chamber. Every reading. Every day.
        </p>

        {/* Monthly */}
        <div className="w-full rounded-2xl border border-[#C5A059]/30 bg-[#C5A059]/5 p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#C5A059]/70 uppercase tracking-widest mb-1">Monthly</p>
              <div className="flex items-end gap-1">
                <span className="font-display text-4xl font-bold text-[#FFFDD0]">$8.88</span>
                <span className="text-[#FFFDD0]/40 text-sm mb-1">/mo</span>
              </div>
            </div>
            <span className="text-xs bg-[#C5A059] text-[#0B1A1A] rounded-full px-3 py-1 font-bold">
              MOST POPULAR
            </span>
          </div>
          <ul className="space-y-2 mb-6">
            {[
              "All 5 chambers — unlimited access",
              "Full palm reading with deep analysis",
              "Birth chart & natal wheel",
              "Unlimited Oracle questions",
              "5-year Dynasty forecast",
              "Monthly, yearly & love readings",
            ].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#FFFDD0]/75">
                <span className="text-[#C5A059] mt-0.5 shrink-0">✦</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => alert("Payments launching June 11th!")}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-widest bg-[#C5A059] text-[#0B1A1A] hover:bg-[#d4af37] transition-colors"
          >
            Coming Soon
          </button>
        </div>

        {/* Annual */}
        <div className="w-full rounded-2xl border border-[#FFFDD0]/15 bg-[#FFFDD0]/3 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#FFFDD0]/50 uppercase tracking-widest mb-1">Annual</p>
              <div className="flex items-end gap-1">
                <span className="font-display text-4xl font-bold text-[#FFFDD0]">$88</span>
                <span className="text-[#FFFDD0]/40 text-sm mb-1">/yr</span>
              </div>
              <p className="text-xs text-green-400 mt-1">Save $18.56 — 2 months free</p>
            </div>
          </div>
          <ul className="space-y-2 mb-6">
            {[
              "Everything in Monthly",
              "Best value — pay once a year",
              "Lock in your rate forever",
            ].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#FFFDD0]/75">
                <span className="text-[#C5A059] mt-0.5 shrink-0">✦</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => alert("Payments launching June 11th!")}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-widest border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors"
          >
            Coming Soon
          </button>
        </div>

        <p className="text-center text-[#FFFDD0]/25 text-xs mt-8">
          Cancel anytime · Secure payment
        </p>
      </div>
    </div>
  );
}
