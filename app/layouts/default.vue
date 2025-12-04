<script setup lang="ts">
import { usePersistUserStore } from '~/stores/user'

const store = usePersistUserStore()
const router = useRouter()
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})

const logout = async () => {
  await store.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-default-200/60 bg-background/80">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div class="flex items-center gap-3 text-lg font-semibold">
          <Icon name="mdi:link-variant" class="text-primary-500 text-2xl" />
          <span>Kun Link Shortener</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-default-500">
          <div class="flex items-center gap-2">
            <span>Light</span>
            <KunSwitch v-model="isDark" />
            <span>Dark</span>
          </div>
          <KunButton
            v-if="store.user"
            variant="ghost"
            color="default"
            size="sm"
            @click="logout"
          >
            退出登录
          </KunButton>
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 py-12">
      <slot />
    </main>
  </div>
</template>