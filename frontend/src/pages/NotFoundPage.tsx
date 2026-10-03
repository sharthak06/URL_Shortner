import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, LayoutDashboard, Terminal } from "lucide-react";

/**
 * Geometric aperture fan motif matching the reference visual
 */
const ShutterMotif: React.FC<{ orientation?: "top-left" | "top-center" | "bottom-center" | "center" }> = ({
  orientation = "top-left",
}) => {
  const rotationClass = {
    "top-left": "rotate-0",
    "top-center": "-rotate-90",
    "bottom-center": "rotate-90",
    "center": "rotate-45",
  }[orientation];

  return (
    <svg
      className={`size-12 text-zinc-600/50 transition-colors duration-300 group-hover:text-zinc-400/70 ${rotationClass}`}
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 4 L24 8 L22 14 Z" opacity="0.9" />
      <path d="M4 4 L28 18 L24 24 Z" opacity="0.75" />
      <path d="M4 4 L24 28 L18 32 Z" opacity="0.6" />
      <path d="M4 4 L14 34 L8 36 Z" opacity="0.45" />
    </svg>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 - Page Not Found | sho.rt";
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <main
      role="main"
      className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8"
      aria-labelledby="not-found-heading"
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Left Side: Modular Architectural Grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 rounded-2xl border border-line-subtle bg-canvas-subtle/60 backdrop-blur-sm"
          aria-hidden="true"
        >
          <div className="group flex size-24 lg:size-28 items-start justify-start p-3 rounded-lg border border-line-subtle bg-[#121214] transition-colors hover:border-line">
            <ShutterMotif orientation="top-left" />
          </div>
          <div className="size-24 lg:size-28 rounded-lg border border-line-subtle bg-[#101012]" />
          <div className="hidden lg:block size-24 lg:size-28 rounded-lg border border-line-subtle bg-[#101012]" />
          <div className="size-24 lg:size-28 rounded-lg border border-line-subtle bg-[#101012]" />
          <div className="group flex size-24 lg:size-28 items-end justify-center p-3 rounded-lg border border-line-subtle bg-[#121214] transition-colors hover:border-line">
            <ShutterMotif orientation="bottom-center" />
          </div>
          <div className="hidden lg:flex group size-24 lg:size-28 items-start justify-center p-3 rounded-lg border border-line-subtle bg-[#121214] transition-colors hover:border-line">
            <ShutterMotif orientation="top-center" />
          </div>
          <div className="group flex size-24 lg:size-28 items-end justify-center p-3 rounded-lg border border-line-subtle bg-[#121214] transition-colors hover:border-line">
            <ShutterMotif orientation="bottom-center" />
          </div>
          <div className="size-24 lg:size-28 rounded-lg border border-line-subtle bg-[#101012]" />
          <div className="hidden lg:flex group size-24 lg:size-28 items-center justify-center p-3 rounded-lg border border-line-subtle bg-[#121214] transition-colors hover:border-line">
            <ShutterMotif orientation="center" />
          </div>
        </motion.div>

        {/* Right Side: 404 Typography & Interactive Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Status Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-950/40 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400 shadow-sm">
            <Terminal className="size-3.5 text-emerald-400" aria-hidden="true" />
            <span>[ 404: Unknown Route ]</span>
          </div>

          {/* 404 Display */}
          <div className="flex items-center font-extrabold tracking-tighter text-white select-none leading-none">
            <span className="text-8xl sm:text-9xl lg:text-[11rem] leading-none">4</span>

            <div className="relative inline-flex items-center justify-center text-8xl sm:text-9xl lg:text-[11rem] leading-none mx-1">
              <span className="opacity-0">0</span>
              <svg
                className="absolute inset-0 size-full text-white"
                viewBox="0 0 100 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M50 8 C 24 8, 14 28, 14 60 C 14 92, 24 112, 50 112 C 76 112, 86 92, 86 60 C 86 28, 76 8, 50 8 Z"
                  stroke="currentColor"
                  strokeWidth="20"
                  strokeLinejoin="round"
                />
                <polygon points="50,48 41,34 59,34" fill="currentColor" />
                <polygon points="50,72 41,86 59,86" fill="currentColor" />
              </svg>
            </div>

            <span className="text-8xl sm:text-9xl lg:text-[11rem] leading-none">4</span>
          </div>

          {/* Heading */}
          <h1
            id="not-found-heading"
            className="mt-6 text-3xl sm:text-5xl font-bold tracking-tight text-white text-balance"
          >
            Page not found!
          </h1>

          {/* Explanatory Note */}
          <p className="mt-4 max-w-md text-sm sm:text-base text-zinc-400 text-pretty leading-relaxed">
            Oops! It looks like the page you're trying to reach is not available. Please check the URL
            or return to the workspace.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
            >
              <Home className="size-4" aria-hidden="true" />
              <span>Return Home</span>
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-[#161618] px-6 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:border-line-strong hover:bg-[#1e1e22] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
            >
              <LayoutDashboard className="size-4 text-zinc-400" aria-hidden="true" />
              <span>Go to Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-full cursor-pointer"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Go back</span>
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default NotFoundPage;
