import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  username: string
  display_name: string
  email: string | null
  role: number
}

export const usePersistUserStore = defineStore(
  'link-user',
  () => {
    const user = ref<AuthUser | null>(null)
    const loading = ref(false)

    const setUser = (payload: AuthUser | null) => {
      user.value = payload
    }

    const login = async (credentials: {
      username: string
      password: string
    }) => {
      loading.value = true
      try {
        const data = await $fetch<AuthUser>('/api/auth/login', {
          method: 'POST',
          body: credentials
        })
        setUser(data)
        return data
      } finally {
        loading.value = false
      }
    }

    const fetchProfile = async () => {
      loading.value = true
      try {
        const data = await $fetch<AuthUser | null>('/api/auth/me')
        setUser(data)
        return data
      } finally {
        loading.value = false
      }
    }

    const logout = async () => {
      await $fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    }

    return {
      user,
      loading,
      login,
      logout,
      fetchProfile,
      setUser
    }
  },
  { persist: true }
)
