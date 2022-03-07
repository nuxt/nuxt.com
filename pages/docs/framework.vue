<template>
  <DocsPage>
    <template #header>
      <div class="flex items-center gap-3 justify-start">
        <img src="/docs/framework.svg" class="h-6 rounded-md w-auto">
        <p class="font-bold">
          Framework
        </p>
      </div>

      <UPills :links="links" class="justify-center col-span-4" />

      <div class="flex justify-end">
        <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
      </div>
    </template>

    <template #left>
      <UVerticalNavigation :links="asideLinks" active-class="u-text-gray-900 u-bg-gray-200" />
    </template>

    <template #right>
      <p class="text-xs font-medium uppercase tracking-wide u-text-gray-600">
        On this page
      </p>
    </template>

    <NuxtPage />
  </DocsPage>
</template>

<script setup lang="ts">
import { withBase } from 'ufo'

const route = useRoute()

const path = computed(() => {
  const [, first, second, third] = route.path.split('/')
  return [first, second, third].join('/')
})

const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

const { data: navigation } = await useAsyncData('framework-docs-top-nav', async () => {
  return await $fetch(withContentBase('/navigation'), {
    method: 'POST',
    body: { slug: '/docs/framework' }
  })
})

const currentNav = computed(() => {
  return navigation.value[0].children[0].children
})

const nodeToLink = link => ({ to: link.slug, label: link.title })

const links = computed(() => {
  if (!currentNav.value) { return [] }

  return currentNav.value.map(nodeToLink)
})

const asideLinks = computed(() => {
  return currentNav.value.find(link => link.slug.includes(path.value))?.children.map(nodeToLink)
})
</script>
