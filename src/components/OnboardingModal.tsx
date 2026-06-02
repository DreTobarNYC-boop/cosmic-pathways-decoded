import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/AuthModal";
import { toast } from "sonner";

export function OnboardingModal({ open }: { open: boolean }) {
  const { t, i18n } = useTranslation();
  const { saveProfile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [name, setName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay]   = useState("");
  const [dobYear, setDobYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Combine into YYYY-MM-DD for saveProfile
  const dob = dobYear && dobMonth && dobDay
    ? `${dobYear}-${dobMonth}-${dobDay}`
    : "";

  // Month names auto-translated via browser locale — no translation keys needed
  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, "0"),
      label: new Intl.DateTimeFormat(i18n.language, { month: "long" })
        .format(new Date(2000, i, 1)),
    })),
  [i18n.language]);

  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0"));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) =>
    String(currentYear - i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) return;

    setLoading(true);
    const { error } = await saveProfile({
      fullName: name,
      dateOfBirth: dob,
      birthPlace: birthPlace || null,
      birthTime: birthTime || null,
    });
    setLoading(false);

    if (error) {
      toast.error("Failed to save profile: " + error);
    }
  };

  return (
    <>
    <Dialog open={open}>
      <DialogContent
        className="card-cosmic border-copper sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground text-center">
            {t("onboarding.title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {t("onboarding.subtitle")}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              {t("onboarding.fullName")}
            </Label>
            <Input
              id="name"
              placeholder={t("onboarding.fullNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
              required
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {t("onboarding.fullNameHint")}
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">
              {t("onboarding.dob")}
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {/* Month */}
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                required
                className="col-span-1 bg-muted/30 border border-input rounded-md px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="" disabled>MM</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              {/* Day */}
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                required
                className="bg-muted/30 border border-input rounded-md px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="" disabled>DD</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Year */}
              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                required
                className="bg-muted/30 border border-input rounded-md px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="" disabled>YYYY</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="birthPlace" className="text-sm text-muted-foreground">
              {t("onboarding.birthPlace")}
            </Label>
            <Input
              id="birthPlace"
              placeholder={t("onboarding.birthPlacePlaceholder")}
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {t("onboarding.birthPlaceHint")}
            </p>
          </div>
          <div>
            <Label htmlFor="birthTime" className="text-sm text-muted-foreground">
              {t("onboarding.birthTime")}
            </Label>
            <Input
              id="birthTime"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="bg-muted/30 border-copper text-foreground mt-1"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {t("onboarding.birthTimeHint")}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-xl"
            disabled={loading || !name || !dob}
          >
            {loading ? t("onboarding.submitting") : t("onboarding.submit")}
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-1">
            {t("auth.alreadyHaveAccount")}{" "}
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {t("auth.signInLink")}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>

    <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
