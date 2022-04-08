<template>
  <div class="space-y-2">
    <NuxtLink v-if="prev" :to="prev.slug" class="flex lg:flex-row-reverse items-center font-medium hover:font-semibold text-sm u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-700 gap-x-3">
      <div class="flex-shrink-0 p-1 u-bg-gray-100 rounded-md">
        <UIcon name="heroicons-solid:chevron-double-left" class="w-4 h-4 u-text-gray-400" />
      </div>

      <span>Previous page</span>
    </NuxtLink>

    <template v-if="toc.length">
      <div class="flex lg:flex-row-reverse items-center font-semibold u-text-gray-900 text-sm gap-x-3">
        <div class="flex-shrink-0 p-1 u-bg-gray-900 rounded-md">
          <UIcon name="heroicons-outline:view-grid" class="w-4 h-4 u-text-white" />
        </div>

        <span>On this page</span>
      </div>

      <ul class="pl-3 lg:pr-3">
        <li v-for="link in toc" :key="link.text" class="border-l-2 lg:border-r-2 lg:border-l-0 min-w-0 lg:text-right" :class="activeHeadings.includes(link.id) ? 'u-border-gray-900' : 'u-border-gray-300'">
          <a
            :href="`#${link.id}`"
            class="text-sm py-1 pl-3 lg:pr-3 block truncate focus:outline-none"
            :class="{
              'u-text-gray-900 font-semibold': activeHeadings.includes(link.id),
              'font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-700': !activeHeadings.includes(link.id)
            }"
            @click.prevent="scrollToHeading(link.id, '--docs-scroll-margin-block')"
          >
            {{ link.text }}
          </a>
        </li>
      </ul>
    </template>

    <NuxtLink v-if="next" :to="next.slug" class="flex lg:flex-row-reverse items-center font-medium hover:font-semibold text-sm u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-700 gap-x-3 focus:outline-none">
      <div class="flex-shrink-0 p-1 u-bg-gray-100 rounded-md">
        <UIcon name="heroicons-solid:chevron-double-right" class="w-4 h-4 u-text-gray-400" />
      </div>

      <span>Next page</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const { activeHeadings, updateHeadings } = useScrollspy()

const { toc, prev, next } = useContent()

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
