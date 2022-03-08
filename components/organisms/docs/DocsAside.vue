<template>
  <div>
    <ul class="flex flex-col gap-y-4">
      <li v-for="link in links" :key="link.label">
        <ULink :to="link.subLinks ? link.subLinks[0].to : link.to" :exact="false" active-class="font-semibold u-text-gray-900" inactive-class="font-medium u-text-gray-400">
          {{ link.label }}
          <div v-if="link.subLinks" class="flex flex-col mt-2 text-sm">
            <ULink
              v-for="sublink in link.subLinks"
              :key="sublink.label"
              :to="sublink.to"
              class="px-2 py-1 border-l-2"
              active-class="font-semibold u-text-gray-900 u-border-gray-900"
              inactive-class="font-medium u-text-gray-400 u-border-gray-200"
            >
              {{ sublink.label }}
            </ULink>
          </div>
        </ULink>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
defineProps({
  links: {
    type: Array,
    default: () => []
  }
})
</script>
