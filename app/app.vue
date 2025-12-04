<script setup lang="ts">
onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(
      '__VUE_DEVTOOLS_NEXT_PLUGIN_SETTINGS__dev.esm.pinia__',
      '{"logStoreChanges":false}'
    )
  }
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
})
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
