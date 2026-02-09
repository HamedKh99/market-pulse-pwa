"use client";

import { useEffect } from "react";
import { useStore } from "@/store";
import { LoginForm } from "./LoginForm";

/**
 * AuthGate — wraps protected content.
 * Shows a loading spinner during hydration, the login form if
 * unauthenticated, or children if authenticated.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isLoading = useStore((s) => s.isLoading);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hydrating auth from localStorage
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Authenticated — render dashboard
  return <>{children}</>;
}
