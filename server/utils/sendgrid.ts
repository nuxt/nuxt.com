import type { Client } from '@sendgrid/client'
import type { MailService } from '@sendgrid/mail'
import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'

// Init Sendgrid client
let client: Client | null = null
let mail: MailService | null = null

export const useSendgrid = () => {
  const { sendgrid } = useRuntimeConfig()
  // eslint-disable-next-line no-console
  if (!sendgrid.apiKey) { console.warn('[Sengrid] NUXT_SENDGRID_API_KEY missing in environment variables.') }
  // eslint-disable-next-line no-console
  if (!sendgrid.listId) { console.warn('[Sengrid] NUXT_SENDGRID_LIST_ID missing in environment variables.') }
  if (!client) {
    sgClient.setApiKey(sendgrid.apiKey)
    client = sgClient
  }
  if (!mail) {
    sgMail.setApiKey(sendgrid.apiKey)
    mail = sgMail
  }
  return {
    client,
    mail,
    listId: sendgrid.listId || ''
  }
}
