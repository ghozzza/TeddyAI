import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "gold";

// Neobrutalism badges: solid-ish tint + hard border, readable in light & dark.
const tones: Record<Tone, string> = {
  default: "bg-secondary-background text-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-danger/20 text-danger",
  gold: "bg-main text-main-foreground",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-base border-2 border-border px-2 py-0.5 text-[11px] font-heading uppercase tracking-tight",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
