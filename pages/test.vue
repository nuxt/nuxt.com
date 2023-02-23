<template>
  <div>
    <AppTextarea
      label="Message"
      name="Message"
      placeholder="Message"
      required
      size="xl"
      variant="outline"
      custom-class="flex-1"
    />
  </div>
</template>

<style scoped lang="ts">
css({
  div: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '2rem',
    flexDirection: 'column'
  }
})
</style>
