import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  Gift, 
  Crown, 
  Shield,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface FounderAccess {
  id: string;
  user_id: string;
  granted_at: string;
  notes: string | null;
  user_email?: string;
}

interface InnerCircleSeat {
  id: string;
  user_id: string;
  seat_number: number;
  claimed_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"coupons" | "founders" | "inner_circle">("coupons");
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "free_access" as "free_access" | "percentage_discount",
    value: 30,
    max_uses: "",
    expires_at: "",
  });
  
  // Founders state
  const [founders, setFounders] = useState<FounderAccess[]>([]);
  const [newFounderEmail, setNewFounderEmail] = useState("");
  const [newFounderNotes, setNewFounderNotes] = useState("");
  
  // Inner Circle state
  const [innerCircleSeats, setInnerCircleSeats] = useState<InnerCircleSeat[]>([]);
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data && !error) {
      setIsAdmin(true);
    }
    setIsLoading(false);
  };

  const fetchData = async () => {
    if (activeTab === "coupons") {
      const { data } = await supabase
        .from("coupon_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setCoupons(data);
    } else if (activeTab === "founders") {
      const { data } = await supabase
        .from("founders_access")
        .select("*")
        .order("granted_at", { ascending: false });
      if (data) setFounders(data);
    } else if (activeTab === "inner_circle") {
      const { data } = await supabase
        .from("inner_circle_seats")
        .select("*")
        .order("seat_number", { ascending: true });
      if (data) setInnerCircleSeats(data);
    }
  };

  const createCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast({ title: "Error", description: "Coupon code is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("coupon_codes").insert({
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      value: newCoupon.value,
      max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
      expires_at: newCoupon.expires_at || null,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create coupon", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Coupon created successfully" });
      setNewCoupon({ code: "", type: "free_access", value: 30, max_uses: "", expires_at: "" });
      fetchData();
    }
  };

  const toggleCouponActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from("coupon_codes")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (!error) {
      fetchData();
    }
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from("coupon_codes").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted", description: "Coupon removed" });
      fetchData();
    }
  };

  const grantFoundersAccess = async () => {
    if (!newFounderEmail.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", newFounderEmail.toLowerCase())
      .single();

    if (userError || !userData) {
      toast({ 
        title: "User not found", 
        description: "No user found with that email. They must sign up first.", 
        variant: "destructive" 
      });
      return;
    }

    // Grant founders access
    const { error } = await supabase.from("founders_access").insert({
      user_id: userData.id,
      granted_by: user?.id,
      notes: newFounderNotes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Error", description: "This user already has Founders access", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to grant access", variant: "destructive" });
      }
    } else {
      // Also update their subscription to founders tier
      await supabase.from("subscriptions").upsert({
        user_id: userData.id,
        tier: "founders",
        status: "active",
      }, { onConflict: "user_id" });

      toast({ title: "Success", description: "Founders access granted" });
      setNewFounderEmail("");
      setNewFounderNotes("");
      fetchData();
    }
  };

  const revokeFoundersAccess = async (founder: FounderAccess) => {
    const { error } = await supabase.from("founders_access").delete().eq("id", founder.id);
    if (!error) {
      // Also downgrade their subscription
      await supabase
        .from("subscriptions")
        .update({ tier: "free" })
        .eq("user_id", founder.user_id);

      toast({ title: "Revoked", description: "Founders access removed" });
      fetchData();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="font-display text-2xl text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage subscriptions and access</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border/50 pb-4">
          <Button
            variant={activeTab === "coupons" ? "default" : "ghost"}
            onClick={() => setActiveTab("coupons")}
            className="flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Coupons
          </Button>
          <Button
            variant={activeTab === "founders" ? "default" : "ghost"}
            onClick={() => setActiveTab("founders")}
            className="flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Founders Access
          </Button>
          <Button
            variant={activeTab === "inner_circle" ? "default" : "ghost"}
            onClick={() => setActiveTab("inner_circle")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Inner Circle ({innerCircleSeats.length}/100)
          </Button>
        </div>

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="space-y-8">
            {/* Create Coupon Form */}
            <div className="bg-card/30 rounded-2xl border border-border/50 p-6">
              <h2 className="font-display text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create New Coupon
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="CODE"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="bg-background/50 uppercase"
                />
                <select
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as "free_access" | "percentage_discount" })}
                  className="bg-background/50 border border-border rounded-md px-3 py-2"
                >
                  <option value="free_access">Free Access (days)</option>
                  <option value="percentage_discount">Percentage Off</option>
                </select>
                <Input
                  type="number"
                  placeholder={newCoupon.type === "free_access" ? "Days (30, 365)" : "Percent off"}
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) || 0 })}
                  className="bg-background/50"
                />
                <Input
                  type="number"
                  placeholder="Max uses (empty = unlimited)"
                  value={newCoupon.max_uses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                  className="bg-background/50"
                />
                <Input
                  type="date"
                  placeholder="Expires"
                  value={newCoupon.expires_at}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <Button onClick={createCoupon} className="mt-4 bg-primary hover:bg-primary/90">
                Create Coupon
              </Button>
            </div>

            {/* Coupons List */}
            <div className="bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-card/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Uses</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Expires</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-card/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-primary font-mono">{coupon.code}</code>
                          <button onClick={() => copyCode(coupon.code)} className="text-muted-foreground hover:text-foreground">
                            {copiedCode === coupon.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {coupon.type === "free_access" ? "Free Access" : "Discount"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {coupon.type === "free_access" ? `${coupon.value} days` : `${coupon.value}%`}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {coupon.times_used}/{coupon.max_uses || "∞"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCouponActive(coupon)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            coupon.is_active 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {coupon.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCoupon(coupon.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No coupons created yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Founders Tab */}
        {activeTab === "founders" && (
          <div className="space-y-8">
            {/* Grant Access Form */}
            <div className="bg-card/30 rounded-2xl border border-border/50 p-6">
              <h2 className="font-display text-lg mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Grant Founders Access
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Founders Access is a hidden tier that gives selected people permanent full access. 
                It is not visible on the pricing page and can only be assigned here.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Input
                  placeholder="User email"
                  value={newFounderEmail}
                  onChange={(e) => setNewFounderEmail(e.target.value)}
                  className="bg-background/50 flex-1 min-w-[200px]"
                />
                <Input
                  placeholder="Notes (optional)"
                  value={newFounderNotes}
                  onChange={(e) => setNewFounderNotes(e.target.value)}
                  className="bg-background/50 flex-1 min-w-[200px]"
                />
                <Button onClick={grantFoundersAccess} className="bg-primary hover:bg-primary/90">
                  Grant Access
                </Button>
              </div>
            </div>

            {/* Founders List */}
            <div className="bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-card/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Granted</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Notes</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {founders.map((founder) => (
                    <tr key={founder.id} className="hover:bg-card/20">
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {founder.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(founder.granted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {founder.notes || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeFoundersAccess(founder)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {founders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No founders access granted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inner Circle Tab */}
        {activeTab === "inner_circle" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{innerCircleSeats.length}</div>
                <div className="text-sm text-muted-foreground">Seats Claimed</div>
              </div>
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-foreground mb-2">{100 - innerCircleSeats.length}</div>
                <div className="text-sm text-muted-foreground">Seats Remaining</div>
              </div>
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${(innerCircleSeats.length * 1888).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>

            {/* Seats List */}
            <div className="bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-card/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Seat #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Claimed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {innerCircleSeats.map((seat) => (
                    <tr key={seat.id} className="hover:bg-card/20">
                      <td className="px-4 py-3">
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-mono">
                          #{seat.seat_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {seat.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(seat.claimed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {innerCircleSeats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No Inner Circle seats claimed yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
