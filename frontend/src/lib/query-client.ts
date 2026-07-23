import { QueryClient } from '@tanstack/react-query'
import { API_TIMEOUT_MS } from '@/constants/app'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes before going stale
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after unmount
      gcTime: 10 * 60 * 1000,
      // Retry 1 time on failure (not 3 — avoids hammering a down API)
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // Don't refetch just because a window gained focus
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Global fetch wrapper.
 * Attaches auth headers (future), applies timeout, and parses the
 * standard ApiResponse<T> envelope from the Spring Boot backend.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer))

  const envelope = await response.json()

  if (!response.ok || !envelope.success) {
    throw new Error(envelope.message ?? `Request failed: ${response.status}`)
  }

  return envelope.data as T
}
