import mjml2html from 'mjml'
import fs from 'fs-extra'

export const createMailBody = async (body) => {
  const to = {
    Email: 'contact@nuxt.com',
    Name: 'Nuxt Contact'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.firstname} ${body.lastname}`
  }
  const subject = `[Nuxt Contact] ${body.firstname} ${body.lastname} contacted us for ${body.help}`
  const mjml = await fs.readFile('./mjml/templates/contact.mjml', 'utf8')
  const { html } = mjml2html(mjml, { filePath: './mjml' })
  return {
    Messages: [{
      From: to,
      To: [to],
      ReplyTo: replyTo,
      Variables: body,
      TemplateLanguage: true,
      Subject: subject,
      HTMLPart: html
    }]
  }
}
