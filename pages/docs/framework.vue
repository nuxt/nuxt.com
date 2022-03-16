<template>
  <DocsPage>
    <template #header>
      <SubNavbar>
        <div class="relative grid items-center justify-between h-16 grid-cols-2 gap-3 sm:grid-cols-6">
          <div class="flex items-center justify-start gap-3">
            <p class="font-semibold">
              Framework
            </p>
            <USelect
              v-model="version"
              :options="versions"
              name="version"
              size="xs"
            />
          </div>

          <div class="flex justify-center col-span-4 gap-x-8">
            <ContentLink
              v-for="link in links"
              :key="link.label"
              :link="link"
              class="text-sm hover:u-text-gray-900"
            >
              {{ link.label }}
            </ContentLink>
          </div>

          <div class="flex justify-end">
            <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
          </div>
        </div>
      </SubNavbar>
    </template>

    <template #left>
      <ContentAside :links="asideLinks" active-class="u-text-gray-900 u-bg-gray-200" />
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

const versions = ref([{ text: 'v3', value: '3' }, { text: 'v2', value: '2' }])
const version = ref(versions.value[0])

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
