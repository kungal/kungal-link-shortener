import { usePersistUserStore } from '~/stores/user'

export default defineNuxtPlugin(async () => {
  const store = usePersistUserStore()
  if (!store.user) {
    try {
      await store.fetchProfile()
    } catch (error) {
      console.error(error)
    }
  }
})
