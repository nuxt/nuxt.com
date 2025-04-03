<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('showcase', () => queryCollection('showcase').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { fetchList, selectedShowcases, categories } = useShowcase()

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', {
  headline: 'Resources',
  title,
  description
})

await fetchList()

function getShowcaseItemScreenShotUrl(showcase: any) {
  if (showcase.screenshotUrl && showcase.screenshotUrl.startsWith('vue-telemetry')) {
    return `https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_488,h_366/${showcase.screenshotUrl}`
  }
  if (showcase.screenshotUrl) {
    return showcase.screenshotUrl
  }
  return `/assets/showcase/${showcase.name ? showcase.name?.toLowerCase() : showcase.hostname}.png`
}
</script>

<template>
  <UContainer v-if="page">
    <UPageHero :title="page.title" :description="page.description" :ui="{ container: '!pb-16', links: 'gap-1.5 max-w-2xl mx-auto' }">
      <template #links>
        <UButton
          v-for="category in categories"
          :key="category.key"
          v-bind="category"
          color="neutral"
          variant="outline"
          active-color="primary"
          active-variant="subtle"
          size="sm"
        />
      </template>
    </UPageHero>

    <UPage id="smooth" class="pt-20 -mt-20">
      <UPageBody>
        <UPageGrid class="bg-(--ui-bg-elevated)/50 p-4 rounded-2xl gap-2">
          <UPageCard
            v-for="(showcase, index) in selectedShowcases"
            :key="index"
            :to="showcase.url"
            target="_blank"
            variant="naked"
            class="overflow-hidden group rounded-lg"
          >
            <NuxtImg
              :src="getShowcaseItemScreenShotUrl(showcase)"
              :alt="showcase.hostname || ''"
              :loading="index === 0 ? 'eager' : 'lazy'"
              class="object-cover object-top size-full opacity-100 group-hover:opacity-50 transition-opacity duration-300"
              height="366"
              width="488"
            />

            <p class="hidden absolute text-nowrap top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:flex bg-(--ui-bg-inverted) text-(--ui-bg) px-2.5 py-1 rounded-full text-sm font-medium font-mono items-center gap-1 shadow">
              {{ showcase.name ?? showcase.hostname }}

              <UIcon name="i-lucide-arrow-up-right" class="size-4" />
            </p>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
