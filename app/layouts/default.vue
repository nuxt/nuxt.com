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
  <div :class="[(route.path.startsWith('/docs/') || route.path.startsWith('/deploy')) && 'root']">
    <UBanner
      id="nuxt-certification-autumn-2025"
      title="Get 50% OFF on all Official Nuxt Senior Certifications"
      icon="i-lucide-ticket-percent"
      to="https://certificates.dev/nuxt?certification=senior&friend=NUXT"
      target="_blank"
      close
      :actions="[
        {
          label: 'Get certified',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://certificates.dev/nuxt?certification=senior&friend=NUXT'
        }
      ]"
    />

    <Header />

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
