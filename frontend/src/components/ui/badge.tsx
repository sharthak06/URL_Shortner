import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-line bg-surface text-zinc-300",
        operational:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        destructive:
          "border border-red-500/20 bg-red-500/10 text-red-400",
        brand:
          "border border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
        outline:
          "border border-line text-zinc-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
