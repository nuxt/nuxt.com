<template>
  <DocsPage :toc="page.toc">
    <div class="prose dark:prose-invert prose-green max-w-none">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </DocsPage>
</template>

<script setup lang="ts">
const { page, fetchPage } = usePage()
const route = useRoute()

const slug = computed(() => route.params.slug)

await fetchPage({
  querySurround: true,
  _path: `/docs/3.x/community/${slug.value}`,
  surroundMapper: (surround) => {
    return surround.map((item) => {
      if (!item?._path.includes('/docs/3.x/community')) {
        return null
      }
      return {
        ...item,
        _path: item._path.replace('/docs/3.x/community', '/community/guide')
      }
    })
  }
})
</script>
