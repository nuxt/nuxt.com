<script setup lang="ts">
import type { BlogArticle } from '~/types'

const route = useRoute()

const { data: article } = await useAsyncData(route.path, () => queryContent<BlogArticle>(route.path).findOne())
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/blog')
  .where({ _extension: 'md' })
  .without(['body', 'excerpt'])
  .sort({ date: -1 })
  .findSurround(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)
)
</script>

<template>
  <UContainer :ui="{ constrained: 'max-w-4xl' }">
    <UPage>
      <UPageHeader :title="article.title" :description="article.description" :headline="article.category">
        <div class="mt-4 flex flex-wrap items-center gap-6">
          <UButton
            v-for="(author, index) in article.authors"
            :key="index"
            :to="author.link"
            target="_blank"
            color="gray"
            variant="ghost"
            class="-my-1.5 -mx-2.5"
          >
            <UAvatar :src="author.avatarUrl" :alt="author.name" />

            <div class="text-left">
              <p class="font-medium">
                {{ author.name }}
              </p>
              <p class="text-muted leading-4">
                {{ `@${author.link.split('/').pop()}` }}
              </p>
            </div>
          </UButton>
        </div>

        <UButton
          to="/blog"
          icon="i-ph-caret-left"
          color="gray"
          :ui="{ rounded: 'rounded-full' }"
          size="lg"
          class="absolute top-[72px] -left-[72px] hidden lg:flex"
        />
      </UPageHeader>

      <UPageBody prose>
        <ContentRenderer v-if="article && article.body" :value="article" />

        <hr v-if="surround?.length" class="border-border my-8">

        <UDocsSurround :surround="surround" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
