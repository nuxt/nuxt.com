<script setup lang="ts">
import type { PropType } from 'vue'
import type { TocLink } from '@nuxt/content/dist/runtime/types'

defineProps({
  links: {
    type: Array as PropType<TocLink[]>,
    default: () => []
  }
})

const emit = defineEmits(['move'])

const route = useRoute()
const router = useRouter()

const { activeHeadings, updateHeadings } = useScrollspy()

watch(
  () => route.path,
  () => {
    if (process.client) {
      setTimeout(() => {
        updateHeadings([
          ...document.querySelectorAll('.docs-page h1'),
          ...document.querySelectorAll('.docs-page h2'),
          ...document.querySelectorAll('.docs-page h3'),
          ...document.querySelectorAll('.docs-page h4')
        ])
      }, 300)
    }
  },
  {
    immediate: true
  }
)

const scrollToHeading = (id: string) => {
  router.push(`#${id}`)
  emit('move', id)
}
</script>

<template>
  <ul class="px-1">
    <li v-for="link in links" :key="link.text" class="min-w-0 group" :class="[{ 'pl-3': link.depth === 3, 'pl-6': link.depth === 4 }]">
      <a
        :href="`#${link.id}`"
        class="block py-1 text-sm truncate lg:pr-3"
        :class="[activeHeadings.includes(link.id) ? 'text-green-500 dark:text-green-400 font-semibold' : 'u-text-gray-500 group-hover:u-text-gray-900']"
        @click.prevent="scrollToHeading(link.id)"
      >
        {{ link.text }}
      </a>
      <DocsTocLinks v-if="link.children" :links="link.children" />
    </li>
  </ul>
</template>
