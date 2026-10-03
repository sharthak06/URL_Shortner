import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute fresh cache window
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection retention
      refetchOnWindowFocus: false, // Prevents layout shifts on tab switching
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        // Do not retry client auth/validation errors or active rate limits
        if ([400, 401, 403, 404, 429].includes(status)) return false;
        // Retry 5xx errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with random jitter to prevent thundering herd
        return Math.min(1000 * 2 ** attemptIndex + Math.random() * 500, 10000);
      },
    },
  },
});
