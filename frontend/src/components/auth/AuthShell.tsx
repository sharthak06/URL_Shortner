import React, { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { BrandMark } from "@/components/layout/BrandMark";
import { sectionRevealVariants, snappyTransition, springTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Shared frame for every auth screen (sign in/up, check email, unverified, forgot,
 * reset, verify). All of them render the same card, header, field and button so
 * moving between them reads as one card changing content, not a new page.
 *
 * Decoration budget for the whole flow is deliberately two effects:
 *   1. A cursor-following spotlight that lights the card's 1px border (AuthShell).
 *   2. A light sweeping along the primary CTA's edge (AuthSubmitButton).
 * Everything else is static. Don't add a third.
 */

// Masks a layer down to its 1px padding ring, so a gradient only ever paints the border
const RING_MASK: React.CSSProperties = {
  padding: 1,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

const SHINE_STYLE: React.CSSProperties = {
  ...RING_MASK,
  backgroundImage:
    "linear-gradient(110deg, transparent 42%, rgba(255,255,255,0.55) 50%, transparent 58%)",
  backgroundSize: "250% 100%",
  backgroundRepeat: "no-repeat",
};

// Same curve as the accordion keyframes in tailwind.config.ts: fast out, long settle, no overshoot
const HEIGHT_TRANSITION = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const;

/** Content swaps inside the card (view changes, title changes). Rises in, lifts out. */
export const authSwapVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: "easeOut" } },
};

export const authLinkClass =
  "rounded-sm font-medium text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";

/* -------------------------------------------------------------------------- */
/*                                    Shell                                   */
/* -------------------------------------------------------------------------- */

interface AuthShellProps {
  backLink?: { to: string; label: string };
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ backLink, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");

  // Pointer position relative to the card. Tracked on the whole page (not just the card)
  // so the border starts catching light as the cursor approaches, the way a real edge would.
  const pointerX = useMotionValue(-1000);
  const pointerY = useMotionValue(-1000);
  const glowOpacity = useMotionValue(0);
  const borderGlow = useMotionTemplate`radial-gradient(280px circle at ${pointerX}px ${pointerY}px, rgba(129,140,248,0.6), transparent 70%)`;
  const surfaceGlow = useMotionTemplate`radial-gradient(520px circle at ${pointerX}px ${pointerY}px, rgba(129,140,248,0.05), transparent 65%)`;

  // The card eases between content heights instead of snapping when a view swaps
  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setContentHeight(entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    pointerX.set(e.clientX - rect.left);
    pointerY.set(e.clientY - rect.top);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    animate(glowOpacity, 1, { duration: 0.4 });
  };

  const handlePointerLeave = () => {
    animate(glowOpacity, 0, { duration: 0.4 });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative isolate flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-16"
      >
        {/* Static backdrop: a dot grid that fades out from the card, and one soft light from above */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,#000_30%,transparent_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.16),transparent_65%)]"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionRevealVariants}
          className="w-full max-w-[420px]"
        >
          {backLink && (
            <Link
              to={backLink.to}
              className="group mb-5 inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>{backLink.label}</span>
            </Link>
          )}

          <div
            ref={cardRef}
            className="relative rounded-2xl border border-line-subtle bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.4),0_24px_64px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            {/* Effect 1: spotlight. A faint wash on the surface plus a brighter catch on the border ring */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{ background: surfaceGlow, opacity: glowOpacity }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-[inherit]"
              style={{ ...RING_MASK, background: borderGlow, opacity: glowOpacity }}
            />
            {/* Hairline highlight along the top edge, the card's light source */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />

            <motion.div
              initial={false}
              animate={{ height: contentHeight }}
              transition={HEIGHT_TRANSITION}
              className="relative overflow-hidden"
            >
              <div ref={measureRef} className="p-6 sm:p-8">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

type StatusTone = "success" | "warning" | "error" | "info";

const TONE_TILE: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25 shadow-[0_0_24px_-4px_rgba(16,185,129,0.35)]",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/25 shadow-[0_0_24px_-4px_rgba(245,158,11,0.3)]",
  error: "bg-red-500/10 text-red-400 ring-red-500/25 shadow-[0_0_24px_-4px_rgba(239,68,68,0.3)]",
  info: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/25 shadow-[0_0_24px_-4px_rgba(99,102,241,0.35)]",
};

export interface AuthStatus {
  tone: StatusTone;
  icon: React.ReactNode;
}

interface AuthHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** When set, the brand tile morphs into a status tile (check email, error, success…) */
  status?: AuthStatus;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, description, status }) => {
  const tileKey = status ? `${status.tone}-${title}` : "brand";

  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <div className="relative mb-5 h-12 w-12">
        {/* Tiles are absolutely stacked, so the outgoing and incoming ones crossfade in place */}
        <AnimatePresence initial={false}>
          <motion.div
            key={tileKey}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: "easeOut" } }}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-xl ring-1 [&_svg]:h-5 [&_svg]:w-5",
              status
                ? TONE_TILE[status.tone]
                : "bg-surface ring-line shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            )}
          >
            {status ? status.icon : <BrandMark className="!h-6 !w-6" />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={title}
          variants={authSwapVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-2"
        >
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-zinc-100 text-balance">
            {title}
          </h1>
          {description && (
            <p className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-zinc-400 text-pretty">
              {description}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Form pieces                                 */
/* -------------------------------------------------------------------------- */

interface AuthFieldProps extends InputProps {
  id: string;
  label: string;
  /** Rendered at the right end of the label row (e.g. "Forgot password?") */
  action?: React.ReactNode;
  hint?: React.ReactNode;
}

/** Password fields automatically get a show/hide toggle inside the input. */
export const AuthField: React.FC<AuthFieldProps> = ({ id, label, action, hint, className, type, ...inputProps }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="group/field space-y-2 text-left">
      <div className="flex min-h-[18px] items-center justify-between">
        <label
          htmlFor={id}
          className="text-[13px] font-medium text-zinc-400 transition-colors duration-200 group-focus-within/field:text-zinc-100"
        >
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && isRevealed ? "text" : type}
          className={cn(
            "h-11 bg-surface/60 border-line-subtle text-sm placeholder:text-zinc-600",
            "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-[border-color,background-color,box-shadow] duration-200",
            "hover:border-line focus-visible:bg-surface focus-visible:border-indigo-400/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10",
            isPassword && "pr-11",
            className
          )}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={isRevealed ? "Hide password" : "Show password"}
            aria-pressed={isRevealed}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-500 transition-colors duration-200 hover:text-zinc-200 focus-visible:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={isRevealed ? "hide" : "show"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: snappyTransition }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: "easeOut" } }}
                className="flex"
              >
                {isRevealed ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
};

interface AuthSubmitButtonProps extends Omit<ButtonProps, "asChild"> {
  loading: boolean;
  loadingLabel: string;
}

/** The screen's one primary action. Carries effect 2: a light that sweeps along its edge. */
export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  loading,
  loadingLabel,
  disabled,
  children,
  className,
  ...props
}) => {
  const reduceMotion = useReducedMotion();
  const isIdleEnabled = !disabled && !loading;

  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn("group relative mt-1 h-11 w-full gap-2 text-sm font-semibold", className)}
      {...props}
    >
      {isIdleEnabled && !reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={SHINE_STYLE}
          initial={{ backgroundPosition: "100% 0%" }}
          animate={{ backgroundPosition: "0% 0%" }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.4 }}
        />
      )}
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </>
      )}
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Status screens                               */
/* -------------------------------------------------------------------------- */

/** Body copy under a status header. */
export const AuthMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mx-auto max-w-[320px] text-center text-[13px] leading-relaxed text-zinc-400 text-pretty">
    {children}
  </p>
);

/** An email address rendered as a mono badge, so it's scannable inside a sentence. */
export const EmailBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-zinc-200 ring-1 ring-line [overflow-wrap:anywhere]">
    {children}
  </span>
);

/** Vertical stack of actions below a status message. */
export const AuthActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-6 flex flex-col items-center gap-4">{children}</div>
);

/** Secondary-style full-width button shared by status screens. */
export const authSecondaryButtonClass = "h-11 w-full gap-2 text-sm";

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

export const AuthFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("mt-7 border-t border-line-subtle pt-5 text-center text-[13px] text-zinc-500", className)}>
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Segmented control                             */
/* -------------------------------------------------------------------------- */

interface AuthModeTabsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}

/**
 * The active pill is a quiet raised surface, not an indigo fill: the submit button
 * should be the only saturated shape on the card.
 */
export function AuthModeTabs<T extends string>({ value, options, onChange, label }: AuthModeTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-6 flex rounded-lg border border-line-subtle bg-canvas-subtle p-1 text-[13px]"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 rounded-md py-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
              isActive ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="auth-mode-pill"
                transition={snappyTransition}
                className="absolute inset-0 rounded-md bg-surface-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.5)]"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
