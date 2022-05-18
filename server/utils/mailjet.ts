import Mailjet from 'node-mailjet'

let _mailjet = null
export function useMailjet () {
  if (!_mailjet) {
    _mailjet = Mailjet.connect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
  }
  return _mailjet
}

export async function sendMail (body) {
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
