<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('showcase', () => useContent('site').get('/showcase'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)
const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  headline: 'Resources',
  title,
  description
})
</script>

<template>
  <UPage v-if="pageData">
    <UPageHero
      :description="pageData.description"
      :ui="{
        container: '!pb-12',
        title: 'text-left',
        description: 'text-left'
      }"
    >
      <template #title>
        {{ pageData.hero.title }}<br><span class="text-primary">{{ pageData.hero.highlight }}</span>
      </template>
    </UPageHero>

    <UPageBody>
      <UContainer>
        <ShowcaseStats />
      </UContainer>

      <UContainer>
        <div class="mb-4 flex items-end justify-between gap-4">
          <h2 class="text-lg font-medium text-highlighted">
            {{ pageData.wall.title }}
          </h2>
          <p class="hidden lg:block pointer-coarse:hidden text-xs text-dimmed">
            {{ pageData.wall.hint }}
          </p>
        </div>
        <ShowcaseWall :websites="pageData.websites" />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
