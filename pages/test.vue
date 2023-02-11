<template>
  <div>
    <AppButton>
      Hello World
    </AppButton>

    <AppButtonPinceau>
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
