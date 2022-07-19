<template>
  <div class="w-[600px] h-[350px] flex items-center justify-center gap-x-12 relative">
    <img class="absolute w-full h-full -right-60 opacity-40" src="/assets/docs/v3/deploy/gradient.svg" alt="gem illustration">
    <div class="absolute" :class="[{ 'p-4 border-[6px] border-green-400 rounded-xl': currentSection === 0 }, [0, null].includes(currentSection) ? 'opacity-100' : 'opacity-0']">
      <img src="/assets/docs/v3/deploy/server.svg" alt="server image" class="w-[380px] h-[250px]">
    </div>

    <div class="absolute transition-opacity duration-300" :class="[{ 'p-4 border-[6px] border-green-400 rounded-xl': currentSection === 0 }, currentSection === 1 ? 'opacity-100' : 'opacity-0']">
      <img src="/assets/docs/v3/deploy/folders.svg" alt="folders images" class="w-[380px] h-[250px]">
    </div>

    <div class="absolute flex transition-opacity duration-300 gap-x-12" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
      <img src="/assets/docs/v3/deploy/folders-small.svg" alt="folders images" class="h-[250px] mt-[24px]">
      <div class="p-4 border-[6px] border-green-400 rounded-xl p-4">
        <img src="/assets/docs/v3/deploy/server-small.svg" alt="server image" class="h-[250px]">
      </div>
    </div>

    <div class="h-[6px] absolute top-1/2 right-12 bg-green-400 w-[40px] transition-opacity duration-300" :class="[0, 2].includes(currentSection) ? 'opacity-100' : 'opacity-0'" />

    <img src="/assets/docs/v3/deploy/database.svg" alt="database image" class="w-[100px] h-[110px] absolute -right-12" :class="[null, 0, 2].includes(currentSection) ? 'opacity-100' : 'opacity-0'">
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: null
  }
})
</script>
