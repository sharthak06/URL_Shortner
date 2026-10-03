import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Eyebrow colour, i.e. the section's single accent. */
  accentClassName?: string;
  align?: "left" | "center";
  titleId?: string;
  className?: string;
}

/** Shared eyebrow + heading + lede so every landing section has the same rhythm. */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  accentClassName = "text-indigo-300/80",
  align = "left",
  titleId,
  className,
}) => (
  <div className={cn(align === "center" && "mx-auto text-center", className)}>
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.2em]", accentClassName)}>{eyebrow}</p>
    <h2
      id={titleId}
      className="mt-4 font-display text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-zinc-100 text-balance"
    >
      {title}
    </h2>
    {description && (
      <p
        className={cn(
          "mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-zinc-400 text-pretty",
          align === "center" && "mx-auto"
        )}
      >
        {description}
      </p>
    )}
  </div>
);
