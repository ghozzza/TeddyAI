import { QueryClient } from "@tanstack/react-query";

/**
 * Factory (not a module singleton) so Next.js App Router gets a fresh client
 * per request on the server while the browser keeps one stable instance.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — market data refetches on its own interval
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = (error as { status?: number })?.status;
          if (status === 401 || status === 403) return false; // auth errors won't fix on retry
          return failureCount < 1;
        },
      },
    },
  });
}
