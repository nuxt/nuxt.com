<template>
  <Alert
    title="Warning"
    icon="i-ph-warning-duotone"
    color="amber"
    class="dark:!bg-amber-800/40 dark:!border-amber-800/40 !bg-amber-200/30 !border-amber-400/30"
    :class="$attrs.to ? 'dark:hover:!border-amber-600/50 hover:!border-amber-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
