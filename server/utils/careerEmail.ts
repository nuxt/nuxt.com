import mjml2html from 'mjml'
import fs from 'fs-extra'

export const createMailBody = async (body) => {
  const to = {
    Email: 'career@nuxt.com',
    Name: 'Nuxt Career'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.firstname} ${body.lastname}`
  }
  const subject = `[Nuxt Career] ${body.firstname} ${body.lastname} applied for ${body.offer}`
  const mjml = await fs.readFile('./mjml/templates/career.mjml', 'utf8')
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
