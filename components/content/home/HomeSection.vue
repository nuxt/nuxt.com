<template>
  <div
    ref="root"
    class="flex px-4 pt-24 transition duration-700"
    :class="[containerClass, !slideIn ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0', buttons.length ? 'items-center justify-between' : 'flex-col']"
  >
    <!-- Main title -->
    <div class="flex flex-col justify-center" :class="mainTitleContainerClass">
      <div v-if="$slots.sectionTitle" class="pb-2 font-semibold">
        <ContentSlot :use="$slots.sectionTitle" unwrap="p" />
      </div>
      <h2 class="max-w-lg pb-4 text-4xl font-semibold md:text-5xl lg:text-6xl sm:max-w-xl md:max-w-3xl lg:max-w-4xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <p v-if="$slots.description" class="text-lg xl:text-xl 2xl:text-2xl u-text-gray-500 sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div v-if="$slots.contentExtra">
        <ContentSlot :use="$slots.contentExtra" unwrap="p" />
      </div>
      <NuxtLink v-if="to" :to="to" class="pt-8 text-md xl:text-lg 2xl:text-xl u-text-gray-500 font-medium flex gap-x-4 items-center relative group w-fit">
        <ContentSlot :use="$slots.link" unwrap="p" />
        <UIcon name="heroicons-solid:chevron-right" class="w-5 h-5 mt-1" />
        <span class="absolute w-0 -bottom-1 h-0.5 u-bg-gray-500 group-hover:w-full transition-all duration-200" />
      </NuxtLink>
    </div>
    <ContentSlot :use="$slots.extra" unwrap="p" />
    <div v-if="buttons.length" class="flex justify-start items-start h-full gap-6 -mt-12 w-1/3 ">
      <UButton
        v-for="button of buttons"
        :key="button.label"
        :variant="button.variant || 'transparent'"
        :icon="button.icon || undefined"
        :label="button.label || ''"
        :to="button.to || null"
        :trailing="button.trailing"
        truncate
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'

defineProps({
  containerClass: {
    type: String,
    default: 'gap-y-10 pb-10 sm:px-0 sm:pb-20 md:pb-28 lg:pb-40 mx-auto sm:px-6 lg:px-8 px-4'
  },
  mainTitleContainerClass: {
    type: String,
    default: 'lg:pb-16 xl:pb-20 2xl:pb-24'
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, icon?: string, trailing?: boolean }[]>,
    default: () => []
  },
  bodyPlacement: {
    type: String,
    default: 'left',
    validator: (value: string) => {
      return ['left', 'center', 'right'].includes(value)
    }
  },
  bodyContainerClass: {
    type: String,
    default: ''
  },
  bodyClass: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  },
  withBodyText: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: ''
  },
  bodyExtraClass: {
    type: String,
    default: ''
  }
})

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>
const slideIn = ref(false)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      slideIn.value = true
    }
  })

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>
