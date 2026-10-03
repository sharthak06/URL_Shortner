import React from "react";
import { motion } from "framer-motion";
import { sectionRevealVariants } from "@/lib/motion";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";

/** "Under the hood": the system diagram. Emerald is this section's only accent. */
export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="w-full scroll-mt-20 px-4 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
        >
          <SectionHeader
            eyebrow="// Under the hood"
            titleId="how-it-works-heading"
            title="What happens when someone clicks your link"
            description="Redirects are answered from memory first, and clicks are recorded in the background, so nobody waits."
            accentClassName="text-emerald-400/80"
          />
        </motion.div>

        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 sm:mt-16"
        >
          <ArchitectureDiagram />
        </motion.div>
      </div>
    </section>
  );
};
