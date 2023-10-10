export default defineNuxtPlugin(async () => {
  const stats = useStats()

  stats.value = await $fetch('https://api.nuxt.com/stats')
})
