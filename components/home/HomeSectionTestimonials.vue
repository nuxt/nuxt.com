<script setup lang="ts">
defineProps<{
  testimonials: {
    quote: string
    author: {
      name: string
      job: string
      img: string
    }
  }[]
}>()
</script>

<template>
  <UPageColumns>
    <UPageCard v-for="(testimonial, index) in testimonials" :key="index" :ui="{ background: 'bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-md', body: { base: 'bg-background/60' } }">
      <q class="italic text-lg text-muted">
        {{ testimonial.quote }}
      </q>

      <div class="flex gap-x-4 items-center mt-6">
        <UAvatar :src="testimonial.author.img" :alt="testimonial.author.name" size="md" :ui="{ rounded: 'rounded-lg' }" />
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
  </UPageColumns>
</template>
