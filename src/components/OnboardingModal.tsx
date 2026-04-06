import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (data: { name: string; dob: string }) => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && dob) {
      onComplete({ name, dob });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="card-cosmic border-copper sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground text-center">
            Enter The Chambers
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            To unlock your cosmic blueprint, we need your birth details.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Your full birth name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="dob" className="text-sm text-muted-foreground">
              Date of Birth
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
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-xl"
            disabled={!name || !dob}
          >
            Unlock Your Blueprint
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
