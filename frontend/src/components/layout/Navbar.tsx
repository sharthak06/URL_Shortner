import React, { Suspense, lazy, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowRight, User } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { LANDING_SECTIONS } from "@/components/landing/sections";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

// The navbar ships on every page, so it avoids Framer Motion and loads the phone menu on demand
const SectionMenu = lazy(() => import("@/components/layout/SectionMenu"));

const SECTION_IDS = LANDING_SECTIONS.map((section) => section.id);

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const activeSection = useActiveSection(SECTION_IDS, isLanding);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Active pill: one element that slides under the current link
  const navListRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const link = activeSection
        ? navListRef.current?.querySelector<HTMLElement>(`[data-section="${activeSection}"]`)
        : null;
      setPill(link ? { left: link.offsetLeft, width: link.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeSection, isMdUp]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line-subtle bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        {/* Left: Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 justify-self-start group rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-line group-hover:border-indigo-500/40 group-hover:scale-105 transition-[border-color,transform] duration-200">
            <BrandMark className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight text-zinc-100">
            Shortr
          </span>
        </Link>

        {/* Centre: section links (landing page only) */}
        {isLanding ? (
          <nav aria-label="Page sections" className="hidden md:block">
            <div ref={navListRef} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 rounded-full border border-line-subtle bg-white/[0.06]",
                  !reduceMotion && "transition-[transform,width,opacity] duration-200 ease-out",
                  pill ? "opacity-100" : "opacity-0"
                )}
                style={pill ? { width: pill.width, transform: `translateX(${pill.left}px)` } : undefined}
              />
              <ul className="flex items-center gap-1">
                {LANDING_SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        data-section={section.id}
                        aria-current={isActive ? "true" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          jumpTo(section.id);
                        }}
                        className={cn(
                          "relative block rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                          isActive ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100"
                        )}
                      >
                        {section.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        ) : (
          <span aria-hidden="true" />
        )}

        {/* Right: User / Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3 justify-self-end">
          {isLanding && !isMdUp && (
            <Suspense fallback={<span className="h-8 w-8" aria-hidden="true" />}>
              <SectionMenu activeSection={activeSection} onJump={jumpTo} />
            </Suspense>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button asChild variant="secondary" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 bg-surface px-3 py-1.5 rounded-full border border-line-subtle">
                <User className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                <span className="font-mono text-zinc-300 max-w-[150px] truncate">
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-1.5"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth?mode=login">Sign In</Link>
              </Button>

              <Button asChild size="sm" className="group gap-1.5 font-semibold">
                <Link to="/auth?mode=register">
                  <span>Sign Up</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-indigo-100 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
