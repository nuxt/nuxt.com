<template>
  <div>
    <SubNavbar title="Modules" :links="links">
      <template #right>
        <UButton icon="fa-brands:twitter" variant="transparent" to="https://twitter.com/nuxt_js" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:discord" variant="transparent" to="https://discord.com/invite/ps2h6QT" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/framework" target="_blank" class="!p-0" />
      </template>
    </SubNavbar>

    <ContentRenderer :value="page" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { page, fetchPage } = useContent()
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
