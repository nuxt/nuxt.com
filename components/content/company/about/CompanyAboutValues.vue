<template>
  <UContainer padded class="py-24">
    <h2 class="text-4xl font-semibold text-center u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>
    <div class="grid grid-cols-3 mt-10 md:px-16 lg:px-32">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex flex-col items-center"
      >
        <div class="flex items-center w-full">
          <div class="flex-1" :class="{ 'h-[1px] u-bg-gray-200': index !== 0 }" />
          <div class="relative flex items-center justify-center w-20 h-20">
            <img src="/company/about/hexagone-light.svg" class="absolute dark:invisible">
            <img src="/company/about/hexagone-dark.svg" class="absolute invisible dark:visible">
            <img :src="item.icon" class="relative w-10 h-10 u-text-gray-900">
          </div>
          <div class="flex-1" :class="{ 'h-[1px] u-bg-gray-200': index !== (items.length - 1) }" />
        </div>

        <h3 class="px-2 mt-5 text-2xl font-semibold text-center u-text-gray-900">
          {{ item.title }}
        </h3>

        <p class="px-2 mt-2 text-lg text-center u-text-gray-700">
          {{ item.description }}
        </p>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  items: {
    type: Array as PropType<Object>,
    default: () => []
  }
})
</script>

<style scoped>
.hexagone {
  position: relative;
  /* Pour rendre responsive mettre width à 100% */
  width: 70px;
  visibility: hidden;
  overflow: hidden;
}
.hexagone:after {
  -moz-box-sizing: content-box;
  -webkit-box-sizing: content-box;
  box-sizing: content-box;
  content: "";
  display: block;
  margin-top: 28.86751%;
  padding-bottom: 86.602%;
}
.hexagone .hexagonemain{
  display: block;
  position: absolute;
  width: 100%;
  padding-bottom: 115.47005%;
  overflow: hidden;
  visibility: hidden;
  -webkit-transform: rotate3d(0, 0, 1, -60deg) skewY(30deg);
  -ms-transform: rotate3d(0, 0, 1, -60deg) skewY(30deg);
  transform: rotate3d(0, 0, 1, -60deg) skewY(30deg);
  z-index: 1;
}
.hexagone .hexagonemainbefore{
  @apply bg-gray-50 border-gray-200;
  content: "";
  display: block;
  position: absolute;
  visibility: visible;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* background-color: var(--colors-u-bg-gray-50); */
  -webkit-transform: skewY(-30deg) rotate3d(0, 0, 1, 60deg);
  -ms-transform: skewY(-30deg) rotate3d(0, 0, 1, 60deg);
  transform: skewY(-30deg) rotate3d(0, 0, 1, 60deg);
}
</style>
