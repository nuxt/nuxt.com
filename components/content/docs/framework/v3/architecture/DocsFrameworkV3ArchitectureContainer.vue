<template>
  <div class="relative w-[300px] h-[420px] md:w-[666px] md:h-[394px]">
    <img src="/assets/docs/v3/architecture/gem-small.svg" class="absolute -left-[40px] bottom-8 z-[2] w-[58px] h-[52px]">
    <img src="/assets/docs/v3/architecture/gem-medium.svg" class="absolute left-[40px] -top-[40px] z-0 w-[116px] h-[104px]">
    <img src="/assets/docs/v3/architecture/gem-medium.svg" class="absolute -right-[40px] bottom-6 z-0 w-[171px] h-[153px]">
    <div
      class="relative w-full h-full shadow-xl rounded-lg flex flex-col py-3 px-4 transtion-colors duration-300 z-[1]"
      :class="currentSection === 3 ? 'bg-green-400' : 'bg-gray-50 dark:bg-gray-900 dark:bg-opacity-50 backdrop-blur-sm bg-opacity-50'"
    >
      <!-- header -->
      <div
        class="relative flex items-center justify-between p-4 duration-300 rounded-md transtion-colors"
        :class="currentSection === 2 ? 'bg-green-400' : 'bg-transparent'"
      >
        <Logo class="w-6 h-4" />
        <ul class="flex gap-x-[22px]">
          <li v-for="(line, index) in 5" :key="index">
            <div
              class="h-[6px] w-[41px] rounded-md transtion-colors duration-300"
              :class="[[2, 3].includes(currentSection) ? 'u-bg-white' : 'u-bg-gray-200', { 'hidden md:block': index % 2 === 0 }]"
            />
          </li>
        </ul>
        <div
          class="hidden md:block w-[49px] h-[22px] rounded-md transtion-colors duration-300"
          :class="[2, 3].includes(currentSection) ? 'u-bg-white' : 'u-bg-gray-200'"
        />
      </div>
      <div
        class="relative flex flex-col justify-between flex-1 p-4 duration-300 rounded-md transtion-colors"
        :class="currentSection === 1 ? 'bg-green-400' : 'bg-transparent'"
      >
        <!-- body -->
        <div class="relative flex flex-col items-center justify-center w-full md:justify-between md:flex-row">
          <div class="self-start">
            <div
              class="w-[150px] md:w-[170px] h-8 rounded-xl mb-[17px] rounded-xl transtion-colors duration-300"
              :class="[1, 3].includes(currentSection) ? 'bg-white' : 'u-bg-gray-200'"
            />
            <div
              class="w-[232px] md:w-[252px] h-[14px] rounded-xl mb-[9px] rounded-xl transtion-colors duration-300"
              :class="[1, 3].includes(currentSection) ? 'bg-white' : 'u-bg-gray-200'"
            />
            <div
              class="w-[179px] md:w-[199px] h-[14px] rounded-xl rounded-xl transtion-colors duration-300"
              :class="[1, 3].includes(currentSection) ? 'bg-white' : 'u-bg-gray-200'"
            />
          </div>
          <div
            class="rounded-xl w-[239px] h-[132px] transtion duration-100 ease mt-6 md:mt-0"
            :class="[
              { 'bg-white': [1, 3].includes(currentSection) },
              { 'scale-[1.15] shadow-xl bg-green-400': currentSection === 0 },
              { 'bg-gray-200': [null, 2].includes(currentSection)}
            ]"
          />
        </div>
        <!-- footer -->
        <ul class="flex justify-between md:gap-x-[47px]">
          <li v-for="(line, index) in 3" :key="index">
            <div
              class="h-[50px] w-[100px] md:h-[105px] md:w-[169px] rounded-xl transtion-colors duration-300"
              :class="[[1, 3].includes(currentSection) ? 'bg-white' : 'u-bg-gray-200', { 'hidden md:block': index % 2 !== 0 }]"
            />
          </li>
        </ul>
      </div>
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
</script>
