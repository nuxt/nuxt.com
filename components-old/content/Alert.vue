<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  /**
  * @values info, success, warning, danger
  */
  type: {
    type: String as PropType<'info' | 'success' | 'warning' | 'danger'>,
    default: 'info'
  },
  icon: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="alert mt-4 mb-4 rounded-xl px-4 py-3 text-sm" :class="props.type">
    <div class="flex items-center">
      <div v-if="icon" class="mr-2">
        {{ icon }}
      </div>
      <div class="overflow-hidden leading-loose">
        <ContentSlot :use="$slots.default" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.alert :deep(:first-child) {
  margin-top: 0;
}

.alert :deep(:last-child) {
  margin-bottom: 0;
}

/* Light mode */
.alert {
  --tw-border-opacity: 1;
  --tw-bg-opacity: 1;
  --tw-text-opacity: 1;
  border-width: 1px;
  &.info {
    background-color: rgb(217 241 255/var(--tw-bg-opacity));
    border-color: rgb(179 228 255/var(--tw-border-opacity));
    color: rgb(0 144 225/var(--tw-text-opacity));
  }
  &.warning {
    background-color: rgb(253 246 219/var(--tw-bg-opacity));
    border-color: rgb(252 237 183/var(--tw-border-opacity));
    color: rgb(218 172 10/var(--tw-text-opacity));
  }
  &.success {
    background-color: rgb(214 255 238/var(--tw-bg-opacity));
    border-color: rgb(172 255 221/var(--tw-border-opacity));
    color: rgb(0 157 93/var(--tw-text-opacity));
  }
  &.danger {
    background-color: rgb(255 219 217/var(--tw-bg-opacity));
    border-color: rgb(255 183 179/var(--tw-border-opacity));
    color: rgb(225 14 0/var(--tw-text-opacity));
  }
}

/* Dark mode */

.dark .alert {
  --tw-bg-opacity: 0.25;
  &.info {
    background-color: rgb(0 72 112/var(--tw-bg-opacity));
    border-color: rgb(0 36 56/var(--tw-border-opacity));
    color: rgb(141 214 255/var(--tw-text-opacity));
  }
  &.warning {
    background-color: rgb(109 86 5/var(--tw-bg-opacity));
    border-color: rgb(54 43 3/var(--tw-border-opacity));
    color: rgb(252 237 183/var(--tw-text-opacity));
  }
  &.success {
    background-color: rgb(0 94 56/var(--tw-bg-opacity));
    border-color: rgb(0 63 37/var(--tw-border-opacity));
    color: rgb(131 255 204/var(--tw-text-opacity));
  }
  &.danger {
    background-color: rgb(112 7 0/var(--tw-bg-opacity));
    border-color: rgb(56 3 0/var(--tw-border-opacity));
    color: rgb(255 183 179/var(--tw-text-opacity));
  }
}

/* Common */

.alert a {
  border-style: none!important;
  color: currentColor!important;
  font-weight: 600!important;
  text-decoration-line: underline!important;
}
</style>
