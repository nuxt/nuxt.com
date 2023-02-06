
<template>
  <div :class="{ 'dark': dark }">
    <AppCard padded base-class="relative h-full overflow-hidden">
      <Icon v-if="icon" :name="icon" class="absolute w-56 h-56 text-gray-100 -right-10 -bottom-16 dark:text-black" />

      <span v-if="dark" class="_ellipse" />

      <div class="relative flex flex-col h-full gap-y-4">
        <h5 class="text-2xl font-semibold u-text-black">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h5>
        <p class="w-3/4 u-text-gray-700">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
        <!-- TODO: update to -->
        <div class="flex items-end h-full">
          <AppButton :label="buttonText" variant="primary" class="px-8" :to="to" size="lg" />
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  dark: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 336.49px;
  height: 95.58px;
  left: 0;
  top: 90.88px;
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 0.65) 2.27%, rgba(26, 214, 255, 0.65) 50.88%, rgba(0, 220, 130, 0.65) 98.48%);
  filter: blur(50px);
  transform: matrix(-0.97, 0.24, 0.24, 0.97, 0, 0);
}
</style>
