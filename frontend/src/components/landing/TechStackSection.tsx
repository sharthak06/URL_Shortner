import React from "react";
import { motion } from "framer-motion";
import { listContainerVariants, sectionRevealVariants } from "@/lib/motion";
import { SectionHeader } from "@/components/landing/SectionHeader";

const STACK: { name: string; role: string }[] = [
  { name: "React", role: "Interface" },
  { name: "TypeScript", role: "Type safety, front to back" },
  { name: "Express", role: "API and redirects" },
  { name: "PostgreSQL", role: "Links and click records" },
  { name: "Redis", role: "Cache, bloom filter and locks" },
  { name: "BullMQ", role: "Background click processing" },
];

/** Stack cards: neutral on purpose, so this section adds no new accent. */
export const TechStackSection: React.FC = () => {
  return (
    <section id="stack" aria-labelledby="stack-heading" className="w-full scroll-mt-20 px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
        >
          <SectionHeader
            eyebrow="// Stack"
            titleId="stack-heading"
            title="Built with a small, proven stack."
            description="Six pieces, each doing one job."
            accentClassName="text-zinc-400"
          />
        </motion.div>

        <motion.ul
          variants={listContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
        >
          {STACK.map((item) => (
            <motion.li
              key={item.name}
              variants={sectionRevealVariants}
              className="rounded-2xl border border-line-subtle p-1.5"
            >
              <div className="h-full rounded-xl border border-line-subtle bg-card px-4 py-7 text-center transition-colors duration-200 hover:border-line-strong hover:bg-card-hover sm:py-8">
                <p className="font-mono text-sm font-semibold text-zinc-100 sm:text-base">{item.name}</p>
                <p className="mt-1.5 text-xs text-zinc-500 sm:text-sm">{item.role}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};
