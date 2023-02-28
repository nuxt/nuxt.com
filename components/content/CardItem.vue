<template>
  <Component :is="is" ref="root" class="rounded-md relative group" :class="{ 'cursor-pointer': to }" @click="onClick">
    <Icon v-if="hasExternalLink" name="uil:external-link-alt" class="absolute right-4 top-4 text-gray-500 transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-50" />
    <div v-if="gradientBorder" class="hidden gradient-border gradient-border-dark dark:block" />
    <div v-if="gradientBorder" class="dark:hidden gradient-border gradient-border-light" />

    <AppCard
      class="h-full w-full flex flex-col justify-between relative"
      :body-class="bodyClass"
      shadow-class="shadow-none"
      :background-class="backgroundClass"
      :header-class="headerClass"
      :ring-class="ringClass"
      :rounded-class="roundedClass"
    >
      <div v-if="backgroundImage" :class="backgroundImageClass">
        <img
          :src="`${backgroundImage.path}-dark.${backgroundImage.format}`"
          alt=""
          class="h-full hidden dark:block"
          :class="{'object-cover': backgroundImage.cover}"
          :width="backgroundImage.width"
          :height="backgroundImage.height"
          loading="lazy"
        >
        <img
          :src="`${backgroundImage.path}-light.${backgroundImage.format}`"
          alt=""
          :class="{'object-cover': backgroundImage.cover}"
          class="h-full dark:hidden"
          :width="backgroundImage.width"
          :height="backgroundImage.height"
          loading="lazy"
        >
      </div>
      <div v-if="image">
        <img
          :src="`${image.path}-dark.${image.format}`"
          alt=""
          class="h-full rounded-md hidden dark:block"
          :class="{'object-cover': image.cover}"
          :width="image.width"
          :height="image.height"
          loading="lazy"
        >
        <img
          :src="`${image.path}-light.${image.format}`"
          alt=""
          class="h-full rounded-md dark:hidden"
          :class="{'object-cover': image.cover}"
          :width="image.width"
          :height="image.height"
          loading="lazy"
        >
      </div>
      <div class="flex flex-col" :class="contentClass">
        <Icon v-if="icon" :name="icon" class="w-6 h-6" />
        <header :class="titleClass">
          <NuxtLink v-if="to" :to="to">
            <ContentSlot :use="$slots.title" unwrap="p" />
          </NuxtLink>
          <ContentSlot v-else :use="$slots.title" unwrap="p" />
        </header>
        <p class="u-text-gray-500" :class="[{ 'text-lg font-medium': icon }, descriptionClass]">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
        <div v-if="buttons.length" class="gap-2 flex flex-col sm:flex-row" :class="buttonsWrapperClass">
          <AppButton
            v-for="button of buttons"
            :key="button.label"
            :variant="button.variant || 'transparent'"
            :icon="button.icon || undefined"
            :label="button.label || ''"
            :to="button.to || undefined"
            :trailing="button.trailing"
            :size="'sm' || button.size"
            truncate
            class="focus-visible:ring-2"
          />
        </div>
      </div>
    </AppCard>
  </component>
</template>

<script setup lang="ts">
import type { PropType, ComputedRef } from 'vue'
import { hasProtocol } from 'ufo'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Image } from 'types'

const props = defineProps({
  is: {
    type: String,
    default: 'li'
  },
  icon: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  },
  image: {
    type: Object as PropType<Image>,
    default: () => {}
  },
  backgroundImage: {
    type: Object as PropType<Image>,
    default: () => {}
  },
  gradientBorder: {
    type: Boolean,
    default: true
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: RouteLocationNormalized | RouteLocationRaw, icon?: string, trailing?: boolean, size?: string }[]>,
    default: () => []
  },
  backgroundImageClass: {
    type: String,
    default: 'absolute right-0 bottom-0'
  },
  roundedClass: {
    type: String,
    default: 'rounded-xl'
  },
  headerClass: {
    type: String,
    default: 'px-4 pt-5 sm:px-6 justify-center'
  },
  bodyClass: {
    type: String,
    default: 'px-4 pb-5 pt-4 sm:p-6'
  },
  backgroundClass: {
    type: String,
    default: 'dark:bg-gray-900/50 bg-white'
  },
  contentClass: {
    type: String,
    default: 'gap-y-4'
  },
  titleClass: {
    type: String,
    default: 'font-semibold u-text-gray-900 text-xl'
  },
  descriptionClass: {
    type: String,
    default: ''
  },
  ringClass: {
    type: String,
    default: 'ring-1 ring-gray-200 dark:ring-gray-800'
  },
  buttonsWrapperClass: {
    type: String,
    default: ''
  }
})

const hasExternalLink: ComputedRef<boolean | string> = computed(() => props.to && hasProtocol(props.to))

const onClick = () => {
  if (props.to && !window?.getSelection()?.toString()) {
    if (hasExternalLink.value) {
      window.open(props.to, '_blank')?.focus()
    } else {
      navigateTo(props.to)
    }
  }
}
const headerClass: ComputedRef<string> = computed(() => {
  return [
    'flex items-center border-none',
    props.headerClass
  ].join(' ')
})

const ringClass: ComputedRef<string> = computed(() => {
  return [
    props.ringClass,
    props.gradientBorder ? 'hover:ring-0' : ''
  ].join(' ')
})

const backgroundClass: ComputedRef<string> = computed(() => {
  return [
    props.backgroundClass,
    props.gradientBorder ? 'hover:bg-white hover:dark:bg-gray-900' : props.to ? 'hover:bg-gray-50 hover:dark:bg-gray-900' : ''
  ].join(' ')
})

const root = ref<HTMLElement | null>(null)

useBlockLinks(root)
</script>

<style lang="postcss">

:root {
  --gradient-angle: 360deg;
}

@keyframes gradient-rotate {
  0% {
    --gradient-angle: 360deg;
  }

  100% {
    --gradient-angle: 0deg;
  }
}

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
</style>
