import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Globe, LogOut, Star, ShieldCheck, MapPin } from "lucide-react";
import { PHONE_KEY, ROLE_KEY, t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  back?: string;
  title?: string;
  showLogout?: boolean;
  area?: string | null;
};

export function AppHeader({ back, title, showLogout, area }: Props) {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(ROLE_KEY);
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <Link
              to={back}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
              <span className="font-display text-lg font-bold text-primary-foreground">V</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight">{title || t("appName")}</h1>
            {area && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{area}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
              aria-label={t("admin")}
            >
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </Link>
          )}
          {user && (
            <Link
              to="/feedback"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
              aria-label={t("feedback")}
            >
              <Star className="h-5 w-5" />
            </Link>
          )}
          <Link
            to="/language"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Language"
          >
            <Globe className="h-5 w-5" />
          </Link>
          {showLogout && (
            <button
              onClick={logout}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
