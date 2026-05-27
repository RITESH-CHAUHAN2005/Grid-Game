import { Navigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { useAuth } from "@/lib/auth";

function RoyalLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[--royal-gold]/40 bg-[--royal-onyx]/80">
            <Crown className="h-5 w-5 text-[--royal-gold]" />
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading
        </div>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <RoyalLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <RoyalLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
