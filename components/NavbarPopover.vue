<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <Popover v-slot="{ open, close }" @mouseleave="onMouseLeave">
    <PopoverButton ref="trigger" :class="[open ? 'u-text-gray-900' : 'u-text-gray-500', isActive(link) ? 'u-text-gray-900 font-semibold' : '', 'group text-sm lg:text-base focus:outline-none font-medium hover:u-text-gray-900 focus:u-text-gray-900 cursor-default']" @mouseover="onMouseOver">
      {{ link.title }}
    </PopoverButton>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel class="absolute z-10 left-1/2 transform -translate-x-1/2 py-6 w-screen px-4 sm:px-6 lg:px-8 max-w-7xl" @mouseover="onMouseOver">
        <div class="rounded-lg shadow-lg ring-1 u-ring-gray-200 overflow-hidden u-bg-white p-8 h-[384px] overflow-hidden">
          <div class="flex items-start gap-6 sm:gap-8">
            <img v-if="link.banner" :src="link.banner">

            <div class="grid gap-6 grid-cols-5 sm:gap-8 flex-1 py-2">
              <div v-for="(child, index) of link.children" :key="index" :class="child.class">
                <p class="font-semibold flex items-center gap-3 u-text-gray-900 mb-3">
                  <UIcon :name="child.icon" class="w-5 h-5" />

                  {{ child.title }}
                </p>

                <ul v-if="child.children?.length" class="space-y-1.5 h-full columns-[145px]">
                  <li v-for="(sublink, subindex) of child.children" :key="subindex">
                    <ULink
                      :to="sublink.slug"
                      :target="sublink.target"
                      class="text-[15px] focus:outline-none"
                      :class="{
                        'u-text-gray-900 font-medium': isActive(sublink),
                        'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': !isActive(sublink),
                      }"
                      @click="close"
                    >
                      {{ sublink.title }}
                    </ULink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

defineProps({
  link: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const route = useRoute()

const trigger = ref(null)
const popoverApi = ref(null)

let openTimeout = null
let closeTimeout = null

onMounted(() => {
  setTimeout(() => {
    const popoverProvides = trigger.value?.$.provides
    const popoverProvidesSymbols = Object.getOwnPropertySymbols(popoverProvides)
    popoverApi.value = popoverProvidesSymbols.length && popoverProvides[popoverProvidesSymbols[0]]
    // stop trigger click propagation on hover
    popoverApi.value.button.addEventListener('click', (e) => {
      e.stopPropagation()
    }, true)
  }, 0)
})

function isActive (link) {
  return link.exact ? route.fullPath === link.slug : route.fullPath.startsWith(link.slug)
}

function onMouseOver () {
  if (!popoverApi.value) {
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
  }, 100)
}

function onMouseLeave () {
  if (!popoverApi.value) {
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
  }, 0)
}
</script>
