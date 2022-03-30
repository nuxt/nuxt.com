<template>
  <div>
    <SubNavbar title="Resources" :links="links">
      <template #right>
        <UButton icon="fa-brands:twitter" variant="transparent" to="https://twitter.com/nuxt_js" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:discord" variant="transparent" to="https://discord.com/invite/ps2h6QT" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/framework" target="_blank" class="!p-0" />
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

const links = computed(() => {
  if (!currentNav.value) { return [] }

  return currentNav.value.map(navLinks)
})

const navLinks = navLink => ({ to: navLink.slug, label: navLink.title })
</script>
