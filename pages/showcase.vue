<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const route = useRoute()
const { fetchList, selectedShowcases, categories } = useShowcase()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs')

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage id="smooth" class="pt-20 -mt-20">
      <template #left>
        <UAside>
          <UNavigationTree :links="[{ label: 'Categories', disabled: true, children: categories }]" />
        </UAside>
      </template>

      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(showcase, index) in selectedShowcases"
            :key="index"
            :to="showcase.url"
            target="_blank"
            :title="showcase.title || showcase.hostname"
            :description="showcase.hostname"
            :ui="{ header: { base: 'aspect-w-4 aspect-h-2', padding: '' }, body: { padding: '!p-4' } }"
            class="overflow-hidden"
          >
            <template #header>
              <img
                :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_488,h_366/${showcase.screenshotUrl}`"
                :alt="showcase.hostname || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                height="366"
                width="488"
              >
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
