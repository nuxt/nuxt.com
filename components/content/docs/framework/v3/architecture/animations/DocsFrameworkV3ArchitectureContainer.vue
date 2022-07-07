<template>
  <div
    class="w-[666px] h-[394px] shadow-xl rounded-lg flex flex-col py-3 px-4 transtion-colors duration-300"
    :class="[currentSection === 3 ? 'bg-green-400' : 'u-bg-gray-50 backdrop-blur-md bg-opacity-20',
             { 'transition-none': (currentSection !== 3 && currentSection !== null) }]"
  >
    <div
      class="flex items-center justify-between p-4 transition-colors duration-300 rounded-md"
      :class="[currentSection === 2 ? 'bg-green-400' : 'bg-transparent',
               { 'transition-none': (currentSection !== 2 && currentSection !== null) }]"
    >
      <Logo class="w-6 h-4" />
      <ul class="flex gap-x-[22px]">
        <li v-for="(line, index) in 5" :key="index">
          <div class="h-[6px] w-[41px] rounded-md" :class="(currentSection === 2 || currentSection === 3) ? 'bg-white' : 'u-bg-gray-200'" />
        </li>
      </ul>
      <div class="w-[49px] h-[22px]  rounded-md" :class="(currentSection === 2 || currentSection === 3) ? 'bg-white' : 'u-bg-gray-200'" />
    </div>
    <div class="flex flex-col justify-between flex-1 p-4 rounded-md" :class="currentSection === 1 ? 'bg-green-400' : 'bg-transparent'">
      <div class="flex items-center justify-between w-full">
        <div class="self-start">
          <div
            class="w-[170px] h-8 rounded-xl mb-[17px] transition-all duration-300 rounded-xl"
            :class="[(currentSection === 1 || currentSection === 3) ? 'bg-white ' : 'u-bg-gray-200',
                     { 'transition-none': (currentSection !== 1 && currentSection !== 3 && currentSection !== null) }]"
          />
          <div
            class="w-[252px] h-[14px] rounded-xl mb-[9px] transition-all duration-300 rounded-xl"
            :class="[(currentSection === 1 || currentSection === 3) ? 'bg-white ' : 'u-bg-gray-200',
                     { 'transition-none': (currentSection !== 1 && currentSection !== 3 && currentSection !== null) }]"
          />
          <div
            class="w-[199px] h-[14px] rounded-xl transition-colors duration-300 rounded-xl"
            :class="[(currentSection === 1 || currentSection === 3) ? 'bg-white' : 'u-bg-gray-200',
                     { 'transition-none': (currentSection !== 1 && currentSection !== 3 && currentSection !== null) },]"
          />
        </div>
        <div
          class="transition-all duration-300 rounded-xl"
          :class="[
            { 'w-[259px] h-[152px] shadow-xl': currentSection === 0 },
            { 'w-[239px] h-[132px]': currentSection === null || currentSection > 1 },
            { 'shadow-none transition-none': currentSection !== 0 && currentSection !== null },
            currentSection === 0 ? 'bg-green-400' : (currentSection === 1 || currentSection === 3) ? 'bg-white' : 'u-bg-gray-200'
          ]"
        />
      </div>
      <ul class="flex gap-x-[47px]">
        <li v-for="(line, index) in 3" :key="index">
          <div
            class="h-[105px] w-[169px] rounded-xl transition-colors duration-300"
            :class="[(currentSection === 1 || currentSection === 3) ? 'bg-white ' : 'u-bg-gray-200',
                     { 'transition-none': (currentSection !== 1 && currentSection !== 3 && currentSection !== null) }]"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})

watch(() => props.currentSection, () => {
  console.log(props.currentSection)
})
</script>
