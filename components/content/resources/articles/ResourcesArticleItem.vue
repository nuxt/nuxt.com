<template>
  <NuxtLink class="flex flex-col gap-y-4 py-8" :class="{ 'rounded-lg border-2 u-border-gray-200 px-8': mainArticle }" :to="page.slug">
    <div class="font-semibold u-text-gray-400" :class="{ 'text-sm': !mainArticle }">
      <time>{{ formatDateByLocale('en', page.date) }}</time> - {{ page.category }}
    </div>
    <h2 class="u-text-gray-900 font-bold" :class="mainArticle ? 'text-3xl' : 'text-2xl'">
      {{ page.title }}
    </h2>
    <p class="font-medium u-text-gray-500">
      {{ page.description }}
    </p>
    <div class="flex justify-between items-center">
      <NuxtLink :to="page.slug" class="relative inline-flex items-center group flex-nowrap max-w-max mb-4">
        <span class="flex items-center font-semibold text-xl gap-x-2">
          Read article<UIcon name="heroicons-solid:arrow-right" class="w-4 h-4 mt-1" />
        </span>
        <span
          class="rounded absolute left-0 bg-gradient-to-r from-[#00DC82] via-[#34CDFE] to-[#0047E1] font-extrabold -bottom-1 h-0.5 w-4 group-hover:w-full transition-all"
        />
      </NuxtLink>
      <UAvatarGroup :group="authors" size="sm" />
    </div>
  </NuxtLink>
</template>

<script setup>

const props = defineProps({
  page: {
    type: Object,
    required: true
  },
  mainArticle: {
    type: Boolean,
    default: false
  }
})

const authors = props.page.authors.map(author => ({ src: author.avatarUrl, ...author }))
const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
