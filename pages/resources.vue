<template>
  <div>
    <SubNavbar title="Resources" :links="links">
      <template #right>
        <UButton icon="fa-brands:twitter" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
        <UButton icon="fa-brands:discord" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
        <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
      </template>
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { withBase } from 'ufo'

const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

const { data: navigation } = await useAsyncData('resources', async () => {
  return await $fetch(withContentBase('/navigation'), {
    method: 'POST',
    body: { slug: '/resources' }
  })
})

const currentNav = computed(() => {
  return navigation.value[0].children
})

// first nav level
const navLinks = navLink => ({ to: navLink.slug, label: navLink.title, children: navLink.children?.map(items) || null })
// second
const items = item => ({ to: item.slug, label: item.title, children: item.children?.map(itemLinks) || null })
// third
const itemLinks = itemLink => ({ to: itemLink.slug, label: itemLink.title })

const links = computed(() => {
  if (!currentNav.value) { return [] }

  return currentNav.value.map(navLinks)
})
</script>
