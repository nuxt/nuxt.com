<template>
  <div>
    <AppSelect
      v-if="regions.length"
      v-model="region"
      name="region"
      :options="[{ title: 'test' }, { title: 'test2' }, { title: 'test2' }]"
      size="sm"
      placeholder="Region"
      text-attribute="title"
      class="min-w-[144px]"
    />
    <AppSelectPinceau
      v-if="regions.length"
      v-model="region"
      name="region"
      :options="[{ title: 'test' }, { title: 'test2' }, { title: 'test2' }]"
      size="sm"
      placeholder="Region"
      text-attribute="title"
      class="min-w-[144px]"
    />
  </div>
</template>

<script setup lang="ts">

const region = ref({ title: 'test' })
const regions = ref([{ title: 'test' }, { title: 'test2' }, { title: 'test2' }])

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
