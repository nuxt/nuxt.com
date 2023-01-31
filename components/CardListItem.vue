<script setup lang="ts">
defineProps({
  headerClass: {
    type: String,
    default: 'flex justify-between mb-6 pt-2'
  },
  titleClass: {
    type: String,
    default: 'text-xl'
  },
  descriptionClass: {
    type: String,
    default: 'line-clamp-3 mt-2'
  },
  wrapperContentClass: {
    type: String,
    default: ''
  },
  truncate: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: '_self'
  }
})

</script>

<template>
  <UCard padded shadow-class="" class="relative transition duration-200 hover:ring-2 ucard">
    <div v-if="$slots.header" :class="headerClass">
      <slot name="header" />
    </div>
    <div :class="wrapperContentClass">
      <h4 v-if="$slots.title" class="font-semibold u-text-gray-700" :class="[titleClass, {'truncate': truncate}]">
        <slot name="title" />
      </h4>
    </div>
    <p v-if="$slots.description" class="u-text-gray-500" :class="descriptionClass">
      <slot name="description" />
    </p>
    <slot v-if="$slots.footer" name="footer" />

    <NuxtLink :to="to" :target="target">
      <span class="sr-only">Link to {{ to }}</span>
      <span class="absolute inset-0" aria-hidden="true" />
    </NuxtLink>
  </UCard>
</template>

<style scoped lang="postcss">
.ucard:hover {
  --tw-ring-color: #00dc82
}

.ucard:has(a:focus-visible) {
  @apply ring-2;
  --tw-ring-color: #00dc82
}
</style>
