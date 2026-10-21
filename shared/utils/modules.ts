import { isValidRange, rangesIntersect } from 'verkit'

/** Whether a module's `compatibility.nuxt` range allows Nuxt 3 or any later major. */
export function supportsNuxt3OrLater(range: string | undefined) {
  return !!range && isValidRange(range) && rangesIntersect(range, '>=3')
}

// Categories renamed or removed in https://github.com/nuxt/modules/pull/1687 (keys are lowercase).
const renamedModuleCategories: Record<string, string> = {
  cms: 'CMS & Content',
  css: 'CSS & Theming',
  database: 'Backend & Database',
  date: 'UI Components',
  ecommerce: 'Ecommerce & Payments',
  extensions: 'Utilities',
  fonts: 'Icons & Fonts',
  images: 'Images & Media',
  libraries: 'Utilities',
  monitoring: 'Monitoring & Logging',
  payment: 'Ecommerce & Payments',
  request: 'API & Data Fetching',
  ui: 'UI Frameworks'
}

/** Maps a former module category name (case-insensitive) to its current name, so old links and API calls keep working. */
export function resolveModuleCategory(category: string) {
  return renamedModuleCategories[category.toLowerCase()] || category
}
