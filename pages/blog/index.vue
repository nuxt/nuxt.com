<script setup lang="ts">
import type { BlogArticle } from '~/types'

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
const { data: articles } = await useAsyncData(`${route.path}-articles`, () => queryContent(route.path)
  .where({ _extension: 'md' })
  .sort({ date: -1 })
  .without(['body', 'excerpt'])
  .find() as Promise<BlogArticle[]>
)

useContentHead(page)
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(article, index) in articles"
            :key="index"
            :to="article._path"
            :title="article.title"
            :description="article.description"
            class="flex flex-col"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { padding: 'px-4 pb-4 sm:px-6' },
              title: 'text-lg line-clamp-1',
              description: 'line-clamp-2'
            }"
          >
            <template #header>
              <img
                :src="article.image"
                :alt="article.title || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                height="366"
                width="488"
              >
            </template>

            <template #icon>
              <UBadge :label="article.category" variant="subtle" />
            </template>

            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <time class="text-muted">{{ formatDateByLocale('en', article.date) }}</time>

                <UAvatarGroup size="xs" :ui="{ ring: 'ring-2 ring-surface' }">
                  <UAvatar
                    v-for="(author, subIndex) in article.authors"
                    :key="subIndex"
                    :src="author.avatarUrl"
                    :alt="author.name"
                    class="lg:hover:scale-125"
                  >
                    <NuxtLink v-if="author.link" :to="author.link" target="_blank" class="focus:outline-none" tabindex="-1">
                      <span class="absolute inset-0" aria-hidden="true" />
                    </NuxtLink>
                  </UAvatar>
                </UAvatarGroup>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
