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
import { findChildFromPath } from '~~/utils/content'

const navigation = inject('navigation')

const links = computed(() => findChildFromPath('/docs/framework', navigation)?.children)
</script>
