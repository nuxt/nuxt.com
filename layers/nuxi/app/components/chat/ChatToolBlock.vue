<script setup lang="ts">
defineProps<{
  text: string
  icon: string
  suffix?: string
  streaming?: boolean
  chevron?: 'leading' | 'trailing'
}>()
</script>

<template>
  <div class="w-full flex flex-col gap-3">
    <UChatTool
      :text="text"
      :icon="icon"
      :suffix="suffix"
      :streaming="streaming"
      :chevron="chevron"
    />
    <slot />
  </div>
</template>
