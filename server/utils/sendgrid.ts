import type { Client } from '@sendgrid/client'
import type { MailService } from '@sendgrid/mail'
import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'

// Init Sendgrid client
let client: Client | null = null
let mail: MailService | null = null

export const useSendgrid = () => {
  const apiKey = process.env.NUXT_SENDGRID_API_KEY || ''
  const listId = process.env.NUXT_SENDGRID_LIST_ID || ''
  // eslint-disable-next-line no-console
  if (!apiKey) { console.warn('[Sengrid] NUXT_SENDGRID_API_KEY missing in environment variables.') }
  // eslint-disable-next-line no-console
  if (!listId) { console.warn('[Sengrid] NUXT_SENDGRID_LIST_ID missing in environment variables.') }
  if (!client) {
    sgClient.setApiKey(apiKey)
    client = sgClient
  }
  if (!mail) {
    sgMail.setApiKey(apiKey)
    mail = sgMail
  }
  return {
    client,
    mail,
    listId
  }
}
