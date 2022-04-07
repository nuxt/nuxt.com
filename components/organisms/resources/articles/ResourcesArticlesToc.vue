<template>
  <div class="space-y-2 lg:sticky lg:top-0 pt-8 lg:pt-0 lg:top-20 w-full z-[1] h-full max-h-[calc(100vh-400px)]">
    <div class="lg:absolute top-0 right-0 lg:w-40 lg:max-h-screen u-bg-white border-b border-dashed lg:border-none">
      <template v-if="toc.length">
        <span class="font-semibold">Table of contents</span>
        <ul class="py-4">
          <li v-for="link in toc" :key="link.text">
            <a
              :href="`#${link.id}`"
              class="text-sm font-medium hover:font-semibold text-gray-500 hover:u-text-gray-900 py-1 pl-3 block truncate"
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
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const { activeHeadings, updateHeadings } = useScrollspy()

const { prev, next } = useContent()

const props = defineProps({
  toc: {
    type: Array,
    default: () => []
  }
})

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
