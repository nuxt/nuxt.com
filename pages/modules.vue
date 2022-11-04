<template>
  <div>
    <SubNavbar title="Modules" :links="links">
      <template #right>
        <!-- CTA -->
      </template>
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  documentDriven: false
})
const route = useRoute()
const { fetch: fetchModules, types } = useModules()

await fetchModules()

const links = computed(() => {
  return [
    {
      title: 'All',
      _path: {
        name: 'modules',
        query: {
          ...route.query,
          type: undefined
        },
        state: { smooth: '#smooth' }
      },
      active: !route.query.type
    },
    ...types.value.map(type => ({ ...type, _path: type.to, exact: true, active: route.query.type === type.key }))
  ]
})
</script>
