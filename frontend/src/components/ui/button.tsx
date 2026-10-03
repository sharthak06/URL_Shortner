import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// "Soft depth": on a near-black canvas, depth comes from a lighter top edge and a crisp 1px ring,
// not from dark drop shadows (which disappear). The hover glow is a secondary cue only.
const PRIMARY_DEPTH =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(79,70,229,0.9),0_1px_2px_rgba(0,0,0,0.5)]";
const PRIMARY_DEPTH_HOVER =
  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(99,102,241,0.9),0_6px_16px_-6px_rgba(99,102,241,0.55)]";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium select-none cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: `bg-indigo-500 text-white ${PRIMARY_DEPTH} hover:bg-indigo-400 hover:-translate-y-px ${PRIMARY_DEPTH_HOVER} active:translate-y-0`,
        secondary:
          "bg-surface text-zinc-200 border border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-surface-hover hover:border-line-strong hover:text-white",
        outline:
          "border border-line bg-transparent text-zinc-300 hover:bg-white/5 hover:border-line-strong hover:text-zinc-100",
        ghost:
          "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
