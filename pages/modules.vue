<script setup lang="ts">
const moduleLinks = [{
  icon: 'i-ph-plus-circle-duotone',
  label: 'Create a module',
  to: '/docs/guide/going-further/modules'
}, {
  icon: 'i-ph-list-plus-duotone',
  label: 'List your module',
  to: 'https://github.com/nuxt/modules#addupdate-a-module',
  target: '_blank'
}]

const { headerLinks } = useNavigation()
const { categories } = useModules()
const links = computed(() => headerLinks.value.find(link => link.to === '/docs')?.children ?? [])
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside :links="links">
          <UDivider type="dashed" class="mb-6" />
          <UNavigationTree :links="[{ label: 'Categories', disabled: true, children: categories }]" />
          <UDivider type="dashed" class="my-6" />
          <UPageLinks :links="moduleLinks" />
        </UAside>
      </template>
      <NuxtPage />
    </UPage>
  </UContainer>
</template>
