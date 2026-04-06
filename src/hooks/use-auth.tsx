import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const GUEST_PROFILE_KEY = "dcode_guest_profile";

export interface UserProfile {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  birthPlace: string | null;
  birthTime: string | null; // HH:MM
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  saveProfile: (data: UserProfile) => Promise<{ error: string | null }>;
  saveGuestProfile: (data: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

function loadGuestProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        }
        // Don't clear profile on logout — guest profile persists
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        // Load guest profile from localStorage
        const guest = loadGuestProfile();
        if (guest) setProfile(guest);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("user_profiles")
      .select("full_name, date_of_birth, birth_place, birth_time")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile({
        fullName: data.full_name,
        dateOfBirth: data.date_of_birth,
        birthPlace: (data as any).birth_place ?? null,
        birthTime: (data as any).birth_time ?? null,
      });
    } else {
      // Authenticated but no DB profile — check for guest profile to migrate
      const guest = loadGuestProfile();
      if (guest) {
        await saveProfile(guest);
      } else {
        setProfile(null);
      }
    }
  }

  function saveGuestProfile(data: UserProfile) {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(data));
    setProfile(data);
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(loadGuestProfile());
  }

  async function saveProfile(data: UserProfile) {
    if (!user) {
      // Guest mode — save locally
      saveGuestProfile(data);
      return { error: null };
    }

    const { error } = await supabase.from("user_profiles").upsert(
      [{
        user_id: user.id,
        full_name: data.fullName,
        date_of_birth: data.dateOfBirth,
        birth_place: data.birthPlace,
        birth_time: data.birthTime,
      } as any],
      { onConflict: "user_id" }
    );

    if (!error) {
      setProfile(data);
      // Clear guest profile since it's now in the DB
      localStorage.removeItem(GUEST_PROFILE_KEY);
    }
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isGuest: !user,
        signUp,
        signIn,
        signOut,
        saveProfile,
        saveGuestProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
