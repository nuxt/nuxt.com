import { hash } from 'ohash'

export function generateConfirmation (email: string) {
  return hash({ email, secret: 'my-super-secret-key-for-nuxt-newsletter' })
}
