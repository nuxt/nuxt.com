<template>
  <li>
    <UCard
      class="h-28"
      :background-class="cardClass"
      :body-class="gradient ? 'h-full px-4 sm:px-6 lg:px-20' : secondaries ? 'group h-28': 'px-4 py-5 sm:p-6'"
    >
      <div v-if="gradient" class="flex h-full text-center justify-between items-center text-white text-sm sm:text-md md:text-lg font-semibold">
        <span>#00DC82</span>
        <span>#36E4DA</span>
        <span>#0047E1</span>
      </div>
      <div v-if="secondaries" class="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex h-full justify-between items-end text-gray-900 text-sm p-2">
        <span class="pl-1 text-gray-900">{{ hexaColor }}</span>
        <UButton variant="transparent" base-class="py-0" @click="onClick">
          <span class="text-sm -mr-2 text-gray-900">
            Copy
          </span>
        </UButton>
      </div>
    </UCard>
    <div v-if="!gradient && !secondaries">
      <div class="flex justify-between items-center">
        <h5 class="font-bold u-text-gray-900">
          <Markdown use="color" unwrap="p" />
        </h5>
        <UButton variant="transparent" @click="onClick">
          <span class="u-text-gray-400 text-sm -mr-4">
            Copy
          </span>
        </UButton>
      </div>
      <p class="u-text-gray-400">
        {{ hexaColor }}
      </p>
    </div>
    <div v-if="$slots.gradientContent" class="u-text-gray-400 pt-2">
      <Markdown use="gradientContent" unwrap="p" />
    </div>
  </li>
</template>
<script setup lang="ts">
defineProps({
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
  $clipboard.copy(
    props.hexaColor,
    {
      title: 'Color copied to clipboard!'
    }
  )
}
</script>
