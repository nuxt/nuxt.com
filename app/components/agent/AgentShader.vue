<script setup lang="ts">
import { Shader, DotGrid, ImageTexture, FilmGrain } from 'shaders/vue'
</script>

<template>
  <ClientOnly>
    <Shader class="absolute inset-0 -z-1 mask-b-from-50% mask-b-to-100%">
      <ImageTexture
        id="logoMask"
        :visible="false"
        url="/icon.png"
        object-fit="contain"
        :transform="{ offsetY: 0.05, scale: 1.4 }"
      />
      <DotGrid
        color="#4cffa8"
        :density="30"
        :dot-size="0.20"
        :twinkle="1"
        mask-source="logoMask"
        mask-type="alphaInverted"
      />
      <FilmGrain :strength="0.03" />
    </Shader>
  </ClientOnly>
</template>
