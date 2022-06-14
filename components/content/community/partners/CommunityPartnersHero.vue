<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="flex gap-6">
        <UButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button"
          size="lg"
        />
      </div>
    </template>

    <template #image>
      <img src="/assets/community/partners/gems.svg" class="object-contain h-full mx-10 opacity-30 md:opacity-100">
    </template>
  </PageHero>
</template>

<script setup lang="ts">
defineProps({
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
