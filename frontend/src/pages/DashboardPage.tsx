import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { sectionRevealVariants } from "@/lib/motion";
import { DashboardShortener } from "@/components/dashboard/DashboardShortener";
import { LinkFeed } from "@/components/dashboard/LinkFeed";
import { StatsStrip } from "@/components/dashboard/StatsStrip";

function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// "jane.doe42@x.com" -> "Jane". Returns null when the email doesn't yield a readable name.
function getFirstName(email?: string): string | null {
  const firstPart = email?.split("@")[0]?.split(/[._+-]/)[0]?.replace(/\d+/g, "");
  if (!firstPart || firstPart.length < 2) return null;
  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
}

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // If session is still hydrating from GET /auth/me, display clean skeleton loader
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Hydrating session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const firstName = getFirstName(user?.email);

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-10 max-w-5xl mx-auto w-full space-y-8">
      <header className="w-full space-y-6">
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-line-subtle bg-card px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-8 sm:py-8"
        >
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">// Overview</p>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-balance text-zinc-100 sm:text-3xl">
                {getGreeting()}
                {firstName && `, ${firstName}`}
              </h1>
              <p className="text-sm text-pretty text-zinc-400">Create, share and track your short links.</p>
            </div>
          </div>
        </motion.div>

        <StatsStrip />
      </header>

      {/* Create a link */}
      <div className="w-full">
        <DashboardShortener />
      </div>

      {/* The user's links (keyset-paginated) */}
      <div className="w-full">
        <LinkFeed />
      </div>
    </div>
  );
};

export default DashboardPage;
