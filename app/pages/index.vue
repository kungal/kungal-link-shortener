<script setup lang="ts">
import { usePersistUserStore } from '~/stores/user'

useHead({ title: 'KunGal Link Shortener · 登录' })

const store = usePersistUserStore()
const router = useRouter()
const credentials = reactive({ username: '', password: '' })
const formError = ref('')
const submitting = ref(false)

watch(
  () => store.user,
  (user) => {
    if (user) {
      router.replace('/dashboard')
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  formError.value = ''
  if (!credentials.username || !credentials.password) {
    formError.value = '请输入账号和密码'
    return
  }
  submitting.value = true
  try {
    await store.login({ ...credentials })
    router.replace('/dashboard')
  } catch (error: any) {
    formError.value = error?.data?.message || '登录失败，请稍后再试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex justify-center">
    <KunCard class-name="w-full max-w-md gap-6 p-8">
      <div class="space-y-2">
        <p class="text-default-500 text-sm">KunGal Link Shortener</p>
        <h1 class="text-2xl font-semibold">控制台登录</h1>
        <p class="text-default-500 text-sm">
          使用
          <code class="bg-default-100 rounded px-1 py-0.5 text-xs"
            >pnpm seed:user</code
          >
          生成的账号密码完成登录。
        </p>
      </div>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <KunInput
          v-model="credentials.username"
          label="用户名"
          placeholder="kun-admin"
          required
        />
        <KunInput
          v-model="credentials.password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          required
        />
        <p
          v-if="formError"
          class="border-danger-200 bg-danger-100/70 text-danger-600 rounded-md border px-3 py-2 text-sm"
        >
          {{ formError }}
        </p>
        <KunButton
          type="submit"
          color="primary"
          class-name="w-full"
          :loading="submitting || store.loading"
        >
          {{ submitting || store.loading ? '登录中...' : '登录控制台' }}
        </KunButton>
      </form>
    </KunCard>
  </div>
</template>
