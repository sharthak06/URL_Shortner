import React from "react";
import { motion } from "framer-motion";
import { listContainerVariants, sectionRevealVariants } from "@/lib/motion";
import { SectionHeader } from "@/components/landing/SectionHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Every answer here matches what the backend actually does (no expiry, live edits, hard delete).
const FAQS: { id: string; question: string; answer: string }[] = [
  {
    id: "free",
    question: "Is it free? Do I need an account?",
    answer:
      "You can shorten a link right here without signing up. To make it live and see its clicks, create a free account — your link keeps the same short code.",
  },
  {
    id: "expiry",
    question: "Do links expire? Can I change where one points?",
    answer:
      "Links don't expire. You can change a link's destination from your dashboard at any time; the short link stays the same and the change applies straight away.",
  },
  {
    id: "clicks",
    question: "What do I see about clicks?",
    answer:
      "Total clicks and clicks over time, plus the devices, countries and websites your visitors come from.",
  },
  {
    id: "qr-delete",
    question: "Can I get a QR code? What happens if I delete a link?",
    answer:
      "Every link has a QR code you can download as a PNG. Deleting a link stops the redirect straight away and removes its click history. This can't be undone.",
  },
];

export const FaqSection: React.FC = () => {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="w-full scroll-mt-20 px-4 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="self-start lg:sticky lg:top-24"
        >
          <SectionHeader
            eyebrow="// FAQ"
            titleId="faq-heading"
            title="Questions, answered."
            description="Short answers about using Shortr."
            accentClassName="text-zinc-400"
          />
        </motion.div>

        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <Accordion type="single" collapsible className="border-t border-line-subtle">
            {FAQS.map((faq) => (
              <motion.div key={faq.id} variants={sectionRevealVariants}>
                <AccordionItem value={faq.id}>
                  <AccordionTrigger className="py-4 text-sm sm:text-base">{faq.question}</AccordionTrigger>
                  <AccordionContent className="pb-5 pr-8 text-sm leading-relaxed text-zinc-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
