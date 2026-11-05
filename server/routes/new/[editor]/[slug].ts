import type { Template } from '#shared/types'

/** nuxt.new's version shortcuts, which bug report templates and the Nuxt docs link to: branches of the minimal starter's repository. */
const VERSION_BRANCHES = ['v3', 'v4']

/** nuxt.new's shortcuts: `/new/s/<slug>` opens a template in StackBlitz, `/new/c/<slug>` in CodeSandbox. */
export default defineEventHandler(async (event) => {
  const editor = getRouterParam(event, 'editor')
  const slug = getRouterParam(event, 'slug') || ''
  const templates = await listByDir<Template>('/templates')
  const minimal = templates.find(template => template.slug === 'minimal')
  const template = VERSION_BRANCHES.includes(slug) && minimal
    ? { ...minimal, branch: slug }
    : templates.find(template => template.slug === slug)

  const url = template && (editor === 's' ? buildStackBlitzUrl(template) : editor === 'c' ? buildCodeSandboxUrl(template) : undefined)
  return sendRedirect(event, url || '/templates', 302)
})
