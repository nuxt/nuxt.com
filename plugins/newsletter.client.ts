export default defineNuxtPlugin(() => {
  const { $toast } = useNuxtApp()

  useNuxtApp().hook('app:mounted', () => {
    const { email, confirmation } = useRoute().query
    if (email && confirmation) {
      $fetch('/api/newsletter/confirm', {
        method: 'POST',
        body: { email, confirmation }
      }).then(() => {
        $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter.' })
      }).catch((err) => {
        $toast.error({ title: 'Subscription failed', description: err.data?.message || '' })
      })
    }
  })
})
