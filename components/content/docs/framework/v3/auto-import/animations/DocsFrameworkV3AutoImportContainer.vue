<template>
  <div class="relative flex">
    <div>
      <svg
        width="756"
        height="367"
        viewBox="0 0 756 367"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="text-gray-800 dark:text-gray-900"
      >
        <rect width="756" height="367" rx="14.2105" fill="currentColor" />
        <rect y="35" width="756" height="1" fill="#3F3F46" />
        <rect
          x="230"
          y="367"
          width="332"
          height="1.00003"
          transform="rotate(-90 230 367)"
          fill="#3F3F46"
        />
        <circle cx="17.4999" cy="17.5" r="5.5" fill="#3F3F46" />
        <circle cx="34.4999" cy="17.5" r="5.5" fill="#3F3F46" />
        <circle cx="52.4999" cy="17.5" r="5.5" fill="#3F3F46" />
        <defs>
          <linearGradient
            id="paint0_linear_4107_49654"
            x1="32"
            y1="90"
            x2="32"
            y2="149.791"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#71717A" />
            <stop offset="1" stop-color="#71717A" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_4107_49654"
            x1="32"
            y1="209"
            x2="32"
            y2="333.649"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#71717A" />
            <stop offset="1" stop-color="#71717A" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <!-- left container -->
      <div class="absolute inset-0 flex pt-[35px] ">
        <div class="w-[330px] relative">
          <div class="absolute flex flex-col text-gray-300 top-4 left-6 gap-y-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components', 'plugins']" :key="index" class="flex items-center gap-x-2">
              <UIcon name="uil:angle-right" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 top-4 left-6 gap-y-4" :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex pt-4 pl-8 gap-x-4">
                <svg
                  width="16"
                  height="20"
                  viewBox="0 0 16 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  :class="{ 'text-green-400': index === 0}"
                >
                  <path d="M16.0002 6.94C15.9898 6.84813 15.9697 6.75763 15.9402 6.67V6.58C15.8922 6.47718 15.828 6.38266 15.7502 6.3V6.3L9.75024 0.3C9.66758 0.222216 9.57306 0.158081 9.47024 0.11H9.38024L9.06024 0H3.00024C2.20459 0 1.44153 0.316071 0.878924 0.87868C0.316315 1.44129 0.000244141 2.20435 0.000244141 3V17C0.000244141 17.7956 0.316315 18.5587 0.878924 19.1213C1.44153 19.6839 2.20459 20 3.00024 20H13.0002C13.7959 20 14.559 19.6839 15.1216 19.1213C15.6842 18.5587 16.0002 17.7956 16.0002 17V7C16.0002 7 16.0002 7 16.0002 6.94ZM10.0002 3.41L12.5902 6H10.0002V3.41ZM14.0002 17C14.0002 17.2652 13.8949 17.5196 13.7074 17.7071C13.5198 17.8946 13.2655 18 13.0002 18H3.00024C2.73503 18 2.48067 17.8946 2.29314 17.7071C2.1056 17.5196 2.00024 17.2652 2.00024 17V3C2.00024 2.73478 2.1056 2.48043 2.29314 2.29289C2.48067 2.10536 2.73503 2 3.00024 2H8.00024V7C8.00024 7.26522 8.1056 7.51957 8.29314 7.70711C8.48067 7.89464 8.73503 8 9.00024 8H14.0002V17Z" fill="currentColor" />
                </svg>
                <span>{{ index === 0 ? 'index.vue' : 'Header.vue' }}</span>
              </div>
              <div class="flex pt-4 pl-8 gap-x-4" :class="index === 0 ? 'hidden' : 'block'">
                <svg
                  width="16"
                  height="20"
                  viewBox="0 0 16 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16.0002 6.94C15.9898 6.84813 15.9697 6.75763 15.9402 6.67V6.58C15.8922 6.47718 15.828 6.38266 15.7502 6.3V6.3L9.75024 0.3C9.66758 0.222216 9.57306 0.158081 9.47024 0.11H9.38024L9.06024 0H3.00024C2.20459 0 1.44153 0.316071 0.878924 0.87868C0.316315 1.44129 0.000244141 2.20435 0.000244141 3V17C0.000244141 17.7956 0.316315 18.5587 0.878924 19.1213C1.44153 19.6839 2.20459 20 3.00024 20H13.0002C13.7959 20 14.559 19.6839 15.1216 19.1213C15.6842 18.5587 16.0002 17.7956 16.0002 17V7C16.0002 7 16.0002 7 16.0002 6.94ZM10.0002 3.41L12.5902 6H10.0002V3.41ZM14.0002 17C14.0002 17.2652 13.8949 17.5196 13.7074 17.7071C13.5198 17.8946 13.2655 18 13.0002 18H3.00024C2.73503 18 2.48067 17.8946 2.29314 17.7071C2.1056 17.5196 2.00024 17.2652 2.00024 17V3C2.00024 2.73478 2.1056 2.48043 2.29314 2.29289C2.48067 2.10536 2.73503 2 3.00024 2H8.00024V7C8.00024 7.26522 8.1056 7.51957 8.29314 7.70711C8.48067 7.89464 8.73503 8 9.00024 8H14.0002V17Z" fill="currentColor" />
                </svg>
                <span>Footer.vue</span>
              </div>
            </div>
          </div>
        </div>
        <!-- right container -->
        <div class="relative w-full">
          <div class="absolute font-mono text-sm italic text-gray-300 top-4 left-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            Open components, composables or plugins
          </div>
        </div>
      </div>
      <!--div class="absolute top-[52px] left-[54px] text-gray-400">
        <span class="absolute transition-opacity duration-300" :class="section1Steps.concat(section3Steps).includes(currentSection) ? 'opacity-100' : 'opacity-0'">pages</span>
        <span class="absolute transition-opacity duration-300" :class="section2Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">components</span>
      </div>
      <div class="absolute top-[100px] left-[88px] text-white">
        <span class="absolute transition-opacity duration-300" :class="section1Steps.concat(section3Steps).includes(currentSection) ? 'opacity-100' : 'opacity-0'">index.vue</span>
        <span class="absolute transition-opacity duration-300" :class="section2Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">Mouse.vue</span>
      </div>
      <div class="absolute top-[47%] left-[52px] text-gray-400">
        <span class="absolute transition-opacity duration-300" :class="section1Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">components</span>
        <span class="absolute transition-opacity duration-300" :class="section2Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">composables</span>
        <span class="absolute transition-opacity duration-300" :class="section3Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">plugins</span>
      </div>
      <div class="absolute top-[218px] left-[88px] text-gray-400">
        <span class="absolute transition-opacity duration-300" :class="section1Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">header.vue</span>
        <span class="absolute transition-opacity duration-300" :class="section2Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">useMouse.js</span>
        <span class="absolute transition-opacity duration-300" :class="section3Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">global.js</span>
      </div>
      <div class="absolute top-[260px] left-[88px] text-gray-400 transition-opacity duration-300" :class="section1Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'">
        footer.vue
      </div>
      <img
        src="/assets/docs/v3/auto-import/components-template.svg"
        class="absolute left-[250px] top-[62px] transition-opacity duration-300"
        :class="section1Steps.includes(currentSection) ? 'opacity-100' : 'opacity-0'"
        alt="Components template header and footer"
      >
      <DocsFrameworkV3AutoImportComponentsScript class="absolute left-[250px] top-1/2" :current-section="currentSection" :steps-section="section1Steps" />
      <DocsFrameworkV3AutoImportComposablesMouse class="absolute left-[250px] top-[62px]" :current-section="currentSection" :steps-section="section2Steps" />
      <DocsFrameworkV3AutoImportPluginsTemplate class="absolute left-[250px] top-[62px]" :current-section="currentSection" :steps-section="section3Steps" />
      <img
        src="/assets/docs/v3/auto-import/container.svg"
        alt="animation container"
        class="absolute inset-0 z-0 text-gray-900 dark:text-gray-800"
        :class="[0, 6, 7, 13, 14].includes(currentSection) ? 'opacity-0' : 'opacity-80 dark:opacity-60'"
      >
    </div-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion'

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  },
  section1Steps: {
    type: Array,
    default: () => []
  },
  section2Steps: {
    type: Array,
    default: () => []
  },
  section3Steps: {
    type: Array,
    default: () => []
  }
})

const secondLineFolder = ref(null)
const secondLineMotion = useMotion(secondLineFolder,
  {
    initial: {
      opacity: 1,
      transition: {
        duration: 500
      }
    },
    in: {
      opacity: 1,
      transition: {
        duration: 500
      }
    },
    out: {
      opacity: 0,
      transition: {
        duration: 500
      }
    }
  }
)

watch(() => props.currentSection, () => {
  if (props.section2Steps.concat(props.section3Steps).includes(props.currentSection)) {
    secondLineMotion.apply('out')
  } else {
    secondLineMotion.apply('in')
  }
})
</script>
