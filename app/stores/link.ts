import { defineStore } from 'pinia'

export interface ShortLinkItem {
  id: number
  alias: string
  short_url: string
  destination_url: string
  description: string
  status: number
  expires_at: string | null
  max_visits: number
  visit_count: number
  last_visited_at: string | null
  created: string
}

export interface LinkStatsResponse {
  link: {
    alias: string
    destination_url: string
    description: string
    created: string
    visit_count: number
    expires_at: string | null
  }
  summary: {
    total_visits: number
    unique_visitors: number
    last_visit: string | null
    range_days: number
  }
  buckets: Array<{
    id: number
    bucket_start: string
    visits: number
    unique_ips: number
  }>
  recent: Array<{
    id: number
    created: string
    referer: string
    ip: string
    user_agent: string
  }>
}

export const useLinkStore = defineStore('link-store', () => {
  const items = ref<ShortLinkItem[]>([])
  const loading = ref(false)
  const stats = ref<Record<string, LinkStatsResponse>>({})
  const selectedAlias = ref<string>('')

  const fetchLinks = async () => {
    loading.value = true
    try {
      const data = await $fetch<ShortLinkItem[]>('/api/links')
      items.value = data
      if (data.length && !selectedAlias.value) {
        selectedAlias.value = data[0].alias
      }
    } finally {
      loading.value = false
    }
  }

  const createLink = async (payload: {
    destination_url: string
    alias?: string
    description?: string
    expires_at?: string | null
    max_visits?: number
    forward_params?: boolean
  }) => {
    const newLink = await $fetch<ShortLinkItem>('/api/links', {
      method: 'POST',
      body: payload
    })
    items.value = [newLink, ...items.value]
    selectedAlias.value = newLink.alias
    return newLink
  }

  const fetchStats = async (alias: string, range: number = 7) => {
    const result = await $fetch<LinkStatsResponse>(
      `/api/links/${alias}/stats`,
      {
        query: { range }
      }
    )
    stats.value[alias] = result
    return result
  }

  const setSelected = (alias: string) => {
    selectedAlias.value = alias
  }

  return {
    items,
    loading,
    stats,
    selectedAlias,
    fetchLinks,
    createLink,
    fetchStats,
    setSelected
  }
})
