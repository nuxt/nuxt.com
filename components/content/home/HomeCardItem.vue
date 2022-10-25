<template>
  <li class="gradient-border relative h-full">
    <NuxtLink :to="to">
      <UCard class="h-full w-full" header-class="flex items-center justify-center" :ring-class="icon ? 'ring-1 u-ring-gray-200' : 'ring-0'">
        <template v-if="image" #header>
          <img :src="`/assets/home/${image}`" :alt="`${image} image`" class="h-full h-full">
        </template>
        <div class="flex flex-col gap-y-4">
          <UIcon v-if="icon" :name="icon" class="w-6 h-6" />
          <h6 class="font-semibold u-text-gray-900" :class="!icon ? 'text-xl' : 'text-5xl'">
            <ContentSlot :use="$slots.title" />
          </h6>
          <p class="u-text-gray-800" :class="{ 'text-lg font-medium': icon }">
            <ContentSlot :use="$slots.description" />
          </p>
        </div>
      </UCard>
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  to: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="postcss">
.gradient-border::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    padding: 2px;
    opacity: 0;
    transition: background-position 0.3s ease-in-out, opacity 0.2s ease-in-out;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    background: linear-gradient(90deg, #e2e2e2 0%, #e2e2e2 25%, #00DC82 50%, #36E4DA 75%, #0047E1 100%);
}

.gradient-border:hover::before {
    background-position: -50% 0;
    opacity: 1;
}
</style>
