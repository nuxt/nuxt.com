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
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components', 'plugins']" :key="index" class="flex items-center gap-x-2">
              <UIcon name="uil:angle-right" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4">
                <UIcon name="uil:file" class="w-6 h-6" :class="index === 0 ? 'text-green-400' : 'text-gray-300'" />
                <span>{{ index === 0 ? 'index.vue' : 'Header.vue' }}</span>
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4" :class="index === 0 ? 'hidden' : 'block'">
                <UIcon name="uil:file" class="w-6 h-6 text-gray-300" />
                <span>Footer.vue</span>
              </div>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['components', 'composables']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4">
                <UIcon name="uil:file" class="w-6 h-6" :class="index === 0 ? 'text-green-400' : 'text-gray-300'" />
                <span>{{ index === 0 ? 'Mouse.vue' : 'useMouse.ts' }}</span>
              </div>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'plugins']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4">
                <UIcon name="uil:file" class="w-6 h-6" :class="index === 0 ? 'text-green-400' : 'text-gray-300'" />
                <span>{{ index === 0 ? 'index.vue' : 'i18n.ts' }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- right container -->
        <div class="relative w-full">
          <div class="absolute font-mono text-sm italic text-gray-300 transition-opacity duration-300 top-4 left-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            Open components, composables or plugins
          </div>
          <div class="absolute font-mono text-gray-300 transition-opacity duration-300 top-4 left-4" :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'">
            <span class="text-gray-300">&lt;template&gt;</span>
            <div v-for="(text, index) in ['Header', 'Footer']" :key="index" class="pl-4">
              <span>&lt;<span class="text-green-400">{{ text }}&nbsp;</span>/&gt;</span>
            </div>
            <span class="text-gray-300">&lt;/template&gt;</span>
          </div>
          <div class="absolute font-mono text-gray-300 transition-opacity duration-300 top-4 left-4" :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'">
            <span class="text-gray-300">&lt;template&gt;</span>
            <br>
            <span class="pl-4 text-gray-300">&nbsp;&lt;p&gt;</span>
            <span class="text-gray-200">Mouse position:&nbsp;</span>
            <span class="text-gray-200">&#123;&#123;&nbsp;</span>
            <span class="text-green-400">x&nbsp;</span>
            <span class="text-gray-200">&#125;&#125;&nbsp;</span>
            <span class="text-gray-200">&#123;&#123;&nbsp;</span>
            <span class="text-green-400">y&nbsp;</span>
            <span class="text-gray-300">&#125;&#125;</span>
            <span class="text-gray-300">&lt;/p&gt;</span>
            <br>
            <span class="text-gray-300">&lt;/template&gt;</span>
            <div class="pt-8">
              <span class="text-gray-300">&lt;script&nbsp;</span>
              <span class="text-green-400">setup</span>
              <span class="text-gray-400">&gt;</span>
              <br>
              <span class="text-blue-600">&nbsp;&nbsp;const&nbsp;</span>
              <span class="text-gray-300">&#123;&nbsp;</span>
              <span class="text-blue-300">x</span>
              <span class="text-gray-300">&#44;&nbsp;</span>
              <span class="text-blue-300">y&nbsp;</span>
              <span class="text-gray-300">&#125;&nbsp;</span>
              <span class="text-blue-600">&#61;&nbsp;</span>
              <span class="text-green-400">useMouse</span>
              <span class="text-gray-300">&#40;</span>
              <span class="text-gray-300">&#41;</span>
              <br>
              <span class="text-gray-300">&lt;/script&gt;</span>
            </div>
          </div>
          <div class="absolute font-mono text-gray-300 transition-opacity duration-300 top-4 left-4" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
            <span class="text-gray-300">&lt;template&gt;</span>
            <br>
            <span class="text-gray-300">&nbsp;&nbsp;&lt;h1&gt;</span>
            <span class="text-gray-200">&#123;&#123;&nbsp;</span>
            <span class="text-green-400">&#36;t&#40;&#39;hello&#39;&#41;&nbsp;</span>
            <span class="text-gray-200">&#125;&#125;</span>
            <span class="text-gray-300">&lt;/h1&gt;</span>
            <br>
            <span class="text-gray-300">&lt;/template&gt;</span>
          </div>
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
