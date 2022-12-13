<template>
  <li ref="root" class="rounded-md pt-3 relative group" :class="{ 'cursor-pointer': to }" @click="onClick">
    <Icon v-if="hasExternalLink" name="uil:external-link-alt" :class="iconClass" class="absolute" />
    <div class="hidden dark:block" />
    <div class="dark:hidden" />
    <UCard
      class="h-full w-ful flex flex-col justify-between rounded-xl"
      :body-class="bodyClass"
      shadow-class="shadow-none"
      background-class="dark:bg-gray-900/50 bg-white hover:dark:bg-gray-900"
      :header-class="headerClass"
      ring-class="ring-1 ring-gray-200 dark:ring-0 hover:ring-0"
    >
      <template v-if="image" #header>
        <img
          :src="`/assets/home/${image.dark}`"
          :alt="`${image} image`"
          class="h-full rounded-md hidden dark:block"
          :width="imageWidth"
          :height="imageHeight"
          loading="lazy"
        >
        <img
          :src="`/assets/home/${image.light}`"
          :alt="`${image} image`"
          class="h-full rounded-md dark:hidden"
          :width="imageWidth"
          :height="imageHeight"
          loading="lazy"
        >
      </template>
      <div class="flex flex-col" :class="contentClass">
        <Icon v-if="icon" :name="icon" class="w-6 h-6" />
        <header class="font-semibold u-text-gray-900" :class="!icon ? 'text-xl' : 'text-5xl'">
          <NuxtLink v-if="to" :to="to">
            <ContentSlot :use="$slots.title" unwrap="p" />
          </NuxtLink>
          <ContentSlot v-else :use="$slots.title" unwrap="p" />
        </header>
        <p class="u-text-gray-500" :class="{ 'text-lg font-medium': icon }">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
      </div>
    </UCard>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { hasProtocol } from 'ufo'

const props = defineProps({
  image: {
    type: Object as PropType<
      {
        light: String,
        dark: String
      }
    >,
    default: () => {}
  },
  imageWidth: {
    type: String || Number,

    default: '350'
  },
  imageHeight: {
    type: String || Number,
    default: '168'
  },
  icon: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: 'right-4 top-4 text-gray-500 transition-opacity duration-200 opacity-0 group-hover:opacity-100'
  },
  to: {
    type: String,
    default: ''
  },
  headerClass: {
    type: String,
    default: 'px-4 pt-5 sm:px-6 justify-center'
  },
  bodyClass: {
    type: String,
    default: 'px-4 pb-5 pt-4 sm:p-6'
  },
  contentClass: {
    type: String,
    default: 'gap-y-4'
  }
})

const hasExternalLink = computed(() => props.to && hasProtocol(props.to))

const onClick = () => {
  if (props.to && !window.getSelection().toString()) {
    if (hasExternalLink.value) {
      window.open(props.to, '_blank').focus()
    } else {
      navigateTo(props.to)
    }
  }
}
const headerClass = computed(() => {
  return [
    'flex items-center border-none',
    props.headerClass
  ].join(' ')
})

// Solution to get great block links
// From https://css-tricks.com/block-links-the-search-for-a-perfect-solution/#aa-method-4-sprinkle-javascript-on-the-second-method
const root = ref(null)
const stopPropagation = (e: Event) => e.stopPropagation()
onMounted(() => {
  Array.from(root.value.querySelectorAll('a')).forEach((el: Element) => {
    el.addEventListener('click', stopPropagation)
  })
})
onBeforeUnmount(() => {
  Array.from(root.value.querySelectorAll('a')).forEach((el: Element) => {
    el.removeEventListener('click', stopPropagation)
  })
})
</script>

<style scoped lang="postcss">

@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 360deg;
}

@keyframes gradient-rotate {
    0% {
      --gradient-angle: 360deg;
    }

    100% {
      --gradient-angle: 0deg;
    }
}
</style>
