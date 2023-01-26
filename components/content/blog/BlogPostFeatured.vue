<template>
  <div ref="root" class="cursor-pointer rounded-md relative group card-wrapper" @click="onClick">
    <div class="hidden gradient-border gradient-border-dark dark:block" />
    <div class="dark:hidden gradient-border gradient-border-light" />

    <UCard
      class="h-full w-full flex flex-col justify-between relative"
      shadow-class="shadow-none"
    >
      <div class="absolute inset-0 transition-opacity bg-overlay opacity-20 group-hover:opacity-40" />
      <div v-if="featuredArticle" class="relative flex flex-col p-4">
        <div class="font-semibold text-white">
          <time>{{ formatDateByLocale('en', featuredArticle.date) }}</time>
        </div>
        <h2 class="mt-4 text-3xl font-semibold text-white">
          {{ featuredArticle.title }}
        </h2>
        <p class="mt-6 text-white line-clamp-3">
          {{ featuredArticle.description }}
        </p>
        <div class="flex items-center justify-between mt-6">
          <NuxtLink :to="featuredArticle._path" class="flex items-center text-xl font-semibold text-white gap-x-2">
            Read article<UIcon name="uil:arrow-right" class="w-5 h-5 mt-1" />
          </NuxtLink>
          <UAvatarGroup :group="authors" size="sm" />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { formatDateByLocale } from '../../../utils'

const { featuredArticle } = useBlog()

const authors = computed(() => {
  return (featuredArticle?.value?.authors || []).map(author => ({ src: author.avatarUrl, ...author }))
})

const onClick = () => {
  navigateTo(featuredArticle.value?._path)
}

const root = ref<HTMLElement | null>(null)

useBlockLinks(root)
</script>

<style lang="postcss">

:root {
  --gradient-angle: 360deg;
}

@keyframes gradient-rotate {
  0% {
    --gradient-angle: 360deg;
  }

  100% {
    --gradient-angle: 0deg;
  }
}

.gradient-border {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 14px;
  z-index: -1;
  transform: translate(-1px, -1px);
}

.gradient-border-light {
  background: linear-gradient(var(--gradient-angle), rgba(0, 220, 130, 1), white, rgba(54, 228, 218, 0.7), rgba(29, 224, 177, 0.3));
}

.gradient-border-dark {
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

.card-wrapper:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 5s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
}
</style>
