<template>
  <UContainer constrained-class="max-w-4xl" padded>
    <div class="flex flex-col items-center py-10 sm:py-20">
      <NuxtLink to="/company/careers" class="flex items-center justify-center font-semibold u-text-gray-500 hover:u-text-gray-900">
        <UIcon name="uil:angle-left-b" class="w-6 h-6" />
        <span class="ml-3">Back to Careers</span>
      </NuxtLink>
      <h1 class="my-6 text-5xl font-semibold u-text-gray-900">
        {{ page.role }}
      </h1>
      <ul class="flex items-center gap-6">
        <li v-for="(info, index) in infos" :key="index" class="flex items-center u-text-gray-600">
          <UIcon :name="info.icon" class="mr-2" />
          <span> {{ info.label }}</span>
        </li>
      </ul>
    </div>

    <ContentRenderer class="prose dark:prose-invert max-w-none" :value="page" />

    <CompanyCareersOfferForm :offer="page.role" class="mt-24 mb-36" />
  </UContainer>
</template>

<script setup lang="ts">
const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

const infos = computed(() => [{
  icon: 'uil:users-alt',
  label: props.page.department
}, {
  icon: 'uil:globe',
  label: props.page.location
}, {
  icon: 'uil:clock-ten',
  label: props.page.frequency
}])
</script>
