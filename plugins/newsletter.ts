export default function useNewsletter () {
  const { $toast } = useNuxtApp()
  const client = useStrapiClient()
  const route = useRoute()
  const email = ref('')
  const newsletterResult = ref('')
  const pending = ref(false)

  const apiURL = 'https://api.nuxtjs.org'

  const subscribe = async () => {
    // Cancel empty email
    if (!email.value || !email.value.trim()) { return }

    pending.value = true

    try {
      await client('/api/newsletter/confirm', {
        method: 'POST',
        baseURL: apiURL,
        body: {
          email: email.value
        }
      })
      newsletterResult.value = 'confirm'
    } catch (e) {
      newsletterError(e)
    } finally {
      pending.value = false
    }
  }

  const confirmSubscribtion = async (email) => {
    pending.value = true

    try {
      await client('/api/newsletter/subscribe', {
        baseURL: apiURL,
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: { email }
      })
      newsletterResult.value = 'subscribed'
    } catch (e) {
      newsletterError(e)
    } finally {
      pending.value = false
    }
  }

  if (route.query.hash && route.query.email) {
    confirmSubscribtion(route.query.email)
  }

  const newsletterError = (err) => {
    const { statusCode } = err
    newsletterResult.value = 'failure'

    if (statusCode === 419) { newsletterResult.value = 'member-exists' }
    if (statusCode === 420) { newsletterResult.value = 'sending-error' }
    if (statusCode === 422) { newsletterResult.value = 'invalid-email' }
  }

  const notificationToast = (result) => {
    let notificationOptions = { text: '', type: '', timer: 0 }

    switch (result) {
      case 'failure':
        notificationOptions = {
          text: 'An error occurred',
          type: 'error',
          timer: 4000
        }
        break
      case 'invalid-email':
        notificationOptions = {
          text: 'Invalid address',
          type: 'warning',
          timer: 400000000
        }
        break
      case 'sending-error':
        notificationOptions = {
          text: 'An error occurred while sending confirmation email',
          type: 'warning',
          timer: 4000
        }
        break
      case 'member-exists':
        notificationOptions = {
          text: 'You are already registered',
          type: 'warning',
          timer: 4000
        }
        break
      case 'subscribed':
        notificationOptions = {
          text: 'Email confirmed',
          type: 'success',
          timer: 4000
        }
        break
      case 'confirm':
        notificationOptions = {
          text: 'An email to confirm your subscription has been sent',
          type: 'success',
          timer: 5000
        }
        break
    }

    if (notificationOptions.type === 'success') {
      $toast.success({
        title: 'Success',
        description: notificationOptions.text,
        timeout: notificationOptions.timer
      })
    } else {
      $toast.error({
        title: 'Error',
        description: notificationOptions.text,
        timeout: notificationOptions.timer
      })
    }

    newsletterResult.value = ''
  }

  return {
    email,
    newsletterResult,
    pending,
    subscribe,
    notificationToast
  }
}
