<template>
  <div>
    <AppButton trailing-icon="heroicons:academic-cap" variant="primary-gradient">
      Hello World
    </AppButton>

    <AppButtonPinceau icon-name="heroicons:academic-cap" trailing variant="primary-gradient" to="/">
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
<style>
.button {
  position: relative;

  background-color: black;
  border: 2px solid transparent;
  border-radius: 12px;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
}

.button::after {
  position: absolute;
  background: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet);
  top: -4px; bottom: -4px;
  left: -4px; right: -4px;
  content: '';
  z-index: -1;
  border-radius: 12px;
}

.button:hover {
  box-shadow: 0 0 10px 0 rgba(180, 27, 27, 0.5), 0 0 20px 0 rgba(31, 44, 190, 0.5);
}
</style>
