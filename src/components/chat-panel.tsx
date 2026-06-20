"use client";

import { useEffect, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RiskProfile } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const RISKS: { value: RiskProfile; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
];

export function ChatPanel({
  messages,
  capital,
  risk,
  message,
  isPending,
  onCapital,
  onRisk,
  onMessage,
  onSubmit,
}: {
  messages: ChatMessage[];
  capital: number;
  risk: RiskProfile;
  message: string;
  isPending: boolean;
  onCapital: (v: number) => void;
  onRisk: (v: RiskProfile) => void;
  onMessage: (v: string) => void;
  onSubmit: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-2 border-border px-5 py-3.5">
        <div className="grid size-8 place-items-center rounded-base border-2 border-border bg-main text-main-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-heading uppercase tracking-tight leading-none">Pekka AI</p>
          <p className="text-[11px] uppercase tracking-tight text-muted-foreground">
            Investment Copilot · BNB Chain
          </p>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
            <div className="max-w-xs space-y-2">
              <p className="font-heading uppercase tracking-tight text-foreground">Tell Pekka your plan</p>
              <p>
                Set your capital and risk profile, then ask for an allocation. e.g.{" "}
                <span className="text-foreground">&ldquo;I have $10,000 with moderate risk.&rdquo;</span>
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-base border-2 border-border px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-main text-main-foreground"
                  : "bg-secondary-background text-foreground",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing market & building allocation…
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      <CardContent className="space-y-3 border-t-2 border-border p-4">
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-base border-2 border-border bg-background px-3 text-sm focus-within:ring-2 focus-within:ring-ring">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              min={0}
              value={capital || ""}
              placeholder="Capital"
              onChange={(e) => onCapital(Number(e.target.value))}
              className="h-10 w-full bg-transparent outline-none"
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {RISKS.map((r) => (
            <button
              key={r.value}
              onClick={() => onRisk(r.value)}
              className={cn(
                "h-9 rounded-base border-2 border-border text-xs font-heading uppercase tracking-tight transition-all",
                risk === r.value
                  ? "bg-main text-main-foreground shadow-shadow"
                  : "bg-secondary-background text-muted-foreground hover:bg-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={message}
            placeholder="Add a note (optional)…"
            onChange={(e) => onMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending && capital > 0) onSubmit();
            }}
            className="h-10 flex-1 rounded-base border-2 border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={onSubmit} disabled={isPending || !capital} className="px-4">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
