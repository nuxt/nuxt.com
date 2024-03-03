<template>
  <Alert
    title="Caution"
    icon="i-ph-warning-octagon-duotone"
    color="red"
    class="_caution"
    :class="$attrs.to ? 'dark:hover:!border-red-600/50 hover:!border-red-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>

<style lang="postcss">
._caution {
  @apply prose-a:text-red-500 hover:prose-a:border-red-500 !bg-red-200/40 !border-red-400/30;
  @apply dark:!border-red-600 dark:prose-a:text-red-400 dark:hover:prose-a:border-red-400 dark:!bg-red-900/70;
  a code {
    @apply hover:!text-red-400 hover:!border-red-400;
    @apply dark:hover:!text-red-400 dark:hover:!border-red-400;
  }
}
</style>
