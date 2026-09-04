// Trim /llms.txt to keep it under the ~100K agent context window threshold.
// We drop the v3 (legacy) and v5 (nightly) documentation sections from the
// index — they are still served at their canonical URLs and remain part of
// /llms-full.txt. v4 (current stable) plus blog and deploy guides are the
// most useful starting point for agents.
const TRIMMED_SECTIONS = new Set([
  'Nuxt v3 Documentation',
  'Nuxt v5 Documentation'
])

// nuxt-llms prepends a "Documentation Sets" section for the `full` document, so
// the guidance is pulled back to the front here: what these docs answer is what
// an agent should read before any link list.
const GUIDANCE_SECTION = 'When to use this'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', (_event, options) => {
    options.sections = options.sections.filter((section: { title: string }) => !TRIMMED_SECTIONS.has(section.title))

    const guidance = options.sections.findIndex((section: { title: string }) => section.title === GUIDANCE_SECTION)
    if (guidance > 0) {
      options.sections.unshift(...options.sections.splice(guidance, 1))
    }
  })
})
