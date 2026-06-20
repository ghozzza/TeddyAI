import type {
  AnalyzeRequest,
  ExecuteRequest,
  ExecuteResult,
  MarketData,
  PortfolioAction,
  AgentResult,
  RiskReport,
} from "@/types";

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
