<template>
  <div class="lg:sticky lg:pt-8 lg:-mt-8 lg:top-16 lg:max-h-[calc(100vh-64px)]">
    <div class="top-0 right-0 border-b border-dashed lg:absolute lg:pt-8 lg:w-40 lg:max-h-screen u-bg-white lg:border-none">
      <template v-if="toc.length">
        <span class="font-semibold">Table of contents</span>
        <ul class="py-4">
          <li v-for="link in toc" :key="link.text">
            <a
              :href="`#${link.id}`"
              class="block py-1 pl-3 text-sm font-medium text-gray-500 truncate hover:font-semibold hover:u-text-gray-900"
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

const { toc } = useContent()

const { activeHeadings, updateHeadings } = useScrollspy()

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
