import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-glow shadow-glow-subtle px-3 py-1 text-xs font-black uppercase tracking-wide transition-all focus:outline-none focus:ring-0 transform-gpu hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-button-primary-gradient text-primary-foreground",
        secondary: "bg-button-accent-gradient text-accent-foreground",
        destructive: "bg-button-spice-gradient text-destructive-foreground",
        outline: "bg-card text-foreground border-glow hover:shadow-glow",
        accent: "bg-button-accent-gradient text-accent-foreground",
        spice: "bg-button-spice-gradient text-destructive-foreground",
        cyber:
          "bg-button-spice-gradient text-destructive-foreground shadow-glow",
        neon: "bg-button-accent-gradient text-accent-foreground shadow-glow",
        ghost:
          "text-foreground bg-transparent border-transparent shadow-none hover:border-glow hover:shadow-glow hover:bg-muted/40",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
