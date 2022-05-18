import mjml2html from 'mjml'
import Mailjet from 'node-mailjet'

// Lateron: provider a useEmailProvider()
let _mailjet = null
export function useMailjet () {
  if (!_mailjet) {
    _mailjet = Mailjet.connect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
  }
  return _mailjet
}

export async function useEmail (name: string): Promise<string> {
  const mjml = await useStorage().getItem(`assets:emails:${name}.mjml`)
  // We don't support mj-include because of Edge environment (mjml2html depends on node fs)
  const { html } = mjml2html(mjml, { ignoreIncludes: true })

  return html
}

export async function sendEmail (body) {
  try {
    // avoid accidental emails on development
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[Mailjet] send email')
      return
    }
    await useMailjet().post('send', { version: 'v3.1' }).request(body)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    throw createError({
      statusCode: 420,
      statusMessage: 'Error while sending the email'
    })
  }
}
