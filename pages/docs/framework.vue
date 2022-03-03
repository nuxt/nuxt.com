<template>
  <div>
    <div class="border-t u-border-gray-200">
      <UContainer padded class="py-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <img src="/docs/framework.svg" class="h-6 rounded-md w-auto">
            <p class="font-bold">
              Framework
            </p>
          </div>

          <UPills :links="links" class="justify-center hidden sm:block" />

          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/" class="!p-0" />
        </div>
      </UContainer>
    </div>

    <Page>
      <PageGrid>
        <template #aside>
          <UVerticalNavigation :links="asideLinks" active-class="u-text-gray-900 u-bg-gray-200" />
        </template>

        <NuxtPage />
      </PageGrid>
    </Page>
  </div>
</template>

<script setup lang="ts">
import { withBase } from 'ufo'

const route = useRoute()
const [_, first, second] = route.path.split('/')
const path = [first, second].join('/')

const withContentBase = (url: string) => withBase(url, '/api/' + useRuntimeConfig().content.basePath)

const { data: navigation } = await useAsyncData('framework-docs-top-nav', async () => {
  return await $fetch(withContentBase('/navigation'), {
    method: 'POST',
    body: { slug: '/docs/framework' }
  })
})

const currentNav = computed(
  () => {
    return navigation.value[0].children[0].children
  }
)

const nodeToLink = link => ({ to: link.slug, label: link.title })

const links = computed(
  () => {
    if (!currentNav.value) { return [] }

    return currentNav.value.map(nodeToLink)
  }
)

const asideLinks = computed(
  () => {
    return currentNav.value.find(link => link.slug.includes(path))?.children.map(nodeToLink)
  }
)
</script>
