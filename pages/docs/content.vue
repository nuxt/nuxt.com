<template>
  <DocsPage>
    <template #header>
      <SubNavbar title="Content" to="/docs/content" :links="links">
        <template #right>
          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/content" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <NuxtPage />
  </DocsPage>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const links = computed(() => navFromPath('/docs/content')?.children)
</script>
