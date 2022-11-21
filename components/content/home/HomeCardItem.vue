<template>
  <li ref="root" class="rounded-md relative group">
    <UIcon name="uil:external-link-alt" class="absolute right-4 top-4 text-gray-500 transition-opacity duration-200 opacity-0" :class="{ 'group-hover:opacity-100': to && target === '_blank' }" />
    <component :is="component" :href="to" :target="target">
      <div class="hidden gradient-border gradient-border-dark dark:block" />
      <div class="dark:hidden gradient-border gradient-border-light" />
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
            <ContentSlot :use="$slots.title" unwrap="p" />
          </header>
          <p class="u-text-gray-500" :class="{ 'text-lg font-medium': icon }">
            <ContentSlot :use="$slots.description" unwrap="p" />
          </p>
        </div>
      </UCard>
    </component>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

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
  to: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: '_blank'
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

const headerClass = computed(() => {
  return [
    'flex items-center border-none',
    props.headerClass
  ].join(' ')
})

const component = computed(() => {
  if (props.to) { return resolveComponent('NuxtLink') }
  return 'div'
})
</script>

<style scoped lang="postcss">
.gradient-border {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 14px;
  z-index: -1;
  transform: translate(-1px, -1px);
}

.gradient-border-light {
  background: linear-gradient(var(--gradient-angle), rgba(0, 220, 130, 1), white, rgba(54, 228, 218, 0.7), rgba(29, 224, 177, 0.3));
}

.gradient-border-dark {
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

li:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 5s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
}

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
