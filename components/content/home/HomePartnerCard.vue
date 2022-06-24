<template>
  <UCard class="rounded-md" body-class="flex flex-col p-4 sm:p-8 gap-y-6 max-w-[519px] max-h-[272px] justify-center" background-class="bg-gray-900">
    <div class="flex items-center gap-x-4">
      <img src="/assets/home/github-card.svg" class="h-[76px] w-[76px]">
      <div>
        <h6 class="pb-2 text-sm font-medium text-white sm:text-base">
          <Markdown :use="$slots.title" unwrap="p" />
        </h6>
        <span class="text-xl font-semibold text-white sm:text-4xl">
          <Markdown :use="$slots.caseStudy" unwrap="p" />
        </span>
      </div>
    </div>
    <p class="text-sm font-medium text-white sm:text-base">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <div class="flex">
      <UButton
        :label="buttonText"
        variant="transparant"
        class="text-white bg-black border border-gray-700 hover:text-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        to="/resources/case-studies/github"
        icon="heroicons-solid:chevron-right"
        size="lg"
        trailing
      />
    </div>

    <HomePartnerPolygon class="hidden sm:block absolute -right-12 -bottom-12 z-[1] u-text-gray-200" />
  </UCard>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: ''
  }
})
</script>
