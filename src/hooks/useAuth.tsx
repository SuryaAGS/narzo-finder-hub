import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "shopkeeper";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role | null;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Listener FIRST, then fetch session — avoids missing events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (!newSession) {
        setRole(null);
        setLoading(false);
      } else {
        // Defer Supabase calls to avoid deadlock inside the callback
        setTimeout(() => fetchRole(newSession.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s) fetchRole(s.user.id);
      else setLoading(false);
    });

    async function fetchRole(userId: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (!mounted) return;
      setRole((data?.role as Role) ?? null);
      setLoading(false);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    role,
  };
}
