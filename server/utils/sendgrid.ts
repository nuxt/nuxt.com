import { joinURL } from 'ufo'
import { defu } from 'defu'

export const sendgrid = {
  async searchContact(email: string) {
    return sendgridFetch('/marketing/contacts/search/emails', {
      method: 'POST',
      body: {
        emails: [email]
      }
    })
  },
  async addContact(email: string) {
    return sendgridFetch('/marketing/contacts', {
      method: 'PUT',
      body: {
        contacts: [{ email }]
      }
    })
  },
  async sendEmail(data: SendGridEmail) {
    return sendgridFetch('/mail/send', {
      method: 'POST',
      body: data
    })
  },
  async addContactToList(email: string, listId: string) {
    return sendgridFetch('/marketing/contacts', {
      method: 'PUT',
      body: {
        list_ids: [listId],
        contacts: [{ email }]
      }
    })
  }
}

async function sendgridFetch (path: string, options = {}) {
  if (!process.env.NUXT_SENDGRID_API_KEY) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_SENDGRID_API_KEY env variable'
    })
  }

  const url = joinURL(`https://api.sendgrid.com/v3/`, path)
  const res = await $fetch<any>(url, defu(options, {
    headers: {
      Authorization: `Bearer ${process.env.NUXT_SENDGRID_API_KEY}`
    }
  }))
  if (res.result) {
		return res.result
	}
  return res
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
  }[],
  dynamic_template_data?: DynamicTemplateDataSupport
}

interface DynamicTemplateDataSupport {
  name: string,
  email: string,
  company: string,
  body: string
}


interface SendGridEmailContent {
  type: 'text/plain' | 'text/html'
  value: string
}