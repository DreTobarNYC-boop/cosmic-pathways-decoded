import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fn = mode === "signup" ? signUp : signIn;
    const { error } = await fn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      if (mode === "signup") {
        toast.success(t("auth.accountCreated"));
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="card-cosmic border-copper sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground text-center">
            {mode === "signup" ? t("auth.signUpTitle") : t("auth.signInTitle")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {mode === "signup" ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm text-muted-foreground">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-xl"
            disabled={loading}
          >
            {loading ? "..." : mode === "signup" ? t("auth.createAccount") : t("auth.signIn")}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {mode === "signup" ? (
            <>{t("auth.alreadyHaveAccount")}{" "}
              <button className="text-gold underline" onClick={() => setMode("signin")}>{t("auth.signInLink")}</button>
            </>
          ) : (
            <>{t("auth.needAccount")}{" "}
              <button className="text-gold underline" onClick={() => setMode("signup")}>{t("auth.signUpLink")}</button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
