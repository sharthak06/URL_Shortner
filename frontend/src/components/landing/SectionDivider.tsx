import React from "react";

/** Hairline between landing sections that fades out at both ends. */
export const SectionDivider: React.FC = () => (
  <div aria-hidden="true" className="w-full px-4">
    <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);
