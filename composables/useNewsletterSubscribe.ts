/* Temporary fix before the module's composable is fixed */
export async function useNewsletterSubscribe (email: string) {
  return await $fetch('/api/newsletter/subscribe', {
    body: { email },
    method: 'POST'
  }).catch(e => e.data)
}
