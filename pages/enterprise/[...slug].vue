<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useContentHead(page)
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage
        v-if="page.image"
        :light="`${page.image.path}-light.${page.image.format}`"
        :dark="`${page.image.path}-dark.${page.image.format}`"
        class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100"
        :width="page.image.width"
        :height="page.image.height"
      />
    </UPageHero>

    <UPage>
      <UPageBody prose class="prose-lg">
        <ContentRenderer v-if="page && page.body" :value="page" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
