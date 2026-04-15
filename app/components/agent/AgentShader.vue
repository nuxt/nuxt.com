<script setup lang="ts">
import { computed } from 'vue'
import { Shader, DotGrid, ImageTexture } from 'shaders/vue'

const props = withDefaults(
  defineProps<{
    /** Chat landing: slightly brighter dots behind the title; sidebar keeps default. */
    variant?: 'default' | 'hero'
  }>(),
  { variant: 'default' }
)

const isHero = computed(() => props.variant === 'hero')

const logoTransform = computed(() =>
  isHero.value
    ? { offsetY: 0.02, scale: 1.48 }
    : { offsetY: 0.05, scale: 1.4 }
)

const dotDensity = computed(() => (isHero.value ? 36 : 30))
const dotSize = computed(() => (isHero.value ? 0.4 : 0.2))
const twinkle = computed(() => (isHero.value ? 2 : 1))
</script>

<template>
  <div class="absolute inset-0 overflow-hidden rounded-[inherit]" :class="isHero ? 'brightness-70' : ''">
    <ClientOnly>
      <Shader
        class="absolute inset-0 -z-1 mask-b-from-50% mask-b-to-100% mask-l-from-90% mask-l-to-100% mask-r-from-90% mask-r-to-100% mask-t-from-90% mask-t-to-100%"
      >
        <ImageTexture
          id="logoMask"
          :visible="false"
          url="/icon.png"
          object-fit="contain"
          :transform="logoTransform"
        />
        <DotGrid
          color="#4cffa8"
          :density="dotDensity"
          :dot-size="dotSize"
          :twinkle="twinkle"
          mask-source="logoMask"
          mask-type="alphaInverted"
        />
      </Shader>
    </ClientOnly>
  </div>
</template>
