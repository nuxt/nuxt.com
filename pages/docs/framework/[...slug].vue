<template>
  <div class="grid grid-cols-10 gap-8 relative">
    <div class="col-span-10 lg:col-span-8">
      <div class="prose dark:prose-invert !max-w-full">
        <Content v-if="page" :document="page" />
      </div>
    </div>

    <div class="pb-8 overflow-x-hidden overflow-y-auto lg:pb-0 hidden lg:block lg:sticky lg:top-16 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start col-span-2 lg:max-h-[calc(100vh-64px)]">
      <DocsToc />
    </div>
  </div>
</template>

<script setup lang="ts">
import { findChildFromPath, findBottomLinkFromTree } from '~/utils/content'

const navigation = inject('navigation')

const route = useRoute()
const router = useRouter()

const file = findChildFromPath(route.path, navigation.value)

let page
if (file && !file.children) {
  const { data } = await useAsyncData('docs-framework-page', () => queryContent(route.path).findOne())

  page = data.value
} else {
  const slug = findBottomLinkFromTree(file)
  router.push(slug)
}
</script>
