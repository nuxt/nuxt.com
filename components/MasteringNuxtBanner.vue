<script setup lang="ts">
import VueCountdown from '@chenfengyuan/vue-countdown'

const preferNoMNBanner = () => {
  localStorage.setItem('preferNoMNBanner', 'true')
  document.querySelector('html')?.classList.add('hide-banner')
}
const endDate = +(new Date('2023-03-23T00:00:00Z')) - Date.now()

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-mn-banner',
        innerHTML: `
            if (localStorage.getItem('preferNoMNBanner') === 'true') {
              document.querySelector('html').classList.add('hide-banner')
            }`.replace(/\s+/g, ' '),
        type: 'text/javascript'
      }
    ]
  })
}
</script>

<template>
  <div class="relative w-full bg-white dark:bg-black z-50 border-b border-b-gray-300 dark:border-b-gray-700 mn-banner">
    <div class="flex flex-wrap sm:flex-row justify-start sm:justify-center items-center gap-x-1.5 p-2">
      <p class="text-xs sm:text-sm text-left sm:text-center items-center text-black dark:text-white justify-center items-center pl-[10px] sm:pl-0 pr-10 sm:pr-0">
        👨‍🏫 The <a href="https://masteringnuxt.com/?utm_source=nuxt&utm_medium=website&utm_campaign=affiliate&utm_content=top_banner&friend=nuxt" target="_blank" class="font-bold underline">Mastering Nuxt 3</a> course is now completed!
      </p>
      <a class="text-sm font-semibold bg-green-400 text-black px-2 py-1 rounded" href="https://masteringnuxt.com/?utm_source=nuxt&utm_medium=website&utm_campaign=affiliate&utm_content=top_banner&friend=nuxt" target="_blank">
        {{ endDate > 0 ? 'Claim 30% OFF' : 'Discover the course' }}
      </a>
      <ClientOnly>
        <vue-countdown v-if="endDate > 0" :time="endDate" v-slot="{ days, hours, minutes }">
          <span class="text-sm pl-[10px] sm:pl-0"><span v-if="days > 0">{{ days }} {{ days > 1 ? 'days' : 'day' }}, </span><span v-if="days > 0 || hours > 0">{{ hours }} {{ hours > 1 ? 'hours' : 'hour' }} and</span> {{ minutes }} {{ days > 1 ? 'minutes' : 'minute' }} left</span>
        </vue-countdown>
      </ClientOnly>
      <div class="flex flex-row justify-end absolute inset-y-0 right-4">
        <AppButton class="font-semibold" variant="transparent" size="xs" icon="carbon:close" @click="preferNoMNBanner" />
      </div>
    </div>
  </div>
</template>

<style>
.hide-banner .mn-banner{
  display: none;
}
</style>
