import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResourceCategory, ResourceStatus, ResourcePriority } from '@/types/resources'

interface ResourcesFilterState {
  // Search & Filtering
  searchQuery: string
  selectedCategories: ResourceCategory[]
  selectedPriorities: ResourcePriority[]
  selectedStatuses: ResourceStatus[]
  
  // Sorting
  sortBy: 'createdAt' | 'title' | 'deadline'
  sortOrder: 'asc' | 'desc'
  
  // Layout preference (persisted)
  viewLayout: 'grid' | 'table'
  
  // Pagination
  page: number
  pageSize: number
  
  // Actions
  setSearchQuery: (query: string) => void
  toggleCategory: (category: ResourceCategory) => void
  togglePriority: (priority: ResourcePriority) => void
  toggleStatus: (status: ResourceStatus) => void
  setSort: (field: 'createdAt' | 'title' | 'deadline', order: 'asc' | 'desc') => void
  setViewLayout: (layout: 'grid' | 'table') => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetFilters: () => void
}

export const useResourcesStore = create<ResourcesFilterState>()(
  persist(
    (set) => ({
      searchQuery: '',
      selectedCategories: [],
      selectedPriorities: [],
      selectedStatuses: ['ACTIVE'], // Active by default
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewLayout: 'grid',
      page: 1,
      pageSize: 12,

      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
      
      toggleCategory: (cat) =>
        set((state) => {
          const exists = state.selectedCategories.includes(cat)
          return {
            selectedCategories: exists
              ? state.selectedCategories.filter((c) => c !== cat)
              : [...state.selectedCategories, cat],
            page: 1,
          }
        }),

      togglePriority: (pri) =>
        set((state) => {
          const exists = state.selectedPriorities.includes(pri)
          return {
            selectedPriorities: exists
              ? state.selectedPriorities.filter((p) => p !== pri)
              : [...state.selectedPriorities, pri],
            page: 1,
          }
        }),

      toggleStatus: (stat) =>
        set((state) => {
          const exists = state.selectedStatuses.includes(stat)
          return {
            selectedStatuses: exists
              ? state.selectedStatuses.filter((s) => s !== stat)
              : [...state.selectedStatuses, stat],
            page: 1,
          }
        }),

      setSort: (field, order) => set({ sortBy: field, sortOrder: order, page: 1 }),
      setViewLayout: (layout) => set({ viewLayout: layout }),
      setPage: (page) => set({ page }),
      setPageSize: (size) => set({ pageSize: size, page: 1 }),
      
      resetFilters: () =>
        set({
          searchQuery: '',
          selectedCategories: [],
          selectedPriorities: [],
          selectedStatuses: ['ACTIVE'],
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
        }),
    }),
    {
      name: 'abhi_os_resources_preference',
      partialize: (state) => ({
        viewLayout: state.viewLayout,
        pageSize: state.pageSize,
      }),
    }
  )
)
