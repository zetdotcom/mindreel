import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "rounded-lg border-glow shadow-glow-subtle placeholder:text-muted-foreground placeholder:font-bold placeholder:uppercase placeholder:tracking-wide focus-visible:shadow-glow focus-visible:-translate-y-0.5 aria-invalid:border-destructive aria-invalid:shadow-glow bg-input flex h-12 w-full px-4 py-3 text-base font-semibold transition-all outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transform-gpu hover:shadow-glow hover:-translate-y-0.5 file:border-0 file:bg-transparent file:text-sm file:font-bold file:uppercase file:tracking-wide",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
