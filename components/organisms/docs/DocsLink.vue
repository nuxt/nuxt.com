<template>
  <component
    :is="disabled ? 'div' : 'u-link'"
    :v-bind="link"
    class="cursor-pointer"
    :class="[isActive ? 'font-semibold u-text-gray-900' : 'font-medium u-text-gray-500']"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  link: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()

const isActive = computed(() => {
  const to = props.link.to.name ? props.link.to.name.split('-')[0] : props.link.to
  return route.path.includes(to)
})

const slug = computed(() => {
  return findSlug(props.link)
})

function findSlug (link) {
  let slug = link.to

  if (link.children && link.children.length) {
    slug = findSlug(link.children[0])
  }

  return slug
}
</script>
