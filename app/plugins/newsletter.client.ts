export default defineNuxtPlugin(() => {
  const toast = useToast()

  useNuxtApp().hook('app:mounted', () => {
    const { email, confirmation } = useRoute().query
    if (email && confirmation) {
      $fetch('/api/newsletter/confirm', {
        method: 'POST',
        body: { email, confirmation }
      }).then(() => {
        toast.add({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter.', color: 'success' })
      }).catch((err) => {
        toast.add({ title: 'Subscription failed', description: err.data?.message || '', color: 'error' })
      })
    }
  })
})
