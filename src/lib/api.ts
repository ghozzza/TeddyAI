import type {
  AnalyzeRequest,
  ExecuteRequest,
  ExecuteResult,
  MarketData,
  PortfolioAction,
  AgentResult,
  RiskReport,
} from "@/types";
import type { AgentLogEntry } from "@/services/agent-log";
import type { WalletPerformance } from "@/lib/performance";

export interface AnalyzeResponse {
  result: AgentResult;
  risk: RiskReport;
  market: MarketData;
  actions: PortfolioAction[];
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Request failed");
  return json as T;
}

export async function fetchMarket(): Promise<MarketData> {
  const res = await fetch("/api/market");
  if (!res.ok) throw new Error("Failed to load market");
  return res.json();
}

export function analyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  return post<AnalyzeResponse>("/api/analyze", req);
}

export function execute(req: ExecuteRequest): Promise<ExecuteResult> {
  return post<ExecuteResult>("/api/execute", req);
}

export async function fetchHistory(limit = 20): Promise<AgentLogEntry[]> {
  const res = await fetch(`/api/history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load agent history");
  const json = (await res.json()) as { entries: AgentLogEntry[] };
  return json.entries;
}

export async function fetchPerformance(): Promise<WalletPerformance | null> {
  const res = await fetch("/api/performance");
  if (!res.ok) throw new Error("Failed to load wallet performance");
  const json = (await res.json()) as { performance: WalletPerformance | null };
  return json.performance;
}
