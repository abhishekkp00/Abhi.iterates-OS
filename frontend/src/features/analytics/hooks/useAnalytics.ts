import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics.api'

export function useAnalyticsQuery(range: number) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', range],
    queryFn: () => analyticsApi.getDashboardAnalytics(range),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  })
}

export function useProductivityAnalyticsQuery(range: number) {
  return useQuery({
    queryKey: ['analytics', 'productivity', range],
    queryFn: () => analyticsApi.getProductivityAnalytics(range),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export function useAiAnalyticsQuery(range: number) {
  return useQuery({
    queryKey: ['analytics', 'ai', range],
    queryFn: () => analyticsApi.getAiAnalytics(range),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export function useResourceAnalyticsQuery(range: number) {
  return useQuery({
    queryKey: ['analytics', 'resources', range],
    queryFn: () => analyticsApi.getResourceAnalytics(range),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export function useMarketplaceAnalyticsQuery(range: number) {
  return useQuery({
    queryKey: ['analytics', 'marketplace', range],
    queryFn: () => analyticsApi.getMarketplaceAnalytics(range),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
