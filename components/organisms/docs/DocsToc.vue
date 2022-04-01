<template>
  <div class="flex flex-col text-sm font-medium text-right gap-y-2 u-text-gray-500">
    <NuxtLink :to="previous?.slug || '#'" :disabled="!previous?.slug" class="flex justify-end hover:font-semibold hover:u-text-gray-900 gap-x-3">
      <span>Previous page</span>
      <IconTocBack />
    </NuxtLink>
    <template v-if="toc.length">
      <div class="flex justify-end font-semibold u-text-gray-900 gap-x-3">
        <span>On this page</span>
        <IconTocCurrent />
      </div>
      <ul class="flex flex-col pr-2.5">
        <li v-for="link in toc" :key="link.text" class="py-1 overflow-hidden truncate border-r-2" :class="activeHeadings.includes(link.id) ? 'u-border-gray-900' : 'u-border-gray-300'">
          <a
            :to="{ hash: link.id }"
            class="hover:font-semibold hover:u-text-gray-900 mr-2"
            :class="{
              'u-text-gray-900': activeHeadings.includes(link.id),
            }"
            @click.prevent="scrollToHeading(link.id, '--docs-scroll-margin-block')"
          >
            {{ link.text }}
          </a>
        </li>
      </ul>
    </template>
    <NuxtLink :to="next?.slug || '#'" :disabled="!next?.slug" class="flex justify-end hover:font-semibold hover:u-text-gray-900 gap-x-3">
      <span>Next page</span>
      <IconTocNext />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps({
  toc: {
    type: Array,
    default: () => []
  }
})

const route = useRoute()

const { activeHeadings, updateHeadings } = useScrollspy()

const { toc, previous, next } = useDocs()

watch(route, () => {
  if (process.client) {
    setTimeout(() => {
      updateHeadings([
        ...document.querySelectorAll('.prose h1'),
        ...document.querySelectorAll('.prose h2'),
        ...document.querySelectorAll('.prose h3')
      ])
    }, 200)
  }
}, {
  immediate: true
})

function scrollToHeading (id: string, scrollMarginCssVar: string) {
  useScrollToHeading(id, scrollMarginCssVar)
}
</script>
