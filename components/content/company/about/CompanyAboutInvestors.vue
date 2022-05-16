<template>
  <UContainer padded class="flex flex-col py-24">
    <h2 class="max-w-sm text-4xl font-semibold lg:sticky lg:top-24 u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>

    <div class="mt-12 lg:mt-0 lg:flex lg:justify-end lg:-translate-y-[80px] lg:-mb-[80px]">
      <div class="grid grid-cols-2 gap-24">
        <div v-for="(item, index) in data?.items" :key="index" class="flex flex-col items-center justify-center lg:w-[160px]">
          <img :src="item.image" :alt="item.name">
          <span v-if="item.name" class="mt-4 text-xl font-semibold u-text-gray-700">{{ item.name }}</span>
          <span v-if="item.job" class="text-lg u-text-gray-700">{{ item.job }}</span>
        </div>
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

const { data } = await useAsyncData(`company-about-investors-${props.type}`, () => queryContent(`/company/about/_collections/${props.type}`).findOne())
</script>
