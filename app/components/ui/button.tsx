import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "form"
  | "accent-outline"
  | "danger"
  | "danger-ghost"
  | "ghost"
  | "icon-accent"
  | "outline-accent"
  | "toggle";

const VARIANT_CLASSES: Record<Exclude<ButtonVariant, "toggle">, string> = {
  primary: "bg-ac text-acfg hover:opacity-90",
  secondary: "border border-line bg-transparent text-dim hover:border-fg hover:text-fg",
  form: "border border-line bg-panel2 hover:border-ac",
  "accent-outline": "border border-ac bg-transparent text-ac hover:bg-acsoft",
  danger: "bg-[oklch(.58_.17_25)] text-white hover:opacity-90",
  "danger-ghost":
    "border border-line bg-transparent text-dim hover:border-[oklch(.6_.17_25)] hover:text-[oklch(.6_.17_25)]",
  ghost: "border-0 bg-transparent text-dim hover:text-fg",
  "icon-accent": "border border-line bg-transparent text-dim hover:border-ac hover:text-ac",
  "outline-accent": "border border-line bg-transparent text-fg hover:border-ac hover:text-ac",
};

const TOGGLE_ACTIVE_CLASSES = "border-ac bg-ac text-acfg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Only used when variant="toggle" — selects the active/inactive color state. */
  active?: boolean;
}

export function Button({
  variant = "primary",
  active,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const colorClasses =
    variant === "toggle"
      ? active
        ? TOGGLE_ACTIVE_CLASSES
        : VARIANT_CLASSES.secondary
      : VARIANT_CLASSES[variant];

  return (
    <button
      type={type}
      className={cn(colorClasses, "outline-none disabled:opacity-50", className)}
      {...props}
    />
  );
}
