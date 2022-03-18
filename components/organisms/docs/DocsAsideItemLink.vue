<template>
  <component
    :is="link.children ? 'div' : 'u-link'"
    :v-bind="link"
    class="u-text-gray-500 hover:u-text-gray-900"
    active-class="font-semibold u-text-gray-900"
    inactive-class="font-medium"
    :exact="!link.children"
    @click="!isSubMenu ? subMenu(link) : () => {}"
  >
    <span class="inline-block py-1">
      {{ link.title }}
    </span>
    <slot />
  </component>
</template>

<script setup lang="ts">
defineProps({
  link: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['collapse'])

const { visible, subMenu } = useMenu()

</script>
