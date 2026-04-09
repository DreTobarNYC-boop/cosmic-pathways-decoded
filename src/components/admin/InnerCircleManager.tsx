import { useState, useEffect } from "react";
import { Crown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface InnerCircleSeat {
  id: string;
  user_id: string;
  seat_number: number;
  claimed_at: string;
  user_email?: string;
}

export function InnerCircleManager() {
  const [seats, setSeats] = useState<InnerCircleSeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSeats] = useState(100);

  useEffect(() => {
    fetchSeats();
  }, []);

  async function fetchSeats() {
    const { data, error } = await supabase
      .from("inner_circle_seats")
      .select("*")
      .order("seat_number", { ascending: true });

    if (error) {
      toast({ title: "Error loading seats", description: error.message, variant: "destructive" });
    } else {
      setSeats(data || []);
    }
    setIsLoading(false);
  }

  const claimedSeats = seats.length;
  const availableSeats = totalSeats - claimedSeats;
  const percentageFilled = (claimedSeats / totalSeats) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">The Inner Circle</h2>
        <p className="text-sm text-muted-foreground">
          Limited to 100 permanent seats. Once filled, this tier closes forever.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="font-display text-2xl font-bold text-amber-500">{claimedSeats}</div>
          <div className="text-xs text-muted-foreground">Claimed</div>
        </div>
        <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
          <div className="font-display text-2xl font-bold">{availableSeats}</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
        <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
          <div className="font-display text-2xl font-bold">{totalSeats}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-medium">{percentageFilled.toFixed(1)}% filled</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
            style={{ width: `${percentageFilled}%` }}
          />
        </div>
      </div>

      {/* Seat Grid Visualization */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Seat Map
        </h3>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: totalSeats }).map((_, i) => {
            const seatNumber = i + 1;
            const isOccupied = seats.some((s) => s.seat_number === seatNumber);
            return (
              <div
                key={seatNumber}
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${
                  isOccupied
                    ? "bg-amber-500 text-white"
                    : "bg-muted/30 text-muted-foreground"
                }`}
                title={isOccupied ? `Seat ${seatNumber} - Claimed` : `Seat ${seatNumber} - Available`}
              >
                {seatNumber}
              </div>
            );
          })}
        </div>
      </div>

      {/* Members List */}
      {seats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Circle Members
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-500">#{seat.seat_number}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {seat.user_email || `User ${seat.user_id.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Claimed {new Date(seat.claimed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {seats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Crown className="w-12 h-12 mx-auto mb-3 text-amber-500/30" />
          <p>No Inner Circle members yet.</p>
          <p className="text-sm">The first 100 will have permanent seats.</p>
        </div>
      )}
    </div>
  );
}
