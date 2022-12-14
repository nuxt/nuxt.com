<template>
  <li ref="root" class="rounded-md pt-3 relative group" :class="{ 'cursor-pointer': to }" @click="onClick">
    <Icon v-if="hasExternalLink" name="uil:external-link-alt" class="absolute right-4 top-4 text-gray-500 transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
    <UCard
      class="h-full w-full flex justify-between rounded-xl"
      :class="imagePosition === 'left' ? 'sm:flex-row py-4 pr-2' : 'flex-col'"
      :body-class="bodyClass"
      shadow-class="shadow-none"
      background-class="dark:bg-gray-900/50 bg-white hover:dark:bg-gray-900"
      :header-class="headerClass"
      ring-class="ring-1 ring-gray-200 dark:ring-0 hover:ring-0"
    >
      <template v-if="image" #header>
        <img
          :src="`/assets/docs/getting-started/views/docs-landing/${image.dark}`"
          :alt="`${image} image`"
          class="rounded-md hidden dark:block"
          :width="imageWidth"
          :height="imageHeight"
          loading="lazy"
        >
        <img
          :src="`/assets/docs/getting-started/views/docs-landing/${image.light}`"
          :alt="`${image} image`"
          class="rounded-md dark:hidden"
          :width="imageWidth"
          :height="imageHeight"
          loading="lazy"
        >
      </template>
      <div class="flex flex-col" :class="contentClass">
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
    default: '112'
  },
  imageHeight: {
    type: String || Number,
    default: '118'
  },
  imagePosition: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
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
