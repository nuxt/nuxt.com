<template>
  <USelectCustom
    v-model="time"
    name="time"
    icon
    :options="times"
    size="sm"
    value-attribute="key"
    text-attribute="label"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { times, selectedTime } = useCommunityNuxters()

const time = computed({
  get () {
    return selectedTime.value
  },
  set (time) {
    router.push({
      name: 'community-nuxters',
      query: {
        ...route.query,
        time: time?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
