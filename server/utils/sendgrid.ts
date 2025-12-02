import { joinURL } from 'ufo'
import type { H3Event } from 'h3'
import { defu } from 'defu'
import type { SendGridSearchContactsResponse, SendGridAddContactResponse, SendGridEmailResponse } from '../types/sendgrid'

type SendGridResult<T> = 'result' extends keyof T ? T['result'] : T

export const sendgrid = {
  async searchContact(event: H3Event, email: string): Promise<SendGridResult<SendGridSearchContactsResponse>> {
    return sendgridFetch<SendGridSearchContactsResponse>(event, '/marketing/contacts/search/emails', {
      method: 'POST',
      body: {
        emails: [email]
      }
    })
  },
  async addContact(event: H3Event, email: string): Promise<SendGridAddContactResponse> {
    return sendgridFetch<SendGridAddContactResponse>(event, '/marketing/contacts', {
      method: 'PUT',
      body: {
        contacts: [{ email }]
      }
    })
  },
  async sendEmail(event: H3Event, data: SendGridEmail): Promise<SendGridEmailResponse> {
    return sendgridFetch<SendGridEmailResponse>(event, '/mail/send', {
      method: 'POST',
      body: data
    })
  },
  async addContactToList(event: H3Event, email: string, listId: string): Promise<SendGridAddContactResponse> {
    return sendgridFetch<SendGridAddContactResponse>(event, '/marketing/contacts', {
      method: 'PUT',
      body: {
        list_ids: [listId],
        contacts: [{ email }]
      }
    })
  }
}

async function sendgridFetch<T>(event: H3Event, path: string, options = {}): Promise<'result' extends keyof T ? T['result'] : T> {
  type Result = 'result' extends keyof T ? T['result'] : T
  const config = useRuntimeConfig(event)
  if (!config.sendgrid.apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_SENDGRID_API_KEY env variable'
    })
  }

  const url = joinURL(`https://api.sendgrid.com/v3/`, path)
  const res = await $fetch<T & { result?: T }>(url, defu(options, {
    headers: {
      Authorization: `Bearer ${config.sendgrid.apiKey}`
    }
  }))
  if ('result' in res && res.result) {
    return res.result as Result
  }
  return res as Result
}

// https://docs.sendgrid.com/api-reference/mail-send/mail-send#body
interface SendGridEmail {
  from: {
    email: string
    name?: string
  }
  reply_to?: {
    email: string
    name?: string
  }
  personalizations: SendGridEmailPersonalization[]
  subject: string
  content: SendGridEmailContent[]
  template_id?: string
}

// https://docs.sendgrid.com/for-developers/sending-email/personalizations
interface SendGridEmailPersonalization {
  to: {
    email: string
    name?: string
  }[]
  dynamic_template_data?: DynamicTemplateDataSupport
}

interface DynamicTemplateDataSupport {
  name: string
  email: string
  company: string
  body: string
}

interface SendGridEmailContent {
  type: 'text/plain' | 'text/html'
  value: string
}
