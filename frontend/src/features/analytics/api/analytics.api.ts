import { api } from '@/services/api'

export interface ChartDataPoint {
  date: string
  completedTasks: number
  studyMinutes: number
  aiTokens: number
  activeListings: number
}

export interface DashboardAnalytics {
  completedTasks: number
  taskCompletionRate: number
  totalStudyHours: number
  totalAiTokens: number
  activeListings: number
  chartData: ChartDataPoint[]
  insights: string[]
}

export interface ProductivityPoint {
  date: string
  completedCount: number
  createdCount: number
}

export interface ProductivityAnalytics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  highPriorityCompleted: number
  highPriorityTotal: number
  mediumPriorityCompleted: number
  mediumPriorityTotal: number
  lowPriorityCompleted: number
  lowPriorityTotal: number
  timeline: ProductivityPoint[]
}

export interface AiPoint {
  date: string
  tokenCount: number
  queryCount: number
}

export interface AiAnalytics {
  totalConversations: number
  totalQueries: number
  totalTokens: number
  avgMessagesPerConversation: number
  timeline: AiPoint[]
}

export interface ResourcePoint {
  date: string
  createdCount: number
}

export interface ResourceAnalytics {
  totalResources: number
  totalLectureNotes: number
  totalBooks: number
  totalCheatsheets: number
  totalPastPapers: number
  totalOthers: number
  timeline: ResourcePoint[]
}

export interface MarketplacePoint {
  date: string
  createdCount: number
  soldCount: number
}

export interface MarketplaceAnalytics {
  totalListings: number
  activeListings: number
  soldListings: number
  totalRevenue: number
  totalBooks: number
  totalElectronics: number
  totalHousing: number
  totalServices: number
  totalClothing: number
  totalOthers: number
  timeline: MarketplacePoint[]
}

export const analyticsApi = {
  getDashboardAnalytics: async (range: number): Promise<DashboardAnalytics> => {
    const response = await api.get(`/analytics/dashboard?range=${range}`)
    return response.data?.data
  },
  getProductivityAnalytics: async (range: number): Promise<ProductivityAnalytics> => {
    const response = await api.get(`/analytics/productivity?range=${range}`)
    return response.data?.data
  },
  getAiAnalytics: async (range: number): Promise<AiAnalytics> => {
    const response = await api.get(`/analytics/ai?range=${range}`)
    return response.data?.data
  },
  getResourceAnalytics: async (range: number): Promise<ResourceAnalytics> => {
    const response = await api.get(`/analytics/resources?range=${range}`)
    return response.data?.data
  },
  getMarketplaceAnalytics: async (range: number): Promise<MarketplaceAnalytics> => {
    const response = await api.get(`/analytics/marketplace?range=${range}`)
    return response.data?.data
  },
}
