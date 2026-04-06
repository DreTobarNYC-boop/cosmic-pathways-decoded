import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function OnboardingModal({ open }: { open: boolean }) {
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
            Complete Your Blueprint
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            To decode your cosmic identity, we need your birth details.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Full Birth Name
            </Label>
            <Input
              id="name"
              placeholder="Your full birth name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
              required
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Used for numerology — expression, soul urge, and personality numbers
            </p>
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
          <div>
            <Label htmlFor="birthPlace" className="text-sm text-muted-foreground">
              Place of Birth
            </Label>
            <Input
              id="birthPlace"
              placeholder="City, Country"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="bg-muted/30 border-copper text-foreground placeholder:text-muted-foreground/50 mt-1"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Needed for accurate house placements in your birth chart
            </p>
          </div>
          <div>
            <Label htmlFor="birthTime" className="text-sm text-muted-foreground">
              Time of Birth
            </Label>
            <Input
              id="birthTime"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="bg-muted/30 border-copper text-foreground mt-1"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              For rising sign & house calculations — check your birth certificate
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-xl"
            disabled={loading || !name || !dob}
          >
            {loading ? "Decoding..." : "Unlock Your Blueprint"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
