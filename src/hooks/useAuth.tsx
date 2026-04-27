import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "shopkeeper" | "admin";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  /** Primary role for routing decisions: admin > shopkeeper > customer. */
  role: Role | null;
  /** All roles the user holds. */
  roles: Role[];
  isAdmin: boolean;
};

const PRIORITY: Role[] = ["admin", "shopkeeper", "customer"];

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (!newSession) {
        setRoles([]);
        setLoading(false);
      } else {
        setTimeout(() => fetchRoles(newSession.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s) fetchRoles(s.user.id);
      else setLoading(false);
    });

    async function fetchRoles(userId: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!mounted) return;
      const got = (data ?? []).map((r) => r.role as Role);
      setRoles(got);
      setLoading(false);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = PRIORITY.find((r) => roles.includes(r)) ?? null;

  return {
    loading,
    session,
    user: session?.user ?? null,
    role,
    roles,
    isAdmin: roles.includes("admin"),
  };
}
