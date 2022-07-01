<template>
  <div
    class="flex flex-col px-4 pt-24 transition duration-700"
    :class="[containerClass, !slideIn ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0']"
  >
    <!-- Main title -->
    <div class="flex flex-col items-center justify-center" :class="mainTitleContainerClass">
      <div :class="sectionTitleColorClass" class="pb-2 font-semibold">
        <Markdown :use="$slots.sectionTitle" unwrap="p" />
      </div>
      <h2 class="max-w-lg pb-4 text-4xl font-semibold text-center md:text-5xl lg:text-6xl sm:max-w-xl md:max-w-3xl lg:max-w-4xl u-text-gray-900">
        <Markdown :use="$slots.title" unwrap="p" />
      </h2>
      <p v-if="$slots.description" class="text-lg text-center xl:text-xl 2xl:text-2xl u-text-gray-500 sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
        <Markdown :use="$slots.description" unwrap="p" />
      </p>
      <div v-if="buttons.length" class="flex justify-center gap-6 mt-8">
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
    <!-- body section -->
    <div ref="root" class="relative">
      <UContainer
        class="flex flex-col items-center justify-between w-full lg:flex-row gap-y-10"
        :class="[
          bodyContainerClass,
          { 'gap-y-8': ['left', 'right'].includes(bodyPlacement) },
          { 'order-last': bodyPlacement === 'left' },
          { 'lg:justify-end': bodyPlacement === 'right' }
        ]"
      >
        <!-- body text -->
        <div
          v-if="withBodyText"
          padded
          class="flex flex-col items-center max-w-lg px-4 text-center lg:items-start lg:max-w-md gap-y-6 sm:px-0 xl:max-w-lg 2xl:max-w-xl"
          :class="[bodyClass, { 'lg:text-left': ['left', 'right'].includes(bodyPlacement) }]"
        >
          <div v-if="$slots.bodyTitle" class="text-2xl font-semibold xl:text-3xl 2xl:text-4xl u-text-gray-900">
            <Markdown :use="$slots.bodyTitle" unwrap="p" />
          </div>
          <div v-if="$slots.bodyDescription" class="items-center text-lg text-gray-500 xl:text-xl 2xl:text-2xl dark:text-gray-400">
            <Markdown :use="$slots.bodyDescription" unwrap="p" />
          </div>
          <NuxtLink v-if="$slots.bodyLink" :to="to" class="relative flex-nowrap max-w-max group">
            <div class="flex items-center justify-center font-semibold lg:justify-start gap-x-4 ">
              <span class="lg:text-lg xl:text-xl 2xl:text-2xl u-text-gray-900">
                <Markdown :use="$slots.bodyLink" unwrap="p" />
              </span>

              <UIcon name="heroicons-solid:arrow-right" class="w-5 h-5 u-text-gray-900" />
            </div>
            <div class="absolute -bottom-2 w-0 h-0.5 u-bg-black group-hover:w-full transition-all duration-300 ease-in-out" />
          </NuxtLink>
          <UButton v-if="$slots.bodyButton" :to="to" variant="secondary" size="lg" class="flex justify-center w-[224px]">
            <Markdown :use="$slots.bodyButton" unwrap="p" />
          </UButton>
        </div>
        <!-- body image -->
        <img v-if="image" :src="`/assets/home/${image}`" :alt="`${image} illustration`" :class="imageClass" class="px-4 sm:px-0">

        <div v-if="$slots.bodyExtra" class="px-4 sm:px-0" :class="bodyExtraClass">
          <Markdown :use="$slots.bodyExtra" unwrap="p" />
        </div>
      </UContainer>
      <Markdown :use="$slots.extra" unwrap="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'

defineProps({
  containerClass: {
    type: String,
    default: 'gap-y-10 pb-10 sm:px-0 sm:pb-20 md:pb-28 lg:pb-40'
  },
  sectionTitleColorClass: {
    type: String,
    default: 'text-green-400'
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
    default: 'center',
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
