<template>
  <li>
    <a :href="authorUrl" rel="author">
      <div class="relative">
        <QuoteTestimonials class="absolute top-0 w-8 h-8 left-[9px] opacity-70 u-text-gray-200" />
        <div class="relative pt-4 pl-8">
          <p class="pb-6 text-sm u-text-gray-600">
            <Markdown :use="$slots.quote" unwrap="p" />
          </p>
          <div class="flex flex-row items-center">
            <img :src="`/assets/community/about/${authorImg}.png`" class="h-12" :alt="`${authorImg} picture`">
            <div class="flex flex-col pl-8">
              <span class="font-semibold u-text-gray-900">
                <Markdown :use="$slots.author" unwrap="p" />
              </span>
              <span class="text-sm u-text-gray-400">
                <Markdown :use="$slots.job" unwrap="p" />
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
