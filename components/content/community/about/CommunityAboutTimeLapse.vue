<template>
  <div ref="root" class="relative flex items-end w-full pb-32 -mt-40 overflow-hidden lg:-mt-20 lg:overflow-x-auto">
    <div class="hidden lg:inline-block absolute top-[37.5%] min-w-max w-full h-1 bg-gradient-to-l from-green-400 via-teal-400 to-indigoblue-400 duration-[3.3s]" />
    <UContainer class="relative flex w-full lg:justify-center lg:block">
      <ul class="items-center h-[400px] hidden lg:flex">
        <li v-for="(year, index) in 11" :key="index" :class="[{'self-start': [1, 5, 8].includes(index) }, {'self-end': [3, 6, 10].includes(index) }]">
          <div
            v-if="[0, 2, 4, 7, 9].includes(index)"
            class="py-[7px] px-6 text-xl backdrop-blur-lg rounded-[7px] font-semibold u-text-gray-900 lg:transition-all duration-300"

            :class="[currentStep >= index && currentStep !== null ? 'opacity-1' : 'opacity-0',
                     index === 2 ? 'ml-[27px]' : index === 4 ? 'ml-[46px]' : 'ml-[42px]']"
          >
            {{ index === 0 ? 2016 : index === 2 ? 2017 : index === 4 ? 2020 : index === 7 ? 2021 : 2022 }}
          </div>

          <div
            v-if="[1, 3, 5, 6, 8, 10].includes(index)"
            :key="index"
            class="flex flex-col items-center h-[200px]"
            :class="[
              {'flex-col-reverse -translate-y-2': [3, 6, 10].includes(index) },
              {'bg-gradient-to-t translate-y-2.5': [1, 5, 8].includes(index) },
              index === 1 ? 'pl-[16px]' : index === 3 ? 'pl-[21px]' : index === 5 ? 'pl-[37px]' : index === 6 ? 'pl-[83px]' : index === 8 ? 'pl-[45px]' : 'pl-[21px]']"
          >
            <div class="h-[200px]" :class="{ 'rotate-180': [1, 5, 8].includes(index) }">
              <div
                class="w-1 h-0 lg:transition-all duration-1000 -translate-y-1 bg-gradient-to-b"
                :class="[
                  {'h-[180px]': currentStep >= index && currentStep !== null },
                  `${index === 1 ? 'from-[#127ADF]' : index === 3 ? 'from-[#1E9EDE]' : index === 5 ? 'from-[#2ECADC]' : index === 6 ? 'from-[#36E2DB]' : index === 8 ? 'from-[#28E2C3]' : 'from-[#1BE0AE]'} to-white dark:to-black`]"
              />
            </div>
            <svg
              width="17"
              height="19"
              viewBox="0 0 17 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              :class="(currentStep >= index && currentStep !== null) ? 'opacity-1' : 'opacity-0'"
            >
              <path
                d="M16.0829 4.60952L9.91745 0.799922C9.36453 0.468037 8.67569 0.456521 8.11067 0.769716L1.43935 4.40816C0.877778 4.71944 0.523144 5.30463 0.507753 5.9454L0.442443 13.0297C0.427121 13.6677 0.750324 14.2655 1.29242 14.6021L7.58216 18.5067C7.6123 18.5254 7.64286 18.5432 7.6738 18.56C8.17808 18.8335 8.78341 18.8505 9.30303 18.6067C9.3398 18.5894 9.37614 18.5709 9.41198 18.551L15.9341 14.9358C16.5109 14.616 16.8682 14.0081 16.8662 13.3498L16.9564 6.14718C16.9545 5.51687 16.6233 4.93392 16.0829 4.60952Z"
                :fill="index === 1 ? '#127ADF' : index === 3 ? '#1E9EDE' : index === 5 ? '#2ECADC' : index === 6 ? '#36E2DB' : index === 8 ? '#28E2C3' : '#1BE0AE'"
              />
            </svg>
          </div>
        </li>
      </ul>
      <div class="lg:absolute relative top-0 grid lg:grid-cols-3 grid-cols-1 justify-center gap-y-8 lg:gap-y-2 lg:pl-[190px] lg:h-[400px] lg:w-[1000px]">
        <div class="absolute lg:hidden left-4 sm:left-0 md:left-12 h-full w-1 bg-gradient-to-t from-green-400 via-teal-400 to-indigoblue-400" />
        <div class="lg:w-[220px] lg:transition delay-300 duration-300 lg:-ml-3 opacity-1" :class="currentStep !== null ? 'lg:opacity-1' : 'lg:opacity-0'">
          <Markdown :use="$slots.first" unwrap="p" />
        </div>
        <div
          class="lg:w-[320px] lg:pl-[70px] lg:transition lg:duration-1000 lg:delay-400 opacity-1"
          :class="currentStep > 6 ? 'lg:opacity-1' : 'lg:opacity-0'"
        >
          <Markdown :use="$slots.second" unwrap="p" />
        </div>
        <div
          class="lg:w-[320px] lg:pl-[96px] lg:transition lg:duration-1000 lg:delay-400 opacity-1"
          :class="currentStep > 8 ? 'lg:opacity-1' : 'lg:opacity-0'"
        >
          <Markdown :use="$slots.third" unwrap="p" />
        </div>
        <div
          class="lg:w-[360px] lg:pl-[144px] lg:pt-48 lg:transition lg:duration-1000 lg:delay-400 opacity-1"
          :class="currentStep > 3 ? 'lg:opacity-1' : 'lg:opacity-0'"
        >
          <Markdown :use="$slots.fourth" unwrap="p" />
        </div>
        <div
          class="lg:w-[380px] lg:pl-[172px] lg:pt-48 lg:transition lg:duration-1000 lg:delay-400 opacity-1"
          :class="currentStep > 6 ? 'lg:opacity-1' : 'lg:opacity-0'"
        >
          <Markdown :use="$slots.fifth" unwrap="p" />
        </div>
        <div
          class="lg:w-[470px] lg:pl-[270px] lg:pt-48 lg:transition lg:duration-1000 lg:delay-400 opacity-1"
          :class="currentStep > 9 ? 'lg:opacity-1' : 'lg:opacity-0'"
        >
          <Markdown :use="$slots.sixth" unwrap="p" />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const { startStepper, currentStep } = useCounterAnimations()

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>
const startAnimating = ref(false)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting && !startAnimating.value) {
      startAnimating.value = true
      setTimeout(() => {
        startStepper([300, 300, 100, 100, 100, 100, 100, 100, 100, 100, 100], false)
      }, 600)
    }
  })

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => observer.value?.disconnect())
</script>
