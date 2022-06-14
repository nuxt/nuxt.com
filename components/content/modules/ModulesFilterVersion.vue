<template>
  <USelect
    v-model="version"
    name="version"
    :options="versions"
    :size="size"
    text-attribute="label"
    value-attribute="key"
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
    return selectedVersion.value?.key
  },
  set (version) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        version: version || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
