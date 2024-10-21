export default defineNuxtPlugin(() => {
  const toast = useToast()

  useNuxtApp().hook('app:mounted', () => {
    const { email, confirmation } = useRoute().query
    if (email && confirmation) {
      $fetch('https://api.nuxt.com/newsletter/confirm', {
        method: 'POST',
        body: { email, confirmation }
      }).then(() => {
        toast.add({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter.', color: 'green' })
      }).catch((err) => {
        toast.add({ title: 'Subscription failed', description: err.data?.message || '', color: 'red' })
      })
    }
  })
})
