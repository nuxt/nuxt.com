<template>
  <div>
    <AppButton icon-name="heroicons:academic-cap" trailing variant="primary-gradient">
      Hello World
    </AppButton>

    <AppButton icon-name="heroicons:academic-cap" trailing variant="primary" to="/" block>
      Hello World
    </AppButton>

    <AppButton icon-name="heroicons:academic-cap" trailing variant="secondary">
      Hello World
    </AppButton>

    <AppButton icon-name="heroicons:academic-cap" trailing variant="input-group">
      Hello World
    </AppButton>

    <AppButton icon-name="heroicons:academic-cap" trailing variant="base" color="green">
      Hello World
    </AppButton>

    <AppButton icon-name="heroicons:academic-cap" trailing variant="transparent">
      Hello World
    </AppButton>
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
