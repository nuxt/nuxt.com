<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

console.log('page.value', page.value)
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="page.title">
        {{ page }}
        <template #description>
          <span v-html="page.description" />
        </template>

        <template #right>
          <img :src="`${page.image.path}-light.${page.image.format}`" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" alt="" :width="page.image.width" :height="page.image.height">
          <img :src="`${page.image.path}-dark.${page.image.format}`" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" alt="" :width="page.image.width" :height="page.image.height">
        </template>
      </UPageHeader>
    </UPage>
  </UContainer>
</template>
