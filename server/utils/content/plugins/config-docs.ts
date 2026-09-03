import type { Schema } from 'untyped'
import { createMarkdownParser, parseFrontmatter } from 'comark'
import { upperFirst } from 'scule'
import type { ContentPlugin } from 'comark-content'

/** Marker in the 3.x `nuxt.config` reference (`docs/4.api/6.nuxt-config.md`), the only file carrying one. */
export const CONFIG_DOCS_MARKER = '<!-- GENERATED_CONFIG_DOCS -->'

const SCHEMA_URL = 'https://unpkg.com/@nuxt/schema@3x/schema/config.schema.json'

const TAG_REGEX = /^@(\w+)\s/

const TAG_ALERT_TYPES = new Set(['note', 'warning', 'deprecated'])

/** Describe the schema, not the option. */
const INTERNAL_TAGS = new Set(['version', 'deprecated'])

function formatValue(value: unknown): string[] | null {
  const stringified = JSON.stringify(value, null, 2)
  if (!stringified || stringified === '{}' || stringified === '[]') {
    return null
  }
  return stringified.includes('\n') ? ['```json', stringified, '```'] : ['`' + stringified + '`']
}

function renderTag(tag: string): string[] {
  const type = tag.match(TAG_REGEX)?.[1]
  if (!type) {
    return [`<!-- ${tag} -->`]
  }
  if (INTERNAL_TAGS.has(type)) {
    return []
  }
  const rendered = tag
    .replace(`@${type}`, `**${upperFirst(type)}**:`)
    .replace('js\'node:fs\'', 'js') // hotfix carried over from the original module
  return TAG_ALERT_TYPES.has(type) ? ['::callout', rendered, '::', ''] : [rendered + '\n']
}

function generateMarkdown(schema: Schema, title: string, level: string): string[] {
  const lines: string[] = []

  if (schema.tags?.includes('@private')) {
    return []
  }

  lines.push(`${level} ${title}`, '')

  if (schema.title) {
    lines.push(schema.title, '')
  }
  if (schema.description) {
    lines.push(schema.description, '')
  }

  if (schema.type !== 'object' || !schema.properties) {
    if (schema.type !== 'any') {
      lines.push(`- **Type**: \`${schema.type}\``)
    }
    const defaultValue = formatValue(schema.default)
    if (defaultValue?.length) {
      if (defaultValue.length === 1) {
        lines.push(`- **Default:** ${defaultValue[0]}`)
      } else {
        lines.push('- **Default**', ...defaultValue)
      }
    }
    lines.push('')
  }

  if (schema.tags) {
    lines.push(...schema.tags.flatMap(renderTag))
  }

  if (schema.type === 'object') {
    const properties = schema.properties || {}
    for (const key of Object.keys(properties).sort()) {
      const propLines = generateMarkdown(properties[key] as Schema, `\`${key}\``, level + '#')
      if (propLines.length) {
        lines.push('', ...propLines)
      }
    }
  }

  return lines
}

// Held for the lambda's lifetime so instance rebuilds don't refetch. Failures are not memoized.
let cachedMarkdown: Promise<string> | undefined

/** The markdown that replaces the marker, rendered from the published 3.x schema. */
export function generateConfigDocs(): Promise<string> {
  cachedMarkdown ??= $fetch<Schema>(SCHEMA_URL, { responseType: 'json' })
    .then((rootSchema) => {
      const sections: string[] = []
      const properties = rootSchema.properties || {}
      for (const key of Object.keys(properties).sort()) {
        const lines = generateMarkdown(properties[key] as Schema, key, '##')
        // Heading + blank line only: nothing worth showing.
        if (lines.length < 3) continue
        sections.push(lines.join('\n'))
      }
      return sections.join('\n')
    })
    .catch((error) => {
      cachedMarkdown = undefined
      throw error
    })

  return cachedMarkdown
}

/**
 * Inject the rendered schema into the 3.x `nuxt.config` reference.
 *
 * - Pre-parse: the generated markdown has to reach the TOC and the highlighter.
 * - Mirrors the stock `markdown()` parser, which it overrides (last-wins per extension).
 */
export function configDocs(): ContentPlugin {
  return {
    name: 'nuxt-docs-config-schema',
    setup(content) {
      const parse = createMarkdownParser({ tracer: content.perf, plugins: comarkPlugins })

      content.addParser(['.md', '.markdown'], async ({ read, partial }) => {
        let body = await read()
        if (!body) return null

        // Frontmatter-only load: the marker lives in the body.
        if (partial) {
          return { kind: 'document' as const, data: parseFrontmatter(body).data, partial: true }
        }

        if (body.includes(CONFIG_DOCS_MARKER)) {
          try {
            body = body.replace(CONFIG_DOCS_MARKER, await generateConfigDocs())
          } catch (error) {
            // A page missing its section beats a 500 on the whole instance.
            content.logger.warn('config-docs', 'could not generate the nuxt.config reference:', error)
          }
        }

        const parsed = await parse(body)
        return {
          kind: 'document' as const,
          nodes: parsed.nodes,
          data: parsed.frontmatter,
          meta: parsed.meta,
          partial: false
        }
      })
    }
  }
}
