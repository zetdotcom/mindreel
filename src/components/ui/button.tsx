import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-black transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent uppercase tracking-wide border-brutal shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:translate-x-2 active:translate-y-2 active:shadow-none transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-foreground",
        outline:
          "border-foreground bg-background hover:bg-accent hover:text-accent-foreground shadow-brutal",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground border-transparent shadow-none hover:shadow-brutal hover:border-foreground",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none uppercase font-black",
        cyber:
          "bg-accent text-accent-foreground hover:bg-accent/90 border-foreground shadow-brutal-lg",
        neon: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 border-foreground shadow-brutal-lg",
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
