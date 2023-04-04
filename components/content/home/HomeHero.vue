<template>
  <div class="sm:pb-20 pt-12 md:pt-28">
    <img
      src="/assets/home/hero-gradient.svg"
      class="absolute top-0 right-0 hidden overflow-hidden select-none lg:block blur-lg"
      alt=""
      width="1269"
      height="724"
    >
    <img
      src="/assets/home/hero-gradient-tablet.svg"
      alt=""
      class="absolute top-0 right-0 w-full hidden overflow-hidden select-none sm:block lg:hidden blur-md"
      width="924"
      height="653"
    >
    <img
      src="/assets/home/hero-gradient-mobile.svg"
      class="absolute inset-x-0 top-0 w-full overflow-hidden object-cover select-none sm:hidden blur-md"
      alt=""
      width="375"
      height="494"
    >
    <div class="max-w-7xl relative mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center sm:items-start gap-y-8">
      <div v-if="$slots.badgeLabel" class="flex gap-x-2">
        <AppBadge rounded variant="base" color="green">
          <ContentSlot :use="$slots.badgeLabel" unwrap="p" />
        </AppBadge>
        <span>
          <ContentSlot :use="$slots.news" unwrap="p" />
        </span>
      </div>
      <AppButton
        v-if="topButtonText"
        :label="topButtonText"
        :to="topButtonLink"
        size="xs"
        variant="gray"
        truncate
      />
      <h1 v-if="$slots.title" class="relative max-w-2xl text-5xl font-semibold text-center sm:text-left md:text-6xl lg:text-7xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="max-w-lg text-xl text-center text-gray-500 sm:w-3/5 sm:text-left dark:text-gray-100 leading-8">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 z-[1]">
        <AppButton
          :label="primaryButtonText"
          :to="primaryButtonLink"
          size="lg"
          variant="primary-gradient"
          truncate
          class="focus-visible:ring-2"
        />
        <div v-if="$slots.codeCTA" class="code-cta">
          <ContentSlot :use="$slots.codeCTA" unwrap="p" />
        </div>
      </div>
      <!-- <HomeGemWrapper :gem-wrapper-class="'hidden sm:block absolute left-1/3 sm:left-1/3 md:left-1/2 lg:top-[-50px] lg:left-2/3'">
        <HomeGem />
      </HomeGemWrapper> -->
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  topButtonText: {
    type: String,
    default: ''
  },
  topButtonLink: {
    type: String,
    default: ''
  },
  primaryButtonText: {
    type: String,
    default: ''
  },
  primaryButtonLink: {
    type: String,
    default: ''
  },
  secondaryButtonText: {
    type: String,
    default: ''
  },
  secondaryButtonLink: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.code-cta :deep(.prose-code) {
  margin: 0;
}
.code-cta :deep(.prose-code pre) {
  padding: 11px;
}
</style>
