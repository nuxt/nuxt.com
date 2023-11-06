<script setup lang="ts">
defineProps<{
  testimonials: {
    quote: string
    author: {
      name: string
      job: string
      imgSrc: string
      imgSrcSet: string
      url: string
    }
  }[]
}>()
</script>

<template>
  <UPageColumns>
    <div
      v-for="(testimonial, index) in testimonials"
      :key="index"
      class="break-inside-avoid py-0.5"
    >
      <UPageCard
        :ui="{
          background: 'dark:bg-gradient-to-b from-gray-700/50 to-gray-900/50',
          body: {
            base: 'flex-1',
            background: 'dark:bg-gray-900/50',
          }
        }"
        :to="testimonial.author.url"
        target="_blank"
      >
        <q class="italic text-lg text-gray-500 dark:text-gray-400">
          {{ testimonial.quote }}
        </q>

        <div class="flex gap-x-4 items-center mt-6">
          <UAvatar
            :src="testimonial.author.imgSrc"
            :srcset="testimonial.author.imgSrcSet"
            loading="lazy"
            :alt="testimonial.author.name"
            size="md"
            :ui="{ rounded: 'rounded-lg' }"
          />
          <div class="min-w-0">
            <p class="font-semibold text-primary">
              {{ testimonial.author.name }}
            </p>
            <p class="text-sm truncate">
              {{ testimonial.author.job }}
            </p>
          </div>
        </div>
      </UPageCard>
    </div>
  </UPageColumns>
</template>
