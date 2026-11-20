<script setup lang="ts">
withDefaults(defineProps<{ text?: string, avatar?: boolean, avatarTransitionName?: string }>(), { text: 'Thinking', avatar: false })
</script>

<template>
  <div class="flex min-h-7 items-center gap-3 text-sm text-muted" role="status">
    <span v-if="avatar" class="grid size-7 shrink-0 place-items-center" :style="avatarTransitionName ? { viewTransitionName: avatarTransitionName } : undefined" aria-hidden="true">
      <AgentNuxiIcon mood="thinking" :interactive="false" class="h-6 w-7 text-default" />
    </span>
    <UChatShimmer :text="text" />
  </div>
</template>
