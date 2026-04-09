import { useState, useEffect } from "react";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Founder {
  id: string;
  user_id: string;
  granted_at: string;
  notes: string | null;
  user_email?: string;
}

export function FoundersManager() {
  const { user } = useAuth();
  const [founders, setFounders] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchFounders();
  }, []);

  async function fetchFounders() {
    // Note: In production, you'd join with auth.users via a view or edge function
    const { data, error } = await supabase
      .from("founders_access")
      .select("*")
      .order("granted_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading founders", description: error.message, variant: "destructive" });
    } else {
      setFounders(data || []);
    }
    setIsLoading(false);
  }

  async function grantAccess() {
    if (!email) {
      toast({ title: "Missing email", description: "Please enter an email address", variant: "destructive" });
      return;
    }

    // First, find the user by email
    // Note: In production, this would be done via an edge function for security
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .single();

    if (userError || !userData) {
      toast({ 
        title: "User not found", 
        description: "No user found with that email. They must sign up first.", 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("founders_access").insert({
      user_id: userData.id,
      granted_by: user?.id,
      notes: notes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already a founder", description: "This user already has founders access", variant: "destructive" });
      } else {
        toast({ title: "Error granting access", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Founders access granted", description: `${email} now has full access` });
      setIsOpen(false);
      setEmail("");
      setNotes("");
      fetchFounders();
    }
  }

  async function revokeAccess(founderId: string) {
    const { error } = await supabase
      .from("founders_access")
      .delete()
      .eq("id", founderId);

    if (error) {
      toast({ title: "Error revoking access", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Access revoked" });
      fetchFounders();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Founders Access</h2>
          <p className="text-sm text-muted-foreground">
            Grant free permanent access to team members and beta testers
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Founders Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  User must have an existing account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Beta tester - Wave 1"
                  rows={2}
                />
              </div>

              <Button onClick={grantAccess} className="w-full">
                <UserCheck className="w-4 h-4 mr-2" />
                Grant Founders Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {founders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No founders yet. Grant access to your first team member!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {founders.map((founder) => (
            <div
              key={founder.id}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-sm">
                      {founder.user_email || `User ${founder.user_id.slice(0, 8)}...`}
                    </span>
                  </div>
                  {founder.notes && (
                    <p className="text-sm text-muted-foreground">{founder.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Granted: {new Date(founder.granted_at).toLocaleDateString()}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Founders Access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove permanent free access for this user. They will be downgraded to the free tier.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => revokeAccess(founder.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Revoke Access
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
