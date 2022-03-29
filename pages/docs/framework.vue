<template>
  <DocsPage>
    <template #header>
      <SubNavbar :links="links">
        <template #left>
          <p class="font-semibold">
            Framework
          </p>

          <USelect
            v-model="version"
            :options="versions"
            name="version"
            size="xs"
          />
        </template>

        <template #right>
          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <template v-if="$route.params.slug" #left>
      <DocsAside :links="asideLinks" active-class="u-text-gray-900 u-bg-gray-200" />
    </template>

    <template v-if="$route.params.slug" #right>
      <DocsToc :toc="[]" />
    </template>

    <NuxtPage v-if="$route.params.slug" />
    <DocsFrameworkHero v-else />
  </DocsPage>
</template>

<script setup lang="ts">
import { withBase } from 'ufo'

const route = useRoute()

const versions = ref([{ text: 'v3', value: '3' }, { text: 'v2', value: '2' }])
const version = ref(versions.value[0].value)

const path = computed(() => {
  const [, first, second, third] = route.path.split('/')
  return [first, second, third].join('/')
})

const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

const { data: navigation } = await useAsyncData('docs', async () => {
  return await $fetch(withContentBase('/navigation'), {
    method: 'POST',
    body: { slug: '/docs/framework' }
  })
})

const currentNav = computed(() => {
  return navigation.value[0].children[0].children
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

const asideLinks = computed(() => {
  return currentNav.value.find(link => link.slug.includes(path.value))?.children.map(items)
})
</script>
