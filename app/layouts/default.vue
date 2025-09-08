<script setup lang="ts">
const route = useRoute()
const heroBackgroundClass = computed(() => route.meta?.heroBackground || '')
const { isLoading } = useLoadingIndicator()

const appear = ref(false)
const appeared = ref(false)
onMounted(() => {
  setTimeout(() => {
    appear.value = true
    setTimeout(() => {
      appeared.value = true
    }, 1000)
  }, 0)
})
</script>

<template>
  <div>
    <UBanner
      id="aidd-event-sep-10"
      title="Sep 10: Free AI-Driven Development Event for Vue & Nuxt Developers"
      icon="i-lucide-calendar"
      to="https://aidd.io/ai-driven-development-day?utm_source=nuxt&utm_medium=website&utm[…]aign=affiliate&utm_content=top_banner&banner_type=top&friend=NUXThttps://aidd.io/ai-driven-development-day?utm_source=nuxt&utm_medium=website&utm_campaign=affiliate&utm_content=top_banner&banner_type=top&friend=NUXT"
      target="_blank"
      close
      :actions="[
        {
          label: 'Save my seat',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://aidd.io/ai-driven-development-day?utm_source=nuxt&utm_medium=website&utm_campaign=affiliate&utm_content=top_banner&banner_type=top&friend=NUXT'
        }
      ]"
    />

    <AppHeader />

    <UMain class="relative">
      <HeroBackground
        class="absolute w-full -top-px transition-all text-primary shrink-0 -z-10"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? heroBackgroundClass : 'opacity-0'),
          appeared ? 'duration-[400ms]' : 'duration-1000'
        ]"
      />

      <NuxtPage />
    </UMain>

    <AppFooter />
  </div>
</template>
