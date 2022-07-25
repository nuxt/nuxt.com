
<template>
  <div class="relative w-[310px] h-[415px] md:w-[701px] md:h-[415px]">
    <img class="absolute right-4 -top-8" src="/assets/docs/v3/routing/gem.svg" alt="gem illustration">
    <div class="relative w-[310px] h-[415px] md:w-[701px] md:h-[415px] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center shadow-xl backdrop-blur-sm bg-opacity-50">
      <div class="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 gap-y-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
        <Logo class="w-[48px] h-[32px]" />
        <div class="w-full h-[6px] bg-gray-200" />
      </div>
      <div
        class="absolute inset-0 flex flex-col items-center justify-start space-y-4 transition-opacity duration-300 top-8 md:top-0 md:justify-center"
        :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[237px] h-[151px]" />
        <div class="w-[181px] h-[21px] bg-gray-200 dark:bg-gray-600 rounded-xl" />
        <div class="flex items-center justify-center space-x-4">
          <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
          <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[56px] h-4" />
        </div>
      </div>

      <div
        class="absolute inset-0 flex flex-col items-center justify-start space-y-2 transition-opacity duration-300 top-2 md:top-0 md:justify-center"
        :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="bg-gray-200 dark:bg-gray-600 rounded-xl w-[300px] h-[143px]" />
        <div v-for="(line, index) in 8" :key="index" class="flex flex-col gap-y-3" :class="index === 0 ? 'w-[100px] self-start ml-1.5 md:ml-[300px]' : 'w-[300px]' ">
          <div class="w-full bg-gray-200 dark:bg-gray-600 h-[11px] rounded-xl" />
        </div>
      </div>

      <div
        class="absolute inset-0 flex transition-opacity duration-300 rounded-l-2xl"
        :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="absolute inset-y-0 left-0 w-[39px] rounded-l-xl h-full" :class="dashboardHovered ? 'bg-green-300' : 'bg-gray-200'" />
        <div
          class="absolute inset-0 flex ml-[39px]"
          :class="[{'rounded-r-md border-4 border-green-600': messageHovered}, {'rounded-r-md bg-green-500 ': dashboardHovered || messageHovered }]"
        >
          <div class="flex flex-col gap-y-[18px] pl-10 md:pl-[28px] pt-7">
            <div class="w-[185px] h-[61px] rounded-xl" :class="dashboardHovered || messageHovered ? 'bg-green-200' : 'bg-gray-200 border-2 border-gray-400'" />
            <div class="hidden sm:block w-[185px] h-[61px] rounded-xl" :class="dashboardHovered || messageHovered ? 'bg-green-200' : 'bg-gray-200'" />
            <div class="hidden md:block w-[185px] h-[61px] rounded-xl" :class="dashboardHovered || messageHovered ? 'bg-green-200' : 'bg-gray-200'" />
          </div>
          <div
            class="absolute left-0 bottom-0 w-[200px] h-[300px] sm:h-[225px] ml-8 flex flex-col items-center justify-start sm:justify-center gap-y-2 md:relative md:w-full md:h-[387px] mt-7 rounded-t-xl md:rounded-br-xl md:rounded-tl-xl md:rounded-tr-none md:ml-[25px] md:grid grid-cols-2 md:px-[53px] md:py-[80px]"
            :class="[(dashboardHovered || messageHovered || idHovered) ? 'bg-green-400 rounded-r-md' : 'bg-gray-200',
                     { 'border-t-4 border-l-4 border-r-none border-b-none border-green-500': idHovered },
                     { 'bottom-2': messageHovered }]"
          >
            <div class="w-[132px] h-8 rounded-3xl mt-8 sm:mt-0 md:mt-[45px]" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
            <div class="w-[132px] h-8 rounded-3xl md:place-self-end md:mb-8" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
            <div class="w-[132px] h-8 rounded-3xl md:mt-8" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
            <div class="hidden sm:block w-[132px] h-8 rounded-3xl md:place-self-end md:mb-8" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
            <div class="hidden md:block w-[212px] h-8 rounded-3xl md:self-end" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
            <div class="hidden md:block w-[80px] h-8 rounded-3xl md:mb-8 md:place-self-end" :class="dashboardHovered || idHovered || messageHovered ? 'bg-green-200' : 'bg-gray-100'" />
          </div>
        </div>
      </div>
      <div
        class="flex flex-col items-center justify-center w-full h-full transition-opacity duration-300 gap-y-6"
        :class="currentSection === 3 && step === 0 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="flex flex-col gap-y-[14px] items-center">
          <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[69px] h-[69px]" />
          <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
          <div class="bg-gray-200 dark:bg-gray-600 rounded-lg w-[225px] h-[23px]" />
        </div>
        <div class="rounded-lg u-bg-gray-300 w-[79px] h-[23px]" />
      </div>
      <div
        class="absolute inset-0 flex w-full h-full transition-opacity duration-300 gap-y-6"
        :class="currentSection === 3 && step === 1 ? 'opacity-100' : 'opacity-0'"
      >
        <div class="absolute inset-y-0 left-0 w-[39px] rounded-l-xl h-full bg-gray-200" />
        <div class="absolute inset-0 left-[60px]">
          <div class="h-[23px] w-[178px] bg-gray-200 mt-8 rounded-xl" />
          <div class="flex gap-x-[34px] mt-8">
            <div class="hidden md:block h-[110px] w-[168px] bg-gray-200 rounded-xl" />
            <div class="h-[110px] w-[230px] md:w-[370px] bg-gray-200 rounded-xl" />
          </div>
          <div class="flex gap-x-[34px] mt-8">
            <div class="hidden md:block h-[110px] w-[168px] bg-gray-200 rounded-xl" />
            <div class="hidden md:block h-[110px] w-[168px] bg-gray-200 rounded-xl" />
            <div class="h-[110px] w-[168px] bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
      <!-- terminal -->
      <div class="absolute -bottom-24 left-8 -bottom-16 md:top-0 sm:left-1/2 md:-left-6 lg:-left-12 w-[230px] h-full md:top-[86px] h-[300px] rounded-md bg-gray-800 px-2 py-4">
        <div class="relative w-full h-full">
          <img class="absolute -bottom-10 right-2" src="/assets/docs/v3/routing/gem-small.png" alt="gem illustration">
          <DocsFrameworkV3RoutingFolder v-if="currentSection === null" class="absolute top-0 left-0 transition-opacity duration-300" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            pages
          </DocsFrameworkV3RoutingFolder>
          <div v-if="currentSection === 0" class="absolute inset-0">
            <DocsFrameworkV3RoutingFolder line chevron-down>
              pages
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-6 text-green-400">
              <span class="text-gray-100">index.vue</span>
            </DocsFrameworkV3RoutingFile>
          </div>
          <div v-if="currentSection === 1" class="absolute inset-0">
            <DocsFrameworkV3RoutingFolder line chevron-down>
              pages
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-4" line chevron-down line-class="inset-y-0 bottom-44 left-[25px] top-[60px]">
              blog
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-6 ml-[36px] mt-1 text-green-400">
              [slug.vue]
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-4 ml-6 text-gray-100">
              index.vue
            </DocsFrameworkV3RoutingFile>
          </div>
          <div v-if="currentSection === 2" class="absolute inset-0">
            <DocsFrameworkV3RoutingFolder line chevron-down>
              pages
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-4">
              blog
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-4" line line-class="inset-y-0 bottom-20 left-[25px] top-[90px]">
              dashboard
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-8" chevron-down line line-class="inset-y-0 bottom-28 left-[41px] top-[116px]">
              message
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-6 ml-[56px] mt-1 text-gray-100 hover:text-green-400" @mouseenter="idHovered = true" @mouseleave="idHovered = false">
              [id.vue]
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-4 ml-[40px] text-gray-100 hover:text-green-400" @mouseenter="messageHovered = true" @mouseleave="messageHovered = false">
              message.vue
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-4 ml-[20px] text-gray-100 hover:text-green-400" @mouseenter="dashboardHovered = true" @mouseleave="dashboardHovered = false">
              dashboard.vue
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-[20px] text-gray-100">
              index.vue
            </DocsFrameworkV3RoutingFile>
          </div>
          <div v-if="currentSection === 3" class="absolute inset-0">
            <DocsFrameworkV3RoutingFolder line chevron-down line-class="inset-y-0 left-2 bottom-20 top-8">
              pages
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-4">
              blog
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFolder class="mt-2 ml-4">
              dashboard
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-[20px] text-orange-300">
              <div class="flex items-center gap-x-2">
                <span>dashboard.vue</span>
                <div class="bg-orange-100 w-[45px] h-[20px] flex gap-x-1 p-0.5 items-center justify-center rounded-md">
                  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.787 3.97583V2.99222C6.787 1.61517 5.70503 0.533203 4.32798 0.533203C2.95093 0.533203 1.86896 1.61517 1.86896 2.99222V3.97583C1.0329 3.97583 0.393555 4.61517 0.393555 5.45124V8.89386C0.393555 9.72993 1.0329 10.3693 1.86896 10.3693H6.787C7.62306 10.3693 8.26241 9.72993 8.26241 8.89386V5.45124C8.26241 4.61517 7.62306 3.97583 6.787 3.97583ZM2.85257 2.99222C2.85257 2.15615 3.49192 1.51681 4.32798 1.51681C5.16405 1.51681 5.80339 2.15615 5.80339 2.99222V3.97583H2.85257V2.99222Z" fill="#E15E00" />
                  </svg>
                  <span class="text-xs text-orange-600">auth</span>
                </div>
              </div>
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-2.5 ml-[20px] text-gray-100">
              login.vue
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFile class="mt-2.5 ml-[20px] text-gray-100">
              index.vue
            </DocsFrameworkV3RoutingFile>
            <DocsFrameworkV3RoutingFolder chevron-down class="mt-4">
              middleware
            </DocsFrameworkV3RoutingFolder>
            <DocsFrameworkV3RoutingFile class="mt-2 ml-[20px] text-gray-100">
              auth.ts
            </DocsFrameworkV3RoutingFile>
          </div>
        </div>
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

const idHovered = ref(false)
const messageHovered = ref(false)
const dashboardHovered = ref(false)
const step = ref(0)
const timeoutId = ref()

watch(() => props.currentSection, () => {
  if (props.currentSection === 3) {
    step.value = 0
    timeoutId.value = setTimeout(() => {
      step.value = 1
    }, 2000)
  } else {
    clearTimeout(timeoutId.value)
  }
})

onUnmounted(() => clearTimeout(timeoutId.value))

</script>
