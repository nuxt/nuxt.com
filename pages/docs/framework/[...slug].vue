<template>
  <div class="flex flex-col-reverse lg:grid lg:grid-cols-10 gap-8 relative">
    <div class="col-span-10 lg:col-span-8">
      <div class="prose dark:prose-invert !max-w-full">
        <Content v-if="page" :document="page" />
      </div>
    </div>
    <DocsToc class="lg:inset-x-0 col-span-2 lg:pb-8 overflow-x-hidden overflow-y-auto lg:pb-0 sticky top-0 lg:top-16 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start col-span-2 lg:h-[calc(100vh-64px)]" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const route = useRoute()

const { page, fetchPage } = useContent()

const { data: redirect } = await useAsyncData(
  `content-page-${route.path}`,
  fetchPage
)

if (redirect.value) { router.push(redirect.value) }
</script>
