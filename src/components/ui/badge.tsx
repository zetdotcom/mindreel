import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-brutal shadow-brutal px-3 py-1 text-xs font-black uppercase tracking-brutal transition-all focus:outline-none focus:ring-0 transform-gpu hover:shadow-brutal-lg hover:translate-x-0.5 hover:translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground border-foreground hover:bg-destructive/90",
        outline:
          "bg-background text-foreground border-foreground hover:bg-accent hover:text-accent-foreground",
        accent:
          "bg-accent text-accent-foreground border-foreground hover:bg-accent/90",
        cyber:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground border-foreground shadow-brutal-lg hover:from-primary/90 hover:to-accent/90",
        neon:
          "bg-primary text-primary-foreground border-foreground neon-glow",
        ghost:
          "text-foreground border-transparent shadow-none hover:shadow-brutal hover:border-foreground hover:bg-accent hover:text-accent-foreground",
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
