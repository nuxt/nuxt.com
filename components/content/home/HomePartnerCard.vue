<template>
  <div class="dark">
    <UCard class="rounded-md" ring-class="" body-class="flex flex-col p-4 sm:p-8 gap-y-6 max-w-[519px] max-h-[272px] justify-center">
      <div class="flex items-center gap-x-4">
        <img src="/assets/home/github-card.svg" class="h-[76px] w-[76px]" width="76" height="76">
        <div>
          <header class="pb-2 text-sm font-medium text-white sm:text-base">
            <ContentSlot :use="$slots.title" unwrap="p" />
          </header>
          <span class="text-xl font-semibold text-white sm:text-4xl">
            <ContentSlot :use="$slots.caseStudy" unwrap="p" />
          </span>
        </div>
      </div>
      <p class="text-sm font-medium text-white sm:text-base">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex">
        <UButton
          :label="buttonText"
          variant="secondary"
          to="/resources/case-studies/github"
          icon="uil:angle-right-b"
          size="lg"
          class="!text-white focus-visible:ring-2"
          trailing
        />
      </div>

      <HomePartnerPolygon class="hidden sm:block absolute -right-12 -bottom-12 z-[1] u-text-gray-200" />
    </UCard>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: ''
  }
})
</script>
