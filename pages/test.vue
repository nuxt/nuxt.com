<template>
  <div>
    <AppButton label="baise" @click="click()" />
    <AppInput placeholder="test" name="test" icon="heroicons-outline:academic-cap" />
    <AppInput_old placeholder="test" name="test" icon="heroicons-outline:academic-cap" />
  </div>
</template>

<script setup lang="ts">

const { $toast } = useNuxtApp()

const click = () => {
  $toast.success({ title: 'Subscription pending', description: 'Please check your emails to confirm your subscription.', type: 'information' })
}
</script>

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
