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
    <DocsHero v-else :buttons="buttons">
      <template #badge>
        Nuxt 3.0 is out.
        <a class="underline" href="https://github.com/nuxt">Read about it here</a>
      </template>

      <template #title>
        The Intuitive Vue Framework
      </template>

      <template #description>
        Build your next Vue.js application with confidence using Nuxt.
        An open source framework making web development simple and powerful.
      </template>
    </DocsHero>
  </DocsPage>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const buttons = [
  {
    size: 'xl',
    variant: 'transparent',
    icon: 'fa-brands:github',
    label: '39k + Github Stars',
    to: '#'
  },
  {
    size: 'xl',
    variant: 'primary',
    label: 'Get Started',
    to: '/docs/framework/getting-started/quick-start'
  }
]

const links = computed(() => navFromPath('/docs/framework')?.children)
</script>
