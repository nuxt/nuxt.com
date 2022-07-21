<template>
  <div class="flex items-center justify-center gap-x-12 relative">
    <img class="absolute w-full h-full -right-60 opacity-40" src="/assets/docs/v3/deploy/gradient.svg" alt="gem illustration">
    <div class="flex flex-col xl:absolute w-[600px] h-[350px] justify-center items-center right-0 top-1/2">
      <div class="absolute flex flex-col md:flex-row items-center">
        <div :class="[{ 'p-4 border-[6px] border-green-400 rounded-xl': currentSection === 0 }, [0, null].includes(currentSection) ? 'opacity-100' : 'opacity-0']">
          <img src="/assets/docs/v3/deploy/server.svg" alt="server image" class="h-[150px] w-[280px] md:w-[380px] md:h-[250px]">
        </div>

        <div
          class="h-[40px] md:h-[6px] w-[6px]  bg-green-400 md:w-[40px] transition-opacity duration-300"
          :class="currentSection === 0 ? 'block' : 'hidden'"
        />
        <img
          src="/assets/docs/v3/deploy/database.svg"
          alt="database image"
          class="h-[80px] md:h-[110px] -translate-y-1 ml-0.5 md:-translate-y-0 md:ml-0"
          :class="currentSection === 0 ? 'block' : 'hidden'"
        >
      </div>

      <div class="absolute transition-opacity duration-300" :class="[{ 'p-4 border-[6px] border-green-400 rounded-xl': currentSection === 0 }, currentSection === 1 ? 'opacity-100' : 'opacity-0']">
        <img src="/assets/docs/v3/deploy/folders.svg" alt="folders images" class="md:w-[380px] md:h-[250px] w-[380px] h-[250px]">
      </div>

      <div class="absolute flex transition-opacity duration-300 items-start md:items-center" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
        <img src="/assets/docs/v3/deploy/folders-small.svg" alt="folders images" class="h-[150px] md:h-[250px] mr-4 mt-[25px] md:mt-0">
        <div class="flex flex-col md:flex-row items-center justify-end">
          <div class="p-4 border-[6px] border-green-400 rounded-xl p-4">
            <img src="/assets/docs/v3/deploy/server-small.svg" alt="server image" class="h-[150px] md:h-[250px]">
          </div>
          <div
            class="h-[40px] md:h-[6px] w-[6px] md:top-0 md:top-1/2 md:right-[255px] xl:right-12 bg-green-400 md:w-[40px] transition-opacity duration-300"
          />
          <img
            src="/assets/docs/v3/deploy/database.svg"
            alt="database image"
            class="h-[80px] md:h-[110px] -translate-y-1 md:-translate-y-0 "
          >
        </div>
      </div>
    </div>
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
