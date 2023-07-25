<template>
  <Component :is="is" ref="root" class="rounded-md relative group" :class="{ 'cursor-pointer': to }" @click="onClick">
    <Icon
      v-if="hasExternalLink"
      name="uil:external-link-alt"
      class="absolute right-4 top-4 text-gray-500 transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-50"
    />
    <div v-if="gradientBorder" class="hidden gradient-border gradient-border-dark dark:block" />
    <div v-if="gradientBorder" class="dark:hidden gradient-border gradient-border-light" />

    <AppCard
      :shadow="false"
      :border="border"
      :rounded="rounded"
      :background-color="backgroundColor"
      :body-padding="bodyPadding"
      :header-content-position="headerContentPosition"
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
import type { Image, Card, Button } from 'types'

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
  appCardClass: {
    type: String,
    default: ''
  },
  rounded: {
    type: String as PropType<Card['rounded']>,
    default: 'xl'
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
    type: Array as PropType<Button[]>,
    default: () => []
  },
  backgroundImageClass: {
    type: String,
    default: 'absolute right-0 bottom-0'
  },
  headerContentPosition: {
    type: String as PropType<Card['headerContentPosition']>,
    default: 'left'
  },
  backgroundColor: {
    type: String as PropType<Card['backgroundColor']>,
    default: 'white'
  },
  border: {
    type: Boolean as PropType<Card['border']>,
    default: true
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
  buttonsWrapperClass: {
    type: String,
    default: ''
  },
  bodyPadding: {
    type: Boolean as PropType<Card['bodyPadding']>,
    default: true
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

const root = ref<HTMLElement | null>(null)

useBlockLinks(root)
</script>

<style lang="ts" scoped>
css({
  '.app-card': {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    transition: 'all 0.2s',

    '&:hover': {
      backgroundColor: (props) => props.gradientBorder ? 'white' : props.to ? '{color.gray.50}' : 'white',
      borderColor: (props) => props.gradientBorder ? 'transparent !important' : '{color.gray.200} !important',

      '@dark': {
          backgroundColor: (props) => props.gradientBorder ? '{color.gray.800}' : props.to ? '{color.gray.800}' : '{color.gray.900}',
          borderColor: (props) => props.gradientBorder ? 'transparent !important' : '{color.gray.800} !important'
        }
      }
  }
})
</style>

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
