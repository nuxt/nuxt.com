<template>
  <div
    class="z-[5] sticky top-0 hidden lg:block border-t border-transparent"
    :class="isBlurry ? 'backdrop-blur-md bg-white/75 dark:bg-black/75 shadow shadow-gray-200 dark:shadow-gray-900' : 'u-border-gray-200'"
  >
    <UContainer padded>
      <div class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6">
        <div class="flex items-center justify-start gap-3">
          <slot name="left">
            <p v-if="title" class="font-semibold">
              {{ title }}
            </p>
          </slot>
        </div>

        <div v-if="links.length" class="flex justify-center col-span-4 gap-x-8">
          <ULink
            v-for="(link, index) in links"
            :key="index"
            :to="link.slug"
            class="text-sm"
            :class="{
              'u-text-gray-900 font-semibold': isActive(link),
              'font-medium u-text-gray-500 hover:u-text-gray-900': !isActive(link),
            }"
          >
            {{ link.title }}
          </ULink>
        </div>

        <div class="flex gap-3 justify-end">
          <slot name="right" />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

defineProps({
  title: {
    type: String,
    default: null
  },
  links: {
    type: Array,
    default: () => []
  }
})

const isBlurry = ref(false)

const route = useRoute()
const { y } = useWindowScroll()

onMounted(() => {
  watch(
    y,
    (newVal) => { isBlurry.value = newVal > 80 },
    { immediate: true }
  )
})

function isActive (link) {
  return link.exact ? route.path === link.slug : route.path.startsWith(link.slug)
}
</script>
