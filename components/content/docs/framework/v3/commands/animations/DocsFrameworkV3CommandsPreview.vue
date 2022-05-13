
<template>
  <div class="w-[801px] h-[415px] flex items-start relative" :class="{ 'flex flex-col items-center gap-y-4': currentSection === 12 }">
    <DocsFrameworkV3CommandsFolder :folder="true" label=".output" class="transition-opacity duration-300 pl-12 pt-2 z-10" :class="currentSection > 10 ? 'opacity-0' : 'opacity-100'" />
    <div
      class="absolute w-[130px] h-[130px] bg-gray-100 -top-4 left-4 border rounded-lg transition duration-2000"
      :class="[{'background-scale': currentSection === 11 },[10, 11].includes(currentSection) ? 'opacity-100' : 'opacity-0']"
    />
    <div class="flex flex-col items-center gap-y-4 transition-opacity duration-1000 absolute top-0 px-[245px]" :class="currentSection !== 12 ? 'opacity-0' : 'opacity-100'">
      <div class="rounded-lg pt-9 w-[371px] h-[143px] bg-gray-400 pb-9" />
      <span class="text-gray-700 font-semibold">My blog content</span>
      <span class="text-gray-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.background-scale {
  transform: translate(190px, 12px) scale(3.0);
  transform-origin: 0 8px;
  transition: all 2s;
  transition-delay: 1s;
  opacity: 0;
}
</style>
