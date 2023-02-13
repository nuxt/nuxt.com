<template>
  <div>
    <AppButton trailing-icon="heroicons:academic-cap" variant="primary">
      Hello World
    </AppButton>

    <AppButtonPinceau icon-name="heroicons:academic-cap" trailing variant="primary" to="/">
      Hello World
    </AppButtonPinceau>
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
