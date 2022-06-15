<template>
  <USelectCustom
    v-model="organization"
    name="organization"
    icon
    :options="organizationsWithPlaceholder"
    size="sm"
    placeholder="Organization"
    value-attribute="key"
    text-attribute="title"
    class="min-w-[192px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { organizations, selectedOrganization } = useCommunityRepositories()

const organizationsWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...organizations.value
])

const organization = computed({
  get () {
    return selectedOrganization.value
  },
  set (organization) {
    router.push({
      name: 'community-repositories',
      query: {
        ...route.query,
        organization: organization?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
