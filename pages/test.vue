<template>
  <div>
    <AppBadge label="test" />
    <AppBadgePinceau label="test" />
    <AppBadge label="test" rounded />
    <AppBadgePinceau label="test" rounded />
    <AppBadge label="test" variant="primary" />
    <AppBadgePinceau label="test" variant="primary" />
    <AppBadge label="test" variant="secondary" />
    <AppBadgePinceau label="test" variant="secondary" />
    <AppBadge label="test" variant="green" />
    <AppBadgePinceau label="test" variant="base" color="green" />
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
