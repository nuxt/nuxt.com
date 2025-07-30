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
      id="mastering-nuxt-v4"
      title="Get the official course for Nuxt 4 and save $50 with code NUXT4RDY"
      icon="i-lucide-book-open"
      to="https://masteringnuxt.com/?utm_source=nuxt&utm_medium=banner&utm_campaign=nuxt4&friend=nuxt"
      target="_blank"
      close
      :actions="[
        {
          label: 'Claim discount',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://masteringnuxt.com/?utm_source=nuxt&utm_medium=banner&utm_campaign=nuxt4&friend=nuxt'
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
