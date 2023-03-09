<script setup lang="ts">
import type { PropType } from 'vue'
import type { Card } from 'types'

defineProps({
  titleClass: {
    type: String,
    default: 'text-xl'
  },
  descriptionClass: {
    type: String,
    default: 'line-clamp-3 mt-2'
  },
  wrapperContentClass: {
    type: String,
    default: ''
  },
  truncate: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: '_self'
  },
  headerBlock: {
    type: Boolean as PropType<Card['headerBlock']>,
    default: false
  },
  headerContentPosition: {
    type: String as PropType<Card['headerContentPosition']>,
    default: 'left'
  },
  headerPadding: {
    type: Boolean as PropType<Card['headerPadding']>,
    default: true
  },
  bodyPadding: {
    type: Boolean as PropType<Card['bodyPadding']>,
    default: true
  },
  footerPadding: {
    type: Boolean as PropType<Card['footerPadding']>,
    default: true
  }
})

</script>

<template>
  <AppCard
    padded
    :shadow="false"
    :header-padding="headerPadding"
    :body-padding="bodyPadding"
    :footer-padding="footerPadding"
    :header-block="headerBlock"
    :header-content-position="headerContentPosition"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div :class="wrapperContentClass">
      <h4 v-if="$slots.title" class="font-semibold u-text-gray-700" :class="[titleClass, {'truncate': truncate}]">
        <slot name="title" />
      </h4>
    </div>
    <p v-if="$slots.description" class="u-text-gray-500" :class="descriptionClass">
      <slot name="description" />
    </p>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>


    <NuxtLink :to="to" :target="target">
      <span class="sr-only">Link to {{ to }}</span>
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </AppCard>
</template>

<style lang="ts" scoped>
css({
  '.app-card': {
    position: 'relative',
    transition: 'all 0.2s',

    '&:hover, &:has(a:focus-visible)': {
      borderColor: '{color.green.400}',
      ring: '0px',
      ringOffsetColor: '{color.green.400}',
      ringColor: '{color.green.400}'
    },
  }
})
</style>
