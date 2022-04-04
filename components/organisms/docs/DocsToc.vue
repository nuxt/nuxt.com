<template>
  <div
    class="flex flex-col text-sm font-medium text-right gap-y-2 u-text-gray-500 bg-white/75 dark:bg-black/75 max-h-[calc(100vh-400px)] lg:max-h-screen border-b border-dashed lg:border-none"
  >
    <div class="lg:hidden absolute inset-y-0 -inset-x-8 backdrop-blur-md" />
    <div>
      <NuxtLink :to="previous?.slug || '#'" :disabled="!previous?.slug" class="hidden lg:flex justify-end lg:justify-start hover:font-semibold hover:u-text-gray-900 gap-x-3">
        <IconTocBack />
        <span>Previous page</span>
      </NuxtLink>
      <template v-if="toc.length">
        <div class="hidden lg:flex font-semibold u-text-gray-900 gap-x-3 lg:pt-2">
          <IconTocCurrent />
          <span>On this page</span>
        </div>
        <div class="w-full flex flex-col items-start py-4 lg:py-0 rounded-b overflow-y-auto">
          <UButton
            variant="transparent"
            label="Table of contents"
            base-class="z-[1] px-0"
            trailing
            class="lg:hidden font-semibold"
            :icon="show ? 'heroicons-solid:chevron-down' : 'heroicons-solid:chevron-right'"
            @click="show = !show"
          />
          <ul v-if="show || !mq.mdMinus" class="flex flex-col pl-0.5 lg:pl-2.5 items-start z-[1] lg:pt-2">
            <li v-for="link in toc" :key="link.text" class="py-1 overflow-hidden truncate border-l-2 lg:border-r-2 lg:border-r-0" :class="activeHeadings.includes(link.id) ? 'u-border-gray-900' : 'u-border-gray-300'">
              <a
                :to="{ hash: link.id }"
                class="hover:font-semibold hover:u-text-gray-900 pl-2 lg:mr-2"
                :class="{
                  'u-text-gray-900': activeHeadings.includes(link.id),
                }"
                @click.prevent="scrollToHeading(link.id, '--docs-scroll-margin-block')"
              >
                {{ link.text }}
              </a>
            </li>
          </ul>
        </div>
      </template>
      <NuxtLink :to="next?.slug || '#'" :disabled="!next?.slug" class="hidden lg:flex hover:font-semibold hover:u-text-gray-900 gap-x-3 lg:pt-2">
        <IconTocNext />
        <span>Next page</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMq } from 'vue3-mq'

defineProps({
  toc: {
    type: Array,
    default: () => []
  }
})

const mq = useMq()

const route = useRoute()

const show = ref(false)

const { activeHeadings, updateHeadings } = useScrollspy()

const { toc, previous, next } = useContentPage()

watch(route, () => {
  show.value = false

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
  show.value = false
  useScrollToHeading(id, scrollMarginCssVar)
}
</script>
