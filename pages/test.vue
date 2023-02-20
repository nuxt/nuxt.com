<template>
  <div>
    <AppFormGroup name="email" label="Your company" class="col-span-2 sm:col-span-1">
      <AppInput
        label="Company"
        name="Company"
        placeholder="Your company"
        required
        size="xl"
        variant="outline"
        custom-class="flex-1"
      />
    </AppFormGroup>

    <AppFormGroupPinceau name="email" label="Your company" class="col-span-2 sm:col-span-1">
      <AppInput
        label="Company"
        name="Company"
        placeholder="Your company"
        required
        size="xl"
        variant="outline"
        custom-class="flex-1"
      />
    </appformgrouppinceau>
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
