
<template>
  <div class="w-[801px] h-[415px] flex items-start relative" :class="{ 'flex flex-col items-center gap-y-4': currentSection === 12 }">
    <DocsFrameworkV3CommandsFolder :folder="true" label=".output" class="z-10 pt-2 pl-12 transition-opacity duration-300" :class="currentSection > 10 ? 'opacity-0' : 'opacity-100'" />
    <div
      class="absolute w-[130px] h-[130px] bg-gray-100 -top-4 left-4 border rounded-lg"
      :class="[{ 'w-[400px] h-[380px] translate-x-1/2 transition-all duration-500': currentSection > 10 }, { 'transition-opacity duration-500 bg-opacity-0 border-none': currentSection === 12 }]"
    >
      <div class="flex flex-col items-center w-[400px] h-[380px] gap-y-4 transition-opacity duration-500 top-0" :class="currentSection != 12 ? 'opacity-0' : 'opacity-100'">
        <div class="rounded-lg pt-9 w-[371px] h-[143px] bg-gray-400 pb-9" />
        <span class="font-semibold text-gray-700">My blog content</span>
        <span class="text-gray-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore </span>
      </div>
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
