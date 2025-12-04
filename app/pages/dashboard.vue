<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLinkStore } from '~/stores/link'
import { usePersistUserStore } from '~/stores/user'

definePageMeta({ middleware: 'auth' })

useHead({ title: '控制台 · KunGal Link Shortener' })

const linkStore = useLinkStore()
const userStore = usePersistUserStore()
const { items, stats, selectedAlias } = storeToRefs(linkStore)

const form = reactive({
  destination_url: '',
  alias: '',
  description: '',
  max_visits: 0,
  expires_at: '',
  forward_params: false,
  unlimited_visits: false,
  never_expires: false
})

const feedback = ref<{ text: string; type: 'success' | 'error' } | null>(null)
const creating = ref(false)
const statsRange = ref(7)
const statsLoading = ref(false)

const selectedLink = computed(
  () => items.value.find((link) => link.alias === selectedAlias.value) ?? null
)

const currentStats = computed(() => {
  if (!selectedAlias.value) return null
  return stats.value[selectedAlias.value] || null
})

const shortUrl = computed(() => selectedLink.value?.short_url ?? '')
const hasLinks = computed(() => items.value.length > 0)

const setFeedback = (text: string, type: 'success' | 'error' = 'success') => {
  feedback.value = { text, type }
  if (type === 'success') {
    setTimeout(() => {
      feedback.value = null
    }, 2200)
  }
}

const resetForm = () => {
  form.destination_url = ''
  form.alias = ''
  form.description = ''
  form.max_visits = 0
  form.expires_at = ''
  form.forward_params = false
  form.unlimited_visits = false
  form.never_expires = false
}

onMounted(async () => {
  await linkStore.fetchLinks()
})

watch(
  () => form.unlimited_visits,
  (value) => {
    if (value) {
      form.max_visits = 0
    }
  }
)

watch(
  () => form.never_expires,
  (value) => {
    if (value) {
      form.expires_at = ''
    }
  }
)

watch(
  () => [selectedAlias.value, statsRange.value],
  async ([alias, range]) => {
    if (!alias) return
    statsLoading.value = true
    try {
      await linkStore.fetchStats(alias, Number(range))
    } finally {
      statsLoading.value = false
    }
  },
  { immediate: true }
)

const createLink = async () => {
  feedback.value = null
  if (!form.destination_url) {
    setFeedback('请输入目标链接', 'error')
    return
  }
  creating.value = true
  try {
    const maxVisits = form.unlimited_visits ? 0 : form.max_visits || 0
    const expiresAt = form.never_expires
      ? null
      : form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null

    await linkStore.createLink({
      destination_url: form.destination_url,
      alias: form.alias || undefined,
      description: form.description || undefined,
      max_visits: maxVisits,
      expires_at: expiresAt,
      forward_params: form.forward_params
    })
    resetForm()
    setFeedback('短链创建成功', 'success')
  } catch (error: any) {
    setFeedback(error?.data?.message || '创建失败，请稍后再试', 'error')
  } finally {
    creating.value = false
  }
}

const copyShortUrl = async () => {
  if (!shortUrl.value || typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(shortUrl.value)
  setFeedback('短链已复制', 'success')
}

const refreshStats = async () => {
  if (!selectedAlias.value) return
  statsLoading.value = true
  try {
    await linkStore.fetchStats(selectedAlias.value, statsRange.value)
  } finally {
    statsLoading.value = false
  }
}

const formatTime = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
    <div class="space-y-6">
      <KunCard class-name="gap-3 p-6">
        <p class="text-default-500 text-sm">当前账号</p>
        <div class="flex items-center gap-3">
          <div
            class="bg-primary-500/10 text-primary-600 dark:text-primary-300 flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold"
          >
            {{ userStore.user?.display_name?.charAt(0) || 'K' }}
          </div>
          <div>
            <p class="text-lg font-semibold">
              {{ userStore.user?.display_name }}
            </p>
            <p class="text-default-500 text-sm">
              {{ userStore.user?.username }}
            </p>
          </div>
        </div>
      </KunCard>

      <KunCard class-name="p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">创建短链接</h2>
            <p class="text-default-500 text-sm">填写目标链接与别名即可生成</p>
          </div>
        </div>
        <form class="mt-6 space-y-4" @submit.prevent="createLink">
          <KunInput
            v-model="form.destination_url"
            label="目标链接"
            placeholder="https://example.com/landing"
            required
          />
            <div class="grid gap-4 sm:grid-cols-2">
              <KunInput
                v-model="form.alias"
                label="自定义别名"
                placeholder="spring-campaign"
              />
              <KunInput
                v-model.number="form.max_visits"
                label="最大访问次数"
                type="number"
                min="0"
                :disabled="form.unlimited_visits"
              />
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-default-200/70 bg-default-50 px-4 py-3 text-sm text-default-600">
              <div>
                <p class="font-medium text-default-700">允许无限访问</p>
                <p class="text-xs text-default-500">启用后最大访问次数将被忽略</p>
              </div>
              <KunSwitch v-model="form.unlimited_visits" />
            </div>
            <KunInput
              v-model="form.expires_at"
              label="失效时间"
              type="datetime-local"
              :disabled="form.never_expires"
            />
            <div class="flex items-center justify-between rounded-2xl border border-default-200/70 bg-default-50 px-4 py-3 text-sm text-default-600">
              <div>
                <p class="font-medium text-default-700">永久有效</p>
                <p class="text-xs text-default-500">启用后短链不会因时间失效</p>
              </div>
              <KunSwitch v-model="form.never_expires" />
            </div>
            <KunTextarea
              v-model="form.description"
              label="备注"
              placeholder="用于内部对齐的说明"
            :rows="2"
          />
          <KunCheckBox
            v-model="form.forward_params"
            label="保留访问者查询参数"
          />
          <KunButton
            type="submit"
            color="primary"
            class-name="w-full"
            :loading="creating"
          >
            创建短链
          </KunButton>
        </form>
      </KunCard>

      <KunCard class-name="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">我的短链</h2>
            <p class="text-default-500 text-sm">共 {{ items.length }} 条</p>
          </div>
          <KunButton
            variant="light"
            color="primary"
            size="sm"
            @click="linkStore.fetchLinks()"
          >
            刷新列表
          </KunButton>
        </div>
        <div v-if="hasLinks" class="max-h-80 space-y-3 overflow-y-auto pr-1">
          <div
            v-for="item in items"
            :key="item.id"
            :class="[
              'rounded-xl border px-4 py-3 text-left transition',
              item.alias === selectedAlias
                ? 'border-primary-300 bg-primary-50 dark:bg-primary-500/10'
                : 'border-default-200 hover:border-primary-200'
            ]"
            @click="linkStore.setSelected(item.alias)"
          >
            <p class="text-sm font-semibold">{{ item.alias }}</p>
            <p class="text-default-500 truncate text-xs">
              {{ item.destination_url }}
            </p>
            <div class="text-default-500 mt-2 flex flex-wrap gap-3 text-xs">
              <span>{{ item.visit_count }} 次访问</span>
              <span>{{ item.status === 0 ? '活跃' : '停用' }}</span>
            </div>
          </div>
        </div>
        <p
          v-else
          class="border-default-200 text-default-500 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
        >
          暂无数据，先创建一个短链接吧。
        </p>
      </KunCard>
    </div>

    <div class="space-y-6">
      <KunCard class-name="space-y-4 p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <p class="text-default-500 text-sm">当前短链</p>
            <h2 class="text-xl font-semibold">
              {{ shortUrl || '尚未选择短链' }}
            </h2>
          </div>
          <KunButton
            v-if="shortUrl"
            variant="bordered"
            color="primary"
            size="sm"
            @click="copyShortUrl"
          >
            复制短链
          </KunButton>
          <div class="text-default-500 ml-auto flex items-center gap-2 text-sm">
            <span>最近 {{ statsRange }} 天</span>
            <select
              v-model.number="statsRange"
              class="border-default-200 rounded-lg border px-2 py-1 text-sm"
            >
              <option :value="7">7 天</option>
              <option :value="14">14 天</option>
              <option :value="30">30 天</option>
            </select>
            <KunButton
              variant="light"
              color="default"
              size="sm"
              :loading="statsLoading"
              @click="refreshStats"
            >
              刷新
            </KunButton>
          </div>
        </div>

        <div v-if="currentStats" class="grid gap-3 sm:grid-cols-3">
          <KunCard
            class-name="border-default-200/70 bg-default-50 p-4"
            :is-hoverable="false"
          >
            <p class="text-default-500 text-xs">累计点击</p>
            <p class="mt-2 text-2xl font-semibold">
              {{ currentStats.summary.total_visits }}
            </p>
          </KunCard>
          <KunCard
            class-name="border-default-200/70 bg-default-50 p-4"
            :is-hoverable="false"
          >
            <p class="text-default-500 text-xs">独立访客</p>
            <p class="mt-2 text-2xl font-semibold">
              {{ currentStats.summary.unique_visitors }}
            </p>
          </KunCard>
          <KunCard
            class-name="border-default-200/70 bg-default-50 p-4"
            :is-hoverable="false"
          >
            <p class="text-default-500 text-xs">最近访问</p>
            <p class="mt-2 text-lg font-semibold">
              {{ formatTime(currentStats.summary.last_visit) }}
            </p>
          </KunCard>
        </div>
        <p
          v-else
          class="border-default-200 text-default-500 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
        >
          选择一条短链即可查看统计信息。
        </p>
      </KunCard>

      <KunCard v-if="currentStats" class-name="space-y-4 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">小时级访问趋势</h3>
          <span class="text-default-500 text-xs">{{
            statsLoading ? '更新中...' : '实时数据'
          }}</span>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2">
          <div
            v-for="bucket in currentStats.buckets"
            :key="bucket.id"
            class="flex w-10 flex-col items-center"
          >
            <div
              class="bg-default-100 flex h-32 w-full items-end rounded-xl p-1"
            >
              <div
                class="from-primary-500 to-secondary-400 w-full rounded-lg bg-gradient-to-t"
                :style="{ height: `${Math.min(100, bucket.visits * 10)}%` }"
              ></div>
            </div>
            <p class="text-default-500 mt-2 text-[10px]">
              {{ new Date(bucket.bucket_start).getHours() }}:00
            </p>
          </div>
        </div>
      </KunCard>

      <KunCard v-if="currentStats" class-name="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead
              class="border-default-200 bg-default-50 text-default-500 border-b text-xs uppercase"
            >
              <tr>
                <th class="px-4 py-3 text-left">时间</th>
                <th class="px-4 py-3 text-left">IP</th>
                <th class="px-4 py-3 text-left">来源</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in currentStats.recent"
                :key="item.id"
                class="border-default-100 border-b last:border-b-0"
              >
                <td class="px-4 py-3">{{ formatTime(item.created) }}</td>
                <td class="px-4 py-3">{{ item.ip || '未知' }}</td>
                <td class="text-default-500 px-4 py-3">
                  {{ item.referer || '直接访问' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </KunCard>
    </div>
  </div>

  <transition name="fade">
    <div v-if="feedback" class="fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
      <div
        :class="[
          'rounded-full px-5 py-2 text-sm shadow-lg',
          feedback.type === 'error'
            ? 'bg-danger-100 text-danger-600'
            : 'bg-success-100 text-success-700'
        ]"
      >
        {{ feedback.text }}
      </div>
    </div>
  </transition>
</template>
