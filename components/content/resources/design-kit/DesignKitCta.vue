
<template>
  <div :class="{ 'dark': dark }">
    <UCard base-class="relative overflow-hidden">
      <img v-if="imagePath" :src="imagePath" class="absolute w-2/5 right-0 bottom-0">

      <span v-if="dark" class="_ellipse" />
      <div class="relative">
        <h5 class="text-2xl font-bold u-text-black">
          <Markdown use="title" unwrap="p" />
        </h5>
        <p class="w-3/4 pt-3 u-text-gray-700">
          <Markdown use="description" unwrap="p" />
        </p>

        <UButton :label="buttonText" variant="primary" class="px-8 mt-6" :to="to" />
      </div>
    </UCard>
  </div>
</template>

<script setup>
defineProps({
  buttonText: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  },
  imagePath: {
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
