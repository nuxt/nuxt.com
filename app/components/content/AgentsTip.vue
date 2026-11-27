<script setup lang="ts">
/** One line of the tips list under the agent tabs, with its icon. */
defineProps<{
  icon: string
}>()
</script>

<template>
  <div class="not-prose flex gap-2.5 text-sm/relaxed text-muted [&_p]:my-0 [&_a]:font-medium [&_code]:px-1! [&_code]:py-0! [&_code]:text-xs/5! [&_code]:rounded!">
    <UIcon :name="icon" class="shrink-0 mt-0.75 size-4" />
    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
