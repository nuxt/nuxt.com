// Trim /llms.txt to keep it under the ~100K agent context window threshold.
// We drop the v3 (legacy) and v5 (nightly) documentation sections from the
// index — they are still served at their canonical URLs and remain part of
// /llms-full.txt. v4 (current stable) plus blog and deploy guides are the
// most useful starting point for agents.
const TRIMMED_SECTIONS = new Set([
  'Nuxt v3 Documentation',
  'Nuxt v5 Documentation'
])

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', (_event, options) => {
    options.sections = options.sections.filter((section: { title: string }) => !TRIMMED_SECTIONS.has(section.title))
  })
})
