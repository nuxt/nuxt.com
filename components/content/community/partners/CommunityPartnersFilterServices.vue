<template>
  <USelectCustom
    v-if="services.length"
    v-model="service"
    name="service"
    :options="servicesWithPlaceholder"
    size="sm"
    placeholder="Service"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const partnerType: 'technologies' | 'agencies' = inject('partnerType')

const route = useRoute()
const router = useRouter()
const { services, selectedService } = useCommunityPartners(partnerType)

const servicesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...services.value
])

const service = computed({
  get () {
    return selectedService.value
  },
  set (service) {
    router.push({
      name: `community-${partnerType === 'agencies' ? partnerType : 'partners'}`,
      query: {
        ...route.query,
        service: service?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
