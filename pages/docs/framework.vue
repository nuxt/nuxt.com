<template>
  <DocsPage>
    <template #header>
      <div class="flex items-center justify-start gap-3">
        <p class="font-semibold">
          Framework
        </p>
      </div>

      <div class="flex justify-center col-span-4 gap-x-8">
        <ULink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="text-sm font-medium hover:u-text-gray-900"
          active-class="font-semibold u-text-gray-900"
          inactive-class="u-text-gray-500"
          exact
        >
          {{ link.label }}
        </ULink>
      </div>

      <div class="flex justify-end">
        <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
      </div>
    </template>

    <template #left>
      <UVerticalNavigation :links="asideLinks" active-class="u-text-gray-900 u-bg-gray-200" />
    </template>

    <template #right>
      <p class="text-xs font-medium tracking-wide uppercase u-text-gray-600">
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
