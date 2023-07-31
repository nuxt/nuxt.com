<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const route = useRoute()
const { mapContentNavigation, findPageBreadcrumb } = useUIKitContent()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/docs')
  .where({ _extension: 'md', navigation: { $ne: false } })
  .findSurround(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)
)

const githubLink = computed(() => `https://github.com/nuxt/nuxt/edit/dev/docs/content/${page?.value?._file}`)
const breadcrumb = computed(() => mapContentNavigation(findPageBreadcrumb(navigation.value, page.value)))

useContentHead(page)
</script>

<template>
  <UPage v-if="page">
    <UPageHeader v-bind="page">
      <template #headline>
        <span v-for="(link, index) in breadcrumb" :key="index" :class="[index < breadcrumb.length - 1 && 'font-normal text-muted']" class="flex items-center gap-1.5">
          {{ link.label }}

          <UIcon v-if="index < breadcrumb.length - 1" name="i-ph-caret-right" class="w-4 h-4" />
        </span>
      </template>
    </UPageHeader>

    <UPageBody prose>
      <ContentRenderer v-if="page && page.body" :value="page" />

      <UButton
        :to="githubLink"
        variant="link"
        icon="i-ph-note-pencil"
        label="Edit this page on GitHub"
        :padded="false"
        class="mt-12"
      />

      <hr v-if="surround?.length" class="border-gray-200 dark:border-gray-800 my-8">

      <UDocsSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UDocsToc :links="page.body?.toc?.links">
        <template #bottom>
          <div class="hidden lg:block">
            <hr v-if="page.body?.toc?.links?.length" class="border-gray-200 dark:border-gray-800 border-dashed my-6">

            <Ads />
          </div>
        </template>
      </UDocsToc>
    </template>
  </UPage>
  <UPageError v-else :error="{ name: 'Page not found' }" />
</template>
