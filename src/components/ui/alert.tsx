import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border-glow shadow-glow-subtle px-6 py-4 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-4 gap-y-2 items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current font-bold transform-gpu hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.97] transition-all",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-button-spice-gradient text-destructive-foreground [&>svg]:text-current *:data-[slot=alert-description]:text-destructive-foreground/90",
        warning:
          "bg-button-accent-gradient text-accent-foreground [&>svg]:text-current *:data-[slot=alert-description]:text-accent-foreground/90",
        success:
          "bg-button-primary-gradient text-primary-foreground [&>svg]:text-current *:data-[slot=alert-description]:text-primary-foreground/90",
        cyber:
          "bg-button-spice-gradient text-destructive-foreground shadow-glow [&>svg]:text-current *:data-[slot=alert-description]:text-destructive-foreground/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-5 font-black tracking-wide uppercase text-base",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-current/80 col-start-2 grid justify-items-start gap-2 text-sm font-semibold [&_p]:leading-relaxed uppercase tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
