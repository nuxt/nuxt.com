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

    <template #background>
      <img src="/assets/company/contact/gems.svg" class="object-cover h-full opacity-30 lg:opacity-100">
      <div class="h-[170px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div class="w-[170px] absolute right-0 inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent" />
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
