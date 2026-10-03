import React from "react";
import { Github } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";

const REPO_URL = "https://github.com/sharthak06/URL_Shortner";

const footerLinkClass =
  "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-line-subtle bg-canvas px-4 py-10 text-xs text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row sm:px-2">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-4 w-4" />
          <span className="font-display text-sm font-semibold tracking-tight text-zinc-300">Shortr</span>
          <span className="text-zinc-700">/</span>
          <span>Short links with click analytics.</span>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-6 text-zinc-400">
          <a href="/#how-it-works" className={footerLinkClass}>
            How it works
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
            <Github className="h-3.5 w-3.5" />
            <span>Source</span>
          </a>
        </nav>
      </div>
    </footer>
  );
};
