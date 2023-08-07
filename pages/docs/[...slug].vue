<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const route = useRoute()
const { mapContentNavigation, findPageBreadcrumb } = useElementsHelpers()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/docs')
  .where({ _extension: 'md', navigation: { $ne: false } })
  .without(['body', 'excerpt'])
  .findSurround(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)
)

const githubLink = computed(() => `https://github.com/nuxt/nuxt/edit/dev/docs/content/${page?.value?._file}`)
const breadcrumb = computed(() => mapContentNavigation(findPageBreadcrumb(navigation.value, page.value)))

useContentHead(page)
</script>

<template>
  <UPage>
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

      <hr v-if="surround?.length" class="border-border my-8">

      <UDocsSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UDocsToc :links="page.body?.toc?.links">
        <template #bottom>
          <div class="hidden lg:block">
            <hr v-if="page.body?.toc?.links?.length" class="border-border border-dashed my-6">

            <UButton
              :to="githubLink"
              color="gray"
              variant="link"
              label="Edit this page"
              :padded="false"
              truncate
            >
              <template #trailing>
                <UIcon name="i-ph-arrow-square-out-light" class="w-4 h-4" />
              </template>
            </UButton>

            <hr class="border-border border-dashed my-6">

            <Ads />
          </div>
        </template>
      </UDocsToc>
    </template>
  </UPage>
</template>
