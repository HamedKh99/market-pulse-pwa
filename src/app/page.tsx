"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function HomePage() {
  return (
    <AuthGate>
      <DashboardShell>
        <DashboardContent />
      </DashboardShell>
    </AuthGate>
  );
}
