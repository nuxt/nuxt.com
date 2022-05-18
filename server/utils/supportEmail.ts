import mjml2html from 'mjml'
import fs from 'fs-extra'

export const createMailBody = async (body) => {
  const to = {
    Email: 'support@nuxt.com',
    Name: 'Nuxt Support'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.name}`
  }
  const subject = `[Nuxt Support] ${body.name} needs support`
  const mjml = await fs.readFile('./mjml/templates/support.mjml', 'utf8')
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
