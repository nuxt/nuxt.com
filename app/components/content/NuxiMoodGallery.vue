<script setup lang="ts">
const moods: { mood: NuxiMood, label: string }[] = [
  { mood: 'idle', label: 'idle' },
  { mood: 'happy', label: 'happy' },
  { mood: 'excited', label: 'excited' },
  { mood: 'thinking', label: 'thinking' },
  { mood: 'surprised', label: 'surprised' },
  { mood: 'sleeping', label: 'sleeping' }
]
</script>

<template>
  <div class="nuxi-mood-gallery not-prose my-8">
    <div v-for="item in moods" :key="item.mood" class="nuxi-mood-card">
      <AgentNuxiIcon class="size-10 text-primary" :mood="item.mood" :interactive="false" />
      <div class="nuxi-mood-label">
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.nuxi-mood-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;
}

@media (min-width: 640px) {
  .nuxi-mood-gallery {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

.nuxi-mood-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.5rem;
  border-radius: var(--ui-radius, 0.5rem);
  border: 1px solid var(--ui-border, rgb(229 229 229 / 0.15));
  background: color-mix(in srgb, var(--ui-bg-elevated, #1a1a1a) 50%, transparent);
}

.nuxi-mood-label {
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  line-height: 1rem;
  color: var(--ui-text, currentColor);
}
</style>
