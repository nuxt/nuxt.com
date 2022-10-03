<template>
  <div class="relative flex flex-col-reverse gap-8 lg:grid lg:grid-cols-10 docs-page">
    <div :class="{ 'col-span-10 lg:col-span-8': toc, 'col-span-10': !toc }">
      <DocsPageHeader v-if="header && page" />

      <slot />
    </div>

    <div
      v-if="toc"
      class="lg:col-span-2 lg:self-start overflow-x-hidden sticky top-16 -mx-4 sm:-mx-6 px-4 sm:px-6 lg:mx-0 lg:px-0 lg:pt-8 lg:-mt-8 bg-white/75 dark:bg-black/75 backdrop-blur-md lg:max-h-[calc(100vh-64px)]"
    >
      <div class="py-3 border-b border-dashed u-border-gray-200 lg:border-none lg:py-0">
        <button class="flex items-center gap-3 lg:hidden" tabindex="-1" @click="isOpen = !isOpen">
          <span class="text-sm font-semibold leading-6 u-text-gray-900">Table of Contents</span>

          <UIcon name="uil:angle-right-b" class="w-5 h-5 transition-transform duration-100 transform u-text-gray-400" :class="[isOpen ? 'rotate-90' : 'rotate-0']" />
        </button>

        <DocsPageToc class="mt-4 lg:mt-0" :class="[isOpen ? 'lg:block' : 'hidden lg:block']" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = usePage()

const isOpen = ref(false)

defineProps({
  header: {
    type: Boolean,
    default: true
  },
  toc: {
    type: Boolean,
    default: true
  }
})
</script>
