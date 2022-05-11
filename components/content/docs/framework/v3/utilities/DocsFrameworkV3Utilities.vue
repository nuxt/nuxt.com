<template>
  <ul class="grid grid-cols-2 gap-12">
    <li
      v-for="data in utilitiesData.utilities"
      :key="data.title"
      class="group"
    >
      <UCard class="flex flex-col items-start justify-between ">
        <component :is="data.componentAnimation" class="w-12 h-10 mb-12" />
        <div class="flex flex-col gap-y-2">
          <h6 class="u-tewt-gray-900 font-semibold text-2xl">
            {{ data.title }}
          </h6>
          <p class="u-text-gray-500">
            {{ data.description }}
          </p>
        </div>
      </UCard>
    </li>
  </ul>
</template>
<script setup lang="ts">
const { data: utilitiesData } = await useAsyncData('utilities', () => queryContent('/docs/framework/v3/collections/utilities').findOne())
</script>
