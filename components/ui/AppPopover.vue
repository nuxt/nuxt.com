<template>
  <HPopover v-slot="{ open, close }" class="relative" @mouseleave="onMouseLeave">
    <HPopoverButton
      ref="trigger"
      as="div"
      :disabled="disabled"
      class="inline-flex w-full"
      role="button"
      @mouseover="onMouseOver"
    >
      <slot :open="open" :close="close">
        <button :disabled="disabled">
          Open
        </button>
      </slot>
    </HPopoverButton>

    <div v-if="open" ref="container" class="z-20" @mouseover="onMouseOver">
      <Transition
        appear
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <HPopoverPanel class="overflow-hidden focus:outline-none bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 rounded-md shadow-lg" static>
          <slot name="panel" :open="open" :close="close" />
        </HPopoverPanel>
      </Transition>
    </div>
  </HPopover>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { defu } from 'defu'
import { Popover as HPopover, PopoverButton as HPopoverButton, PopoverPanel as HPopoverPanel } from '@headlessui/vue'
import { usePopper } from '../../composables/usePopper'
import type { PopperOptions } from '../../types'

const props = defineProps({
  mode: {
    type: String,
    default: 'click',
    validator: (value: string) => {
      return ['click', 'hover'].includes(value)
    }
  },
  disabled: {
    type: Boolean,
    default: false
  },
  openDelay: {
    type: Number,
    default: 50
  },
  closeDelay: {
    type: Number,
    default: 0
  },
  popper: {
    type: Object as PropType<PopperOptions>,
    default: () => ({})
  }
})

const popper = computed<PopperOptions>(() => defu({}, props.popper))

const [trigger, container] = usePopper(popper.value)

// https://github.com/tailwindlabs/headlessui/blob/f66f4926c489fc15289d528294c23a3dc2aee7b1/packages/%40headlessui-vue/src/components/popover/popover.ts#L151
const popoverApi = ref<any>(null)

let openTimeout: NodeJS.Timeout | null = null
let closeTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  setTimeout(() => {
    // @ts-expect-error internals
    const popoverProvides = trigger.value?.$.provides
    if (!popoverProvides) {
      return
    }
    const popoverProvidesSymbols = Object.getOwnPropertySymbols(popoverProvides)
    popoverApi.value = popoverProvidesSymbols.length && popoverProvides[popoverProvidesSymbols[0]]
  }, 200)
})

function onMouseOver () {
  if (props.mode !== 'hover' || !popoverApi.value) {
    return
  }

  // cancel programmed closing
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
  // dropdown already open
  if (popoverApi.value.popoverState === 0) {
    return
  }
  openTimeout = openTimeout || setTimeout(() => {
    popoverApi.value.togglePopover && popoverApi.value.togglePopover()
    openTimeout = null
  }, props.openDelay)
}

function onMouseLeave () {
  if (props.mode !== 'hover' || !popoverApi.value) {
    return
  }

  // cancel programmed opening
  if (openTimeout) {
    clearTimeout(openTimeout)
    openTimeout = null
  }
  // dropdown already closed
  if (popoverApi.value.popoverState === 1) {
    return
  }
  closeTimeout = closeTimeout || setTimeout(() => {
    popoverApi.value.closePopover && popoverApi.value.closePopover()
    closeTimeout = null
  }, props.closeDelay)
}
</script>
