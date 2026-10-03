import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { TechStackSection } from "@/components/landing/TechStackSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { SectionDivider } from "@/components/landing/SectionDivider";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { listContainerVariants, sectionRevealVariants } from "@/lib/motion";

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { hash } = useLocation();

  // The page is lazy-loaded, so the browser can't honour /#anchor links on its own
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* Hero */}
      <motion.section
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl px-4 pt-20 pb-20 sm:pt-32 sm:pb-28 text-center"
      >
        <motion.div variants={sectionRevealVariants}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">
            {"// Link shortener"}
          </p>

          <h1 className="mt-5 font-display text-5xl sm:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] text-balance">
            <span className="block text-zinc-100">Shorten a link.</span>
            <span className="block text-zinc-500">See every click.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-zinc-400 text-pretty">
            Paste a long URL and get a short one instantly. Create a free account to keep it live and
            see where your clicks come from.
          </p>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="group mt-5 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              You're signed in — go to your dashboard
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <motion.div variants={sectionRevealVariants} className="mt-10">
              <Button asChild size="lg" className="group gap-2 font-semibold">
                <Link to="/signup">
                  Create a free account
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.section>

      <ProductPreview />
      <SectionDivider />
      <ArchitectureSection />
      <SectionDivider />
      <TechStackSection />
      <SectionDivider />
      <FaqSection />
      <SectionDivider />

      {/* Closing CTA */}
      <section className="relative w-full px-4 pt-24 pb-28 sm:pt-32 sm:pb-36">
        {/* Faint indigo wash, so the page ends on the hero's accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_70%)]"
        />
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="relative mx-auto max-w-2xl text-center"
        >
          <SectionHeader
            align="center"
            eyebrow="// Get started"
            title={isAuthenticated ? "Your links are waiting." : "Your next short link is one paste away."}
            description={
              isAuthenticated
                ? "Create a link, share it, and watch the clicks come in."
                : "Free to start. Keep your links live and see every click on your dashboard."
            }
          />

          <div className="mt-10 flex flex-col items-center gap-4">
            <Button asChild size="lg" className="group gap-2 font-semibold">
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                {isAuthenticated ? "Open dashboard" : "Create a free account"}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;
