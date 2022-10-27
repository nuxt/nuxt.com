<template>
  <li class="rounded-md h-full relative">
    <div class="gradient-border" />
    <NuxtLink :to="to">
      <UCard class="h-full w-full" header-class="flex items-center justify-center" ring-class="ring-0">
        <template v-if="image" #header>
          <img :src="`/assets/home/${image}`" :alt="`${image} image`" class="h-full h-full rounded-md">
        </template>
        <div class="flex flex-col gap-y-4">
          <Icon v-if="icon" :name="icon" class="w-6 h-6" />
          <h6 class="font-semibold u-text-gray-900" :class="!icon ? 'text-xl' : 'text-5xl'">
            <ContentSlot :use="$slots.title" unwrap="p" />
          </h6>
          <p class="u-text-gray-800" :class="{ 'text-lg font-medium': icon }">
            <ContentSlot :use="$slots.description" unwrap="p" />
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

.gradient-border {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 14px;
  z-index: -1;
  transform: translate(-1px, -1px);
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

li:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 6s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
}

@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 360deg;
}

@keyframes gradient-rotate {
    0% {
      --gradient-angle: 360deg;
    }

    100% {
      --gradient-angle: 0deg;
    }
}
</style>
