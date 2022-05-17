<template>
  <UContainer padded class="relative flex flex-wrap gap-24 py-24">
    <div class="self-start flex-1 lg:sticky lg:top-0 lg:pt-32 lg:-mt-32">
      <h2 class="max-w-sm text-4xl font-semibold u-text-gray-900">
        <Markdown use="title" unwrap="p" />
      </h2>
    </div>

    <div class="grid w-full grid-cols-2 gap-12 lg:w-auto lg:gap-24">
      <div v-for="(item, index) in data?.items" :key="index" class="flex flex-col items-center justify-center w-full lg:w-[160px]">
        <img :src="item.image" :alt="item.name">
        <span v-if="item.name" class="mt-4 text-xl font-semibold u-text-gray-700">{{ item.name }}</span>
        <span v-if="item.job" class="text-lg u-text-gray-700">{{ item.job }}</span>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

const { data } = await useAsyncData(`company-about-${props.type}`, () => queryContent(`/company/about/_collections/${props.type}`).findOne())
</script>
