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
      id="senior-certification-nuxt"
      title="Official Nuxt Senior Certification Exam has launched"
      icon="i-lucide-award"
      to="https://certification.nuxt.com"
      target="_blank"
      close
      :actions="[
        {
          label: 'Get Certified',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://certification.nuxt.com'
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
