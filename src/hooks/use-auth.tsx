import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  saveProfile: (data: UserProfile) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth changes — set up BEFORE getSession
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer profile fetch to avoid Supabase deadlock
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("user_profiles")
      .select("full_name, date_of_birth")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile({
        fullName: data.full_name,
        dateOfBirth: data.date_of_birth,
      });
    } else {
      setProfile(null);
    }
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
    setProfile(null);
  }

  async function saveProfile(data: UserProfile) {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("user_profiles").upsert(
      [{
        user_id: user.id,
        full_name: data.fullName,
        date_of_birth: data.dateOfBirth,
      }],
      { onConflict: "user_id" }
    );

    if (!error) {
      setProfile(data);
    }
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signUp, signIn, signOut, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
