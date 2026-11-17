<script setup lang="ts">
import { useLocale } from '@nuxt/ui/composables/useLocale'

defineProps<{
  open: boolean
}>()

const { t } = useLocale()

// Each line turns around its own center; the overshoot approximates the spring the toggle used to have.
// `starting:` animates the toggle UHeader mounts already open in its menu overlay, from the closed lines.
const line = 'outline-none origin-center [transform-box:fill-box] transition-[translate,rotate,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none'
</script>

<template>
  <UButton
    size="sm"
    variant="ghost"
    color="neutral"
    class="relative -me-1.5"
    square
    :aria-label="open ? t('header.close') : t('header.open')"
  >
    <span class="absolute top-1/2 left-1/2 size-12 -translate-1/2 [@media(pointer:fine)]:hidden" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        :class="[line, open && 'translate-y-[6px] rotate-45 starting:translate-y-0 starting:rotate-0']"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        :class="[line, open && 'opacity-0 starting:opacity-100']"
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        :class="[line, open && '-translate-y-[6px] -rotate-45 starting:translate-y-0 starting:rotate-0']"
      />
    </svg>
  </UButton>
</template>
