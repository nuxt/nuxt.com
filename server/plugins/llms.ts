import { getAgentDocument } from '#agent-discovery'
import { CURRENT_DOCS_VERSION, DOC_VERSIONS, type DocVersion } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import type { ContentPage } from '../utils/content/pages'

/**
 * `/llms.txt` sections are declared in `nuxt.config.ts` (`llms.sections`) and
 * resolved by nuxt-agent-discovery's comark adapter, which also renders every
 * sectioned page into `/llms-full.txt`. This adds the docs versions the index
 * deliberately leaves out (legacy and nightly), through the same pipeline so
 * the bytes match `/raw/**.md`.
 */
const FULL_ONLY_VERSIONS: DocVersion[] = DOC_VERSIONS.filter(version => version !== CURRENT_DOCS_VERSION)

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate:full', async (event, _options, contents) => {
    for (const version of FULL_ONLY_VERSIONS) {
      for (const key of [docsInstanceKey(version), cliInstanceKey(version)]) {
        const pages = await listInstancePages(key).catch(() => [] as ContentPage[])
        for (const page of pages) {
          const document = await getAgentDocument(event, page.path, { includeExcluded: true })
          if (document && !('redirect' in document)) {
            contents.push(document.markdown)
          }
        }
      }
    }
  })
})
