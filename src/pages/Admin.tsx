import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ticket, Users, Crown, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/hooks/use-admin";
import { CouponManager } from "@/components/admin/CouponManager";
import { FoundersManager } from "@/components/admin/FoundersManager";
import { InnerCircleManager } from "@/components/admin/InnerCircleManager";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState("coupons");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="font-display text-xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            You don&apos;t have permission to access this area.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-primary text-sm hover:underline"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage access and coupons</p>
        </div>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Coupons</span>
            </TabsTrigger>
            <TabsTrigger value="founders" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Founders</span>
            </TabsTrigger>
            <TabsTrigger value="inner-circle" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Inner Circle</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>

          <TabsContent value="founders">
            <FoundersManager />
          </TabsContent>

          <TabsContent value="inner-circle">
            <InnerCircleManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
