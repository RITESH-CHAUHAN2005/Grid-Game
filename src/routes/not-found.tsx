import { Link } from "react-router-dom";
import { Crown } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="ornament-corners max-w-md rounded-3xl royal-border p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[--royal-gold]/40 bg-[--royal-onyx]/70">
          <Crown className="h-6 w-6 text-[--royal-gold]" />
        </div>
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl text-[--royal-cream]">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[--royal-gold] to-[--royal-gold-bright] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[--royal-onyx] shadow-lg"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
