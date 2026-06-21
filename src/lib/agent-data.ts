/**
 * Hybrid-deploy bridge. The autonomous agent's read-only data (decision log +
 * performance) is written by the worker on the VPS where twak runs. When the FE
 * is hosted elsewhere (e.g. Vercel), set AGENT_DATA_ORIGIN to the VPS so those
 * routes proxy to it. If the box is unreachable, we degrade to an empty result
 * so the UI shows its graceful empty state instead of hard-erroring. On the VPS
 * itself AGENT_DATA_ORIGIN is unset and the routes read the local file.
 */

export function agentDataOrigin(): string | null {
  const o = process.env.AGENT_DATA_ORIGIN?.trim();
  return o ? o.replace(/\/$/, "") : null;
}

export async function proxyAgentData<T>(path: string, fallback: T): Promise<T> {
  const origin = agentDataOrigin();
  if (!origin) return fallback;
  try {
    const res = await fetch(`${origin}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    // box unreachable → fall through to the empty fallback
  }
  return fallback;
}
