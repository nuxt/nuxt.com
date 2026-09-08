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
    <!-- <UBanner
      id="mn-nuxt-b"
      title="Black Friday: Get 40% OFF the complete Mastering Nuxt course"
      icon="i-lucide-ticket-percent"
      to="https://masteringnuxt.com/?utm_source=nuxt.com&utm_medium=banner&utm_campaign=nuxt.com"
      target="_blank"
      close
      :actions="[
        {
          label: 'Claim offer',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://masteringnuxt.com/?utm_source=nuxt.com&utm_medium=banner&utm_campaign=nuxt.com'
        }
      ]"
    /> -->

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
