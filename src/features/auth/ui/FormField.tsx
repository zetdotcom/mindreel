import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * FormField component provides a consistent form input with label and error display
 * Follows brutalist design system
 */
export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className="text-sm font-black uppercase tracking-wide"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-bold text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
