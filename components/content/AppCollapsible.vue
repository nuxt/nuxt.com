<template>
  <div class="flex flex-col gap-4 border-b u-border-gray-200 py-6">
    <button base-class="px-0" class="flex justify-between items-center" @click="isCollapse = !isCollapse">
      <div class="flex flex-col gap-y-4">
        <h4 class="u-text-gray-700 text-2xl font-semibold">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h4>
      </div>
      <Icon :name="!isCollapse ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'" size="24px" />
    </button>
    <Transition>
      <p v-show="!isCollapse" class="u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const isCollapse = ref(true)

</script>

<style lang="postcss">
.v-enter-active,
.v-leave-active {
    max-height: 100vh;
    opacity: 1;
    transition: all 0.3s linear;
}

.v-enter-from,
.v-leave-to {
  max-height: 0;
  opacity: 0;
  transition: all 0.15s linear;
}
</style>
