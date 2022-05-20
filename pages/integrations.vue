<template>
  <div>
    <SubNavbar title="Integrations" :links="links">
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
const { page, fetchPage } = useContent()

await fetchPage()

const links = computed(() => ([{
  title: 'Content',
  _path: 'https://content-v2.nuxtjs.org',
  target: '_blank'
}]))
</script>
