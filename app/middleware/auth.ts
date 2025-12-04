import { usePersistUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async () => {
  const store = usePersistUserStore()
  if (!store.user) {
    try {
      await store.fetchProfile()
    } catch (error) {
      console.error(error)
    }
  }
  if (!store.user) {
    return navigateTo('/', { replace: true })
  }
})