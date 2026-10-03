import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { urlsApi } from "@/api/urls.api";
import type { CreateUrlPayload, ShortURL } from "@/types/url.types";

export const USER_URLS_QUERY_KEY = ["user-urls"] as const;
export const URL_STATS_QUERY_KEY = ["url-stats"] as const;

/**
 * Invalidates all URL-related queries (user links feed and account stats)
 * so that feeds and summary metrics reflect mutations instantly.
 */
export async function invalidateUrlQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: USER_URLS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: URL_STATS_QUERY_KEY }),
  ]);
}

interface UseUserUrlsOptions {
  search?: string;
  limit?: number;
}

export function useUserUrls({ search = "", limit = 10 }: UseUserUrlsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: [USER_URLS_QUERY_KEY[0], { search: search.trim() }],
    queryFn: async ({ pageParam }) => {
      return urlsApi.getUserUrls({
        limit,
        cursor: pageParam as string | undefined,
        search: search.trim() || undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined;
    },
    // Keep the current list on screen while a new search loads, instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });

  // Flatten all paginated pages into a single flat array
  const links: ShortURL[] = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    links,
    totalLoaded: links.length,
  };
}

/** Account-wide totals for the dashboard header. Invalidate alongside ["user-urls"]. */
export function useUrlStats() {
  return useQuery({
    queryKey: URL_STATS_QUERY_KEY,
    queryFn: () => urlsApi.getStats(),
  });
}

export type CreateUrlVariables = CreateUrlPayload | string;

export interface UpdateUrlVariables {
  shortCode: string;
  updatedOriginalUrl: string;
}

/**
 * Wraps urlsApi.createShortUrl with automatic cache invalidation
 * for both ["user-urls"] and URL_STATS_QUERY_KEY on success.
 */
export function useCreateUrlMutation<TError = any, TContext = unknown>(
  options?: UseMutationOptions<ShortURL, TError, CreateUrlVariables, TContext>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload: CreateUrlVariables) => {
      const body: CreateUrlPayload =
        typeof payload === "string" ? { originalUrl: payload } : payload;
      return urlsApi.createShortUrl(body);
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await invalidateUrlQueries(queryClient);
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/**
 * Wraps urlsApi.updateUrl with automatic cache invalidation
 * for both ["user-urls"] and URL_STATS_QUERY_KEY on success.
 */
export function useUpdateUrlMutation<TError = any, TContext = unknown>(
  options?: UseMutationOptions<ShortURL, TError, UpdateUrlVariables, TContext>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async ({ shortCode, updatedOriginalUrl }: UpdateUrlVariables) => {
      return urlsApi.updateUrl(shortCode, updatedOriginalUrl);
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await invalidateUrlQueries(queryClient);
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/**
 * Wraps urlsApi.deleteUrl with automatic cache invalidation
 * for both ["user-urls"] and URL_STATS_QUERY_KEY on success.
 */
export function useDeleteUrlMutation<TError = any, TContext = unknown>(
  options?: UseMutationOptions<void, TError, string, TContext>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (shortCode: string) => {
      return urlsApi.deleteUrl(shortCode);
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await invalidateUrlQueries(queryClient);
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
