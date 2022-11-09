<template>
  <USelectCustom
    v-model="version"
    name="version"
    :options="versions"
    :size="size"
    text-attribute="key"
    appearance="invert"
    class="custom-class"
    icon-base-class="text-black"
    list-base-class="absolute right-0 z-10 w-full p-1 mt-1 overflow-auto text-sm rounded-md shadow-lg sm:w-32 u-bg-black max-h-60 ring-1 u-ring-white"
    list-option-active-class="bg-gray-100 u-text-gray-900 dark:bg-gray-900"
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
    router.replace({
      name: 'modules',
      query: {
        ...route.query,
        version: version?.key || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>

<style lang="postcss">
.custom-class > div > button > span {
  @apply text-black
}
</style>
