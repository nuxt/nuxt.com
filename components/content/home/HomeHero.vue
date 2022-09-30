<template>
  <div class="pb-20 pt-12 md:pt-28">
    <img src="/assets/home/hero-gradient.svg" class="absolute top-0 right-0 hidden overflow-hidden select-none lg:block">
    <img src="/assets/home/hero-gradient-tablet.svg" class="absolute top-0 right-0 w-full hidden overflow-hidden select-none sm:block lg:hidden">
    <img src="/assets/home/hero-gradient-mobile.svg" class="absolute inset-x-0 top-0 w-full overflow-hidden object-cover select-none sm:hidden min-h-[800px]">
    <UContainer padded class="relative flex flex-col items-center sm:items-start gap-y-8">
      <HomeGemWrapper :gem-wrapper-class="'block sm:hidden'">
        <HomeGem />
      </HomeGemWrapper>
      <div v-if="$slots.badgeLabel" class="flex gap-x-2">
        <UBadge rounded variant="green">
          <ContentSlot :use="$slots.badgeLabel" unwrap="p" />
        </UBadge>
        <span>
          <ContentSlot :use="$slots.news" unwrap="p" />
        </span>
      </div>
      <h1 v-if="$slots.title" class="relative max-w-2xl text-5xl font-semibold text-center sm:text-left md:text-6xl lg:text-7xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
        <span class="lg:hidden">&nbsp;</span>
        <span ref="title" class="transition duration-700 lg:absolute" style="translate: transform(0); opacity: 0">
          <ContentSlot :use="$slots.titleAnimationWord" unwrap="p" />
        </span>
      </h1>
      <p v-if="$slots.description" class="max-w-lg text-lg text-center text-gray-500 sm:w-3/5 sm:text-left dark:text-gray-100">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex gap-6 z-[1]">
        <UButton :label="primaryButtonText" size="lg" variant="primary-gradient" truncate @click="scrollToVideo()" />
        <UButton
          :label="secondaryButtonText"
          size="lg"
          variant="transparent"
          icon="uil:angle-right-b"
          trailing
          target="_blank"
          class="u-text-gray-900"
          truncate
        />
      </div>
      <HomeGemWrapper :gem-wrapper-class="'hidden sm:block absolute left-1/3 sm:left-1/3 md:left-1/2 lg:top-[-50px] lg:left-2/3'">
        <HomeGem />
      </HomeGemWrapper>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const title = ref(null)

defineProps({
  primaryButtonText: {
    type: String,
    default: ''
  },
  secondaryButtonText: {
    type: String,
    default: ''
  }
})

onMounted(() => animateTitle())

const animateTitle = () => {
  setTimeout(() => {
    title.value.style.transform = 'translate(16px)'
    title.value.style.opacity = 1
  }, 500)
}

const scrollToVideo = () => {
  router.push({
    name: 'index',
    query: {
      ...route.query
    },
    state: {
      smooth: '#smooth'
    }
  })
}
</script>
