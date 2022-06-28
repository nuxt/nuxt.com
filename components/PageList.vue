<template>
  <div>
    <div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
      <h2 class="items-center justify-between hidden text-3xl font-semibold u-text-gray-900 md:flex">
        <slot name="title">
          {{ title }}
        </slot>
      </h2>

      <button class="flex items-center justify-between font-semibold u-text-gray-900 md:hidden" @click="isOpen = !isOpen">
        <div class="flex items-center">
          <UIcon name="uil:filter" class="w-5 h-5 mr-1.5" />
          <span>Filter (</span>
          <slot name="title">
            {{ title }}
          </slot>
          <span>)</span>
        </div>

        <UIcon :name="isOpen ? 'heroicons-solid:chevron-down' : 'heroicons-solid:chevron-left'" class="w-5 h-5 justify-self-end" />
      </button>

      <div class="flex-col hidden gap-3 md:flex md:flex-row md:items-center">
        <slot name="filters" />
      </div>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-show="isOpen" class="flex flex-col gap-3 md:hidden">
          <slot name="filters" />
        </div>
      </transition>
    </div>

    <div class="min-h-[calc(100vh-18rem)]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: null
  }
})

const isOpen = ref(false)
</script>
