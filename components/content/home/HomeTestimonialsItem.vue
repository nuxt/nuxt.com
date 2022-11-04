<template>
  <li>
    <a :href="authorUrl" rel="author" target="_blank">
      <div class="relative">
        <div class="relative pt-4 flex flex-col md:justify-between xl:h-[220px]">
          <q class="pb-6 u-text-gray-600">
            <ContentSlot :use="$slots.quote" unwrap="p" />
          </q>
          <div class="flex flex-row items-center">
            <img :src="`/assets/home/${authorImg}.png`" class="h-12" :alt="`${authorImg} picture`">
            <div class="flex flex-col pl-8">
              <span class="font-semibold u-text-gray-900">
                <ContentSlot :use="$slots.author" unwrap="p" />
              </span>
              <span class="text-sm u-text-gray-400">
                <ContentSlot :use="$slots.job" unwrap="p" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </li>
</template>

<script setup lang="ts">
defineProps({
  authorImg: {
    type: String,
    default: ''
  },
  authorUrl: {
    type: String,
    default: ''
  }
})
</script>
