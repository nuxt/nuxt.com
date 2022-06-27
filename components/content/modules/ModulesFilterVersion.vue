<template>
  <USelectCustom
    v-model="version"
    name="version"
    :options="versions"
    :size="size"
    text-attribute="key"
    appearance="invert"
    icon-base-class="u-text-white"
    list-base-class="absolute right-0 z-10 w-full py-1 mt-1 overflow-auto text-sm rounded-md shadow-lg sm:w-32 u-bg-black max-h-60 focus:outline-none ring-1 u-ring-white"
    list-option-active-class="text-white bg-primary-600"
    list-option-inactive-class="u-text-gray-50"
  />
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'xs'
  }
})

const route = useRoute()
const router = useRouter()
const { versions, selectedVersion } = useModules()

const version = computed({
  get () {
    return selectedVersion.value
  },
  set (version) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        version: version?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
