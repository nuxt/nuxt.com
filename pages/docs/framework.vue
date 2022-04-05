<template>
  <DocsPage>
    <template #header>
      <SubNavbar title="Framework" :links="links">
        <template #right>
          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <template v-if="$route.params.slug" #aside>
      <DocsAside />
    </template>

    <NuxtPage v-if="$route.params.slug" />
    <DocsFrameworkHero v-else />
  </DocsPage>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const links = computed(() => navFromPath('/docs/framework')?.children)
</script>
