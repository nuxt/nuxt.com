<template>
  <DocsPage>
    <template #header>
      <SubNavbar title="Content" to="/docs/content" :links="links">
        <template #right>
          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/content" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <template v-if="$route.params.slug" #aside>
      <DocsAside />
    </template>

    <NuxtPage v-if="$route.params.slug" />
    <DocsHero v-else :buttons="buttons">
      <template #hero>
        Content 2.0 is out!
        <a class="underline" href="https://github.com/nuxt/content">Read about it here</a>
      </template>

      <template #title>
        Git-based Headless CMS
      </template>

      <template #description>
        Write pages in markdown, use Vue components, and enjoy the power of Nuxt with a blazing fast developer experience.
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
    label: '2k GitHub Stars',
    to: '#'
  },
  {
    size: 'xl',
    variant: 'primary',
    label: 'Get Started',
    to: '/docs/framework/getting-started'
  }
]

const links = computed(() => navFromPath('/docs/content')?.children)
</script>
