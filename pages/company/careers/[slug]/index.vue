<template>
  <UContainer constrained-class="max-w-4xl" class="mt-16" padded>
    <div class="flex flex-col items-center">
      <NuxtLink to="/company/careers" class="flex items-center justify-center text-base font-semibold u-text-gray-400 hover:u-text-gray-500">
        <UIcon name="heroicons-outline:chevron-left" />
        <span class="ml-3">Back to Careers</span>
      </NuxtLink>
      <h1 class="my-6 text-5xl font-bold u-text-gray-800">
        {{ page.role }}
      </h1>
      <ul class="flex">
        <li v-for="(info, index) in infos" :key="index" class="flex items-center mx-2 text-lg u-text-gray-500">
          <UIcon :name="info.icon" class="mr-2" />
          <span> {{ info.label }}</span>
        </li>
      </ul>
    </div>

    <ContentRenderer class="my-24 prose dark:prose-invert" :value="page" />

    <CompanyCareersForm class="mt-24 mb-36" />
  </UContainer>
</template>

<script setup lang="ts">
const { page, fetchPage } = useContent()

await fetchPage()

const infos = computed(() => [{
  icon: 'uil:users-alt',
  label: page.value.department
}, {
  icon: 'uil:globe',
  label: page.value.location
}, {
  icon: 'uil:clock-ten',
  label: page.value.frequency
}])

</script>
