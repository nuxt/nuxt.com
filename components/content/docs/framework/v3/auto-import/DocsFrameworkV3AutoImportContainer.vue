<template>
  <div class="relative flex">
    <img src="/assets/docs/v3/auto-import/gem.svg" alt="gem illustration" class="absolute -right-16 -bottom-24">
    <div class="relative">
      <div class="h-[500px] md:h-[367px] w-[310px] md:w-[756px] bg-gray-900 rounded-xl backdrop-blur-sm bg-opacity-90">
        <div class="absolute top-3 left-3 flex gap-x-2">
          <div v-for="(dot, index) in 3" :key="index" class="h-3 w-3 rounded-full bg-gray-600" />
        </div>
        <div class="absolute h-[1px] bg-gray-600 top-8 inset-x-0" />
        <div class="absolute h-[1px] bg-gray-600 top-[288px] inset-x-0 md:hidden" />
        <div class="absolute w-[1px] bg-gray-600 left-[220px] top-8 bottom-0 hidden md:block" />
      </div>
      <!-- left container -->
      <div class="absolute inset-0 flex flex-col md:flex-row pt-[35px] ">
        <div class="w-[310px] md:w-[330px] relative">
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components', 'plugins']" :key="index" class="flex items-center gap-x-2">
              <UIcon name="uil:angle-right" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'components']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[20px] md:pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[46px] md:top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
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
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[20px] md:pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[46px] md:top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4">
                <UIcon name="uil:file" class="w-6 h-6" :class="index === 0 ? 'text-green-400' : 'text-gray-300'" />
                <span>{{ index === 0 ? 'Mouse.vue' : 'useMouse.ts' }}</span>
              </div>
            </div>
          </div>
          <div class="absolute flex flex-col text-gray-300 transition-opacity duration-300 top-4 left-6 gap-y-4" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
            <div v-for="(text, index) in ['pages', 'plugins']" :key="index" class="relative">
              <div class="relative flex items-center gap-x-2" :class="{ 'pt-[20px] md:pt-[59px]': index === 1 }">
                <UIcon name="uil:angle-down" class="w-5 h-5 mt-1" /> <span class="font-medium">{{ text }}</span>
                <div class="absolute left-[9px] w-0.5 bg-gradient-to-b from-gray-400 to-transparent" :class="index === 1 ? 'top-[46px] md:top-[89px] h-[109px] ' : 'top-[26px] h-[59px] '" />
              </div>
              <div class="flex items-center pt-4 pl-8 gap-x-4">
                <UIcon name="uil:file" class="w-6 h-6" :class="index === 0 ? 'text-green-400' : 'text-gray-300'" />
                <span>{{ index === 0 ? 'index.vue' : 'i18n.ts' }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- right container -->
        <div class="relative w-full mt-40 md:mt-0">
          <div class="absolute font-mono text-sm italic text-gray-300 transition-opacity duration-300 top-28 md:top-4 left-4" :class="currentSection === null ? 'opacity-100' : 'opacity-0'">
            Open components, composables or plugins
          </div>
          <div class="absolute transition-opacity duration-300 top-28 md:top-4 left-4" :class="currentSection === 0 ? 'opacity-100' : 'opacity-0'">
            <slot name="components" />
          </div>
          <div class="absolute font-mono text-gray-300 transition-opacity duration-300 top-[98px] md:top-4 left-4" :class="currentSection === 1 ? 'opacity-100' : 'opacity-0'">
            <slot name="composablesHtml" />
            <div class="pt-8">
              <slot name="composablesJS" />
            </div>
          </div>
          <div class="absolute font-mono text-gray-300 transition-opacity duration-300 top-28 md:top-4 left-4" :class="currentSection === 2 ? 'opacity-100' : 'opacity-0'">
            <slot name="plugins" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})
</script>
