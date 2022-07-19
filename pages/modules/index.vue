<template>
  <div>
    <SubNavbar title="Modules" :links="links">
      <template #right>
        <!-- CTA -->
      </template>
    </SubNavbar>

    <ContentRenderer :value="page" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { page, fetchPage } = usePage()
const { fetch: fetchModules, types } = useModules()

await Promise.all([fetchPage(), fetchModules()])

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
        params: { smooth: '#smooth' }
      },
      active: !route.query.type
    },
    ...types.value.map(type => ({ ...type, _path: type.to, exact: true, active: route.query.type === type.key }))
  ]
})
</script>
