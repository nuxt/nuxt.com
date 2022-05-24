<template>
  <div class="flex flex-col gap-y-0.5 transition-opacity duration-300 u-text-gray-300" :class="stepsSection.includes(currentSection) ? 'opacity-100' : 'opacity-0'">
    <div>
      <span>{{ '<' }}</span><span class="u-text-gray-500">{{ 'template' }}</span><span>{{ '>' }}</span>
    </div>
    <div class="pl-4">
      <span><span>{{ '<' }}</span><span class="u-text-gray-500">{{ 'p' }}</span><span>{{ '>' }}</span></span>
      <span>
        <span>{{ ' {{' }}</span><span class="text-green-400"> $global</span><span>() </span><span>&rbrace;&rbrace;</span>
      </span>
      <span>
        <span>{{ '</' }}</span><span class="u-text-gray-500">{{ 'p' }}</span><span>{{ '>' }}</span>
      </span>
    </div>
    <div>
      <span>{{ '</' }}</span><span class="u-text-gray-500">{{ 'template' }}</span><span>{{ '>' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: 0
  },
  stepsSection: {
    type: Array,
    default: () => []
  }
})
</script>
