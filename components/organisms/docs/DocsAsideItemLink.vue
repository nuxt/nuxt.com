<template>
  <div v-if="link.children && link.children.length" ref="hoverLink" @click="!isSubMenu && getSubMenuNav(link)">
    <span
      class="inline-block py-2 font-medium u-text-gray-500 hover:u-text-gray-900"
      :class="{ 'font-semibold u-text-gray-900': route.path.includes(props.link.to || props.link.slug) }"
    >
      {{ link.title || link.label }}
    </span>
    <slot />
  </div>
  <ULink
    v-else
    :to="link.to || link.slug"
    class="u-text-gray-500 hover:u-text-gray-900"
    active-class="font-semibold u-text-gray-900"
    inactive-class="font-medium"
    :exact="!link.children"
  >
    <span class="inline-block py-2">
      {{ link.title || link.label }}
    </span>
    <slot />
  </ULink>
</template>

<script setup lang="ts">
const props = defineProps({
  link: {
    type: Object,
    required: true
  }
})

const hoverLink = ref(null)

const route = useRoute()

defineEmits(['collapse'])

const { isSubMenu, getSubMenuNav } = useMenu()
</script>
