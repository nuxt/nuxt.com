<template>
  <USelectCustom
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    class="min-w-[128px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { types, selectedType } = useCommunityJobs()

const typesWithPlaceholder = computed(() => [
  {
    value: '',
    text: 'All'
  },
  ...types.value
])

const type = computed({
  get () {
    return selectedType.value
  },
  set (type) {
    router.push({
      name: 'community-jobs',
      query: {
        ...route.query,
        type: type?.value || undefined
      },
      state: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
