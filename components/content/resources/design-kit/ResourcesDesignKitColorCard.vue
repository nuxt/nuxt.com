<template>
  <li>
    <AppCard
      padded
      class="h-[140px]"
      shadow-class=""
      ring-class=""
      :background-class="cardClass"
      :body-class="gradient ? 'h-full px-4 sm:px-6 lg:px-20' : secondaries ? 'group h-28': 'px-4 py-5 sm:p-6'"
    >
      <div v-if="gradient" class="flex items-center justify-between h-full text-sm font-semibold text-center text-white sm:text-md md:text-lg">
        <span>#00DC82</span>
        <span>#36E4DA</span>
        <span>#0047E1</span>
      </div>
      <div v-if="secondaries" class="relative flex items-end justify-between h-full p-2 text-sm text-gray-900 transition-opacity duration-200 opacity-100 sm:opacity-0 group-hover:opacity-100">
        <span class="pl-1 text-gray-900">{{ hexaColor }}</span>
        <AppButton variant="transparent" base-class="py-0" @click="onClick">
          <span class="-mr-2 text-sm text-gray-900">
            Copy
          </span>
        </AppButton>
      </div>
    </AppCard>
    <div v-if="!gradient && !secondaries">
      <div class="flex items-center justify-between">
        <h5 class="font-semibold u-text-gray-900">
          <ContentSlot :use="$slots.color" unwrap="p" />
        </h5>
        <AppButton variant="transparent" @click="onClick">
          <span class="-mr-4 text-sm u-text-gray-400">
            Copy
          </span>
        </AppButton>
      </div>
      <p class="u-text-gray-500">
        {{ hexaColor }}
      </p>
    </div>
    <div v-if="$slots.gradientContent" class="pt-2 u-text-gray-400">
      <ContentSlot :use="$slots.gradientContent" unwrap="p" />
    </div>
  </li>
</template>

<script setup lang="ts">
const props = defineProps({
  cardClass: {
    type: String,
    default: ''
  },
  hexaColor: {
    type: String,
    default: ''
  },
  gradient: {
    type: Boolean,
    default: false
  },
  secondaries: {
    type: Boolean,
    default: false
  }
})

const { $clipboard } = useNuxtApp()

const onClick = () => {
  $clipboard.copy(props.hexaColor, { title: 'Color copied to clipboard!' })
}
</script>
