import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "rounded-lg border-glow shadow-glow-subtle placeholder:text-muted-foreground placeholder:font-bold placeholder:uppercase placeholder:tracking-wide focus-visible:shadow-glow focus-visible:-translate-y-0.5 aria-invalid:border-destructive aria-invalid:shadow-glow bg-input flex field-sizing-content min-h-16 w-full px-4 py-3 text-base font-semibold transition-all outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transform-gpu hover:shadow-glow hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
