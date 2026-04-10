export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Vary', 'Accept, User-Agent')

  return [
    '---',
    'title: "Nuxt - The Intuitive Vue Framework"',
    'description: "Nuxt is a free and open-source framework to create type-safe, performant and production-grade full-stack web applications and websites with Vue.js."',
    'canonical_url: https://nuxt.com',
    `last_updated: ${new Date().toISOString().split('T')[0]}`,
    '---',
    '',
    '# Nuxt - The Intuitive Vue Framework',
    '',
    'Nuxt is a free and open-source framework with an intuitive and extendable way to create type-safe, performant and production-grade full-stack web applications and websites with Vue.js.',
    '',
    '## Documentation',
    '',
    '- [Getting Started](/docs/4.x/getting-started/introduction) — Introduction to Nuxt',
    '- [Full Documentation Index](/llms.txt) — Complete docs index for AI agents',
    '- [Full Documentation Content](/llms-full.txt) — All docs content in one file',
    '- [Sitemap](/sitemap.md) — Structured index of all pages',
    '',
    '## Sections',
    '',
    '- [Docs](/docs/4.x/getting-started/introduction) — Framework documentation',
    '- [Blog](/blog) — Latest news and articles',
    '- [Modules](/modules) — Explore the module ecosystem',
    '- [Deploy](/deploy) — Deployment guides',
    ''
  ].join('\n')
})
