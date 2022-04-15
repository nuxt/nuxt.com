<template>
  <div class="mt-12 sm:mt-24 relative overflow-hidden border-y mb-16">
    <UContainer class="py-12 lg:py-16 lg:flex lg:items-center lg:justify-between relative" padded>
      <span class="_ellipse z-0 " />
      <h2 class="u-text-black z-[1] tracking-tight">
        <span class="block font-semibold text-2xl">
          <Markdown use="title" unwrap="p" />
        </span>
        <span class="block mt-2">
          <Markdown use="description" unwrap="p" />
        </span>
      </h2>
      <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-y-3 gap-x-8 z-[1] relative h-10">
        <UButton :label="buttonText" variant="primary" class="w-36" size="lg" block />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Contact'
  }
})
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 480.14px;
  height: 161.22px;
  left: 0;
  top: 60px;
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 1) 2.27%, rgba(26, 214, 255, 1) 50.88%, rgba(0, 220, 130, 1) 98.48%);
  filter: blur(50px);
  opacity: 25%;
}
</style>
