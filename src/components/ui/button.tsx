import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-black transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent uppercase tracking-wide rounded-lg shadow-glow-subtle border-glow hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.97] active:shadow-glow-subtle transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-button-primary-gradient text-primary-foreground",
        destructive: "bg-button-spice-gradient text-destructive-foreground",
        outline: "bg-background text-foreground border-glow hover:bg-muted",
        secondary: "bg-button-primary-gradient text-primary-foreground",
        ghost:
          "bg-transparent text-foreground border-transparent shadow-none hover:bg-muted/40 hover:border-glow hover:shadow-glow",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none uppercase font-black bg-transparent",
        warm: "bg-button-accent-gradient text-accent-foreground",
        accent: "bg-button-accent-gradient text-accent-foreground",
        spice: "bg-button-spice-gradient text-destructive-foreground",
        cyber:
          "bg-button-spice-gradient text-destructive-foreground shadow-glow",
        neon: "bg-button-accent-gradient text-accent-foreground shadow-glow",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-5",
        sm: "h-9 px-4 py-2 gap-1.5 has-[>svg]:px-3 text-xs",
        lg: "h-14 px-8 py-4 has-[>svg]:px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
