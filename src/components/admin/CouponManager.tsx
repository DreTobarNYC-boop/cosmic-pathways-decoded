import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Coupon {
  id: string;
  code: string;
  type: "free_access" | "percentage_discount";
  value: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"free_access" | "percentage_discount">("percentage_discount");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading coupons", description: error.message, variant: "destructive" });
    } else {
      setCoupons(data || []);
    }
    setIsLoading(false);
  }

  async function createCoupon() {
    if (!code || !value) {
      toast({ title: "Missing fields", description: "Code and value are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("coupon_codes").insert({
      code: code.toUpperCase(),
      type,
      value: parseInt(value),
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires_at: expiresAt || null,
    });

    if (error) {
      toast({ title: "Error creating coupon", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon created", description: `Code: ${code.toUpperCase()}` });
      setIsOpen(false);
      resetForm();
      fetchCoupons();
    }
  }

  async function deactivateCoupon(id: string) {
    const { error } = await supabase
      .from("coupon_codes")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast({ title: "Error deactivating coupon", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coupon deactivated" });
      fetchCoupons();
    }
  }

  function resetForm() {
    setCode("");
    setType("percentage_discount");
    setValue("");
    setMaxUses("");
    setExpiresAt("");
  }

  function copyCode(codeText: string) {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
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
        <h2 className="font-display text-lg font-bold">Coupon Codes</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LAUNCH30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v: "free_access" | "percentage_discount") => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                    <SelectItem value="free_access">Free Access Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {type === "percentage_discount" ? "Discount %" : "Days of Free Access"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage_discount" ? "30" : "30"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <Button onClick={createCoupon} className="w-full">
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No coupons yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-xl border ${
                coupon.is_active ? "bg-muted/20 border-border" : "bg-muted/10 border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{coupon.code}</span>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {!coupon.is_active && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {coupon.type === "percentage_discount"
                      ? `${coupon.value}% off`
                      : `${coupon.value} days free`}
                    {coupon.max_uses && ` • ${coupon.times_used}/${coupon.max_uses} uses`}
                    {!coupon.max_uses && ` • ${coupon.times_used} uses`}
                  </p>
                  {coupon.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {coupon.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deactivateCoupon(coupon.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
