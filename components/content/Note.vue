<template>
  <Alert
    title="Note"
    icon="i-ph-info-duotone"
    color="blue"
    class="dark:!bg-blue-800/40 !bg-blue-200/40 dark:!border-blue-600/30 !border-blue-400/30"
    :class="$attrs.to ? 'dark:hover:!border-blue-600/50 hover:!border-blue-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
