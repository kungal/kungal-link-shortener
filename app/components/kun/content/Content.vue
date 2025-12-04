<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'
import { useSpoilerContent } from '~/composables/topic/useSpoilerContent'
import 'katex/dist/katex.min.css'

withDefaults(
  defineProps<{
    content: string
    className?: string
  }>(),
  {
    className: ''
  }
)

const articleRef = ref<HTMLElement | null>(null)

useSpoilerContent(articleRef)

const sanitizeConfig = {
  ADD_TAGS: ['div', 'span', 'button'],
  ADD_ATTR: ['class', 'title', 'line']
}
</script>

<template>
  <div>
    <article
      ref="articleRef"
      :class="cn('kun-prose', className)"
      v-html="DOMPurify.sanitize(content, sanitizeConfig)"
    />
  </div>
</template>
