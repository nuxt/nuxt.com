<template>
  <UContainer
    class="flex px-4 pt-24 transition duration-700 relative"
    :class="[containerClass, !slideIn ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0', buttons.length ? 'flex-col lg:flex-row lg:items-center lg:justify-between' : 'flex-col']"
    padded
  >
    <div ref="root" class="flex flex-col justify-center">
      <div v-if="$slots.sectionTitle" class="pb-2 font-semibold">
        <ContentSlot :use="$slots.sectionTitle" unwrap="p" />
      </div>
      <h2 class="max-w-lg pb-6 sm:max-w-xl md:max-w-3xl lg:max-w-4xl u-text-gray-900" :class="titleSizeClass">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <p v-if="$slots.description" class="text-lg xl:text-xl 2xl:text-2xl u-text-gray-500 sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <NuxtLink v-if="to" :to="to" class="pt-8 text-md xl:text-lg 2xl:text-xl u-text-gray-900 font-medium flex gap-x-4 items-center relative group w-fit focus-visible:ring-2">
        <ContentSlot :use="$slots.link" unwrap="p" />
        <Icon name="heroicons-solid:chevron-right" class="w-5 h-5 mt-1" />
        <span class="absolute w-0 -bottom-1 h-0.5 u-bg-gray-900 group-hover:w-full transition-all duration-200" />
      </NuxtLink>
    </div>
    <div v-if="$slots.extra">
      <ContentSlot :use="$slots.extra" unwrap="p" />
    </div>
    <div v-if="buttons.length" class="flex lg:flex-row lg:justify-end gap-2 lg:gap-6 pt-8 lg:pt-0 lg:w-1/3">
      <UButton
        v-for="button of buttons"
        :key="button.label"
        :variant="button.variant || 'transparent'"
        :icon="button.icon || undefined"
        :label="button.label || ''"
        :to="button.to || null"
        :trailing="button.trailing"
        :size="'lg' || button.size"
        truncate
        class="focus-visible:ring-2"
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  containerClass: {
    type: String,
    default: 'pb-4 sm:pb-8 md:pb-12 lg:pb-20'
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, icon?: string, trailing?: boolean, size?: string }[]>,
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
  titleSizeClass: {
    type: String,
    default: 'text-3xl font-semibold md:text-4xl lg:text-5xl'
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
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const observer = ref<IntersectionObserver>()
const root = ref<Element | null>(null)
const slideIn = ref(props.visible)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      slideIn.value = true
    }
  })

onBeforeMount(() => {
  if (props.visible) { return }
  observer.value = new IntersectionObserver(observerCallback)
})

onMounted(() => root.value && observer.value?.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>
