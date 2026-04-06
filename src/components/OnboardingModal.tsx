import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function OnboardingModal({ open }: { open: boolean }) {
  const { t } = useTranslation();
  const { saveProfile } = useAuth();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [loading, setLoading] = useState(false);

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
            <Label htmlFor="dob" className="text-sm text-muted-foreground">
              {t("onboarding.dob")}
            </Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="bg-muted/30 border-copper text-foreground mt-1"
              required
            />
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
