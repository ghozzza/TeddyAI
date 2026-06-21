"use client";

import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "./connect-button";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { label: "Copilot", href: "#copilot", active: true },
  { label: "Markets", href: "#markets", active: false },
  { label: "Portfolio", href: "#portfolio", active: false },
];

export function TopBar({ actions }: { actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-border pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-base border-2 border-border bg-main text-main-foreground shadow-shadow">
            <TrendingUp className="h-5 w-5" />
          </span>
          <span className="text-xl font-heading uppercase tracking-tight">Teddy AI</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "rounded-base border-2 border-border px-3 py-1.5 text-sm font-heading uppercase tracking-tight shadow-shadow transition-colors hover:bg-main hover:text-main-foreground",
                item.active ? "bg-main text-main-foreground" : "bg-secondary-background text-muted-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
