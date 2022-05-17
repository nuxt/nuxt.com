<template>
  <div class="absolute w-full" :class="currentSection > 0 && currentSection < 10 ? 'top-8 -left-32' : 'bottom-8 -left-32'">
    <ul class="flex gap-x-4">
      <li
        v-for="(dot, index) in 4"
        :key="index"
        class="w-4 h-4 transition-opacity duration-200 rounded-full opacity-0"
        :class="[
          currentSection < 9 ? 'bg-gray-500' : 'bg-green-400',
          { 'opacity-100': ((currentSection > 0 && currentSection < 5 && index === 0) || (currentSection > 9 && currentSection < 14 && index === 3)) },
          { 'opacity-100': ((currentSection > 1 && currentSection < 6 && index === 1) || (currentSection > 10 && currentSection < 15 && index === 2)) },
          { 'opacity-100': ((currentSection > 2 && currentSection < 7 && index === 2) || (currentSection > 11 && currentSection < 16 && index === 1)) },
          { 'opacity-100': ((currentSection > 3 && currentSection < 8 && index === 3) || (currentSection > 12 && currentSection < 17 && index === 0)) },
        ]"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">

const { startCounter, currentSection } = useCounterAnimations()

onMounted(() => startCounter([100, 100, 100, 100, 100, 100, 100, 100, 100, 5000, 100, 100, 100, 100, 100, 100, 100, 100]))

</script>
