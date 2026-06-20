import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "gold";

const tones: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-[hsl(var(--success))]",
  warning: "bg-warning/15 text-[hsl(var(--warning))]",
  danger: "bg-danger/15 text-[hsl(var(--danger))]",
  gold: "bg-primary/15 text-primary",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
