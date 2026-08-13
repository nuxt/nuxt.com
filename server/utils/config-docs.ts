import { upperFirst } from 'scule'

interface Schema {
  tags?: string[]
  title?: string
  description?: string
  type?: string
  default?: unknown
  properties?: Record<string, Schema>
}

const GENERATE_KEY = '<!-- GENERATED_CONFIG_DOCS -->'

function generateMarkdown(schema: Schema, title: string, level: string) {
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
    const keys = Object.keys(schema.properties || {}).sort()
    for (const key of keys) {
      const val = schema.properties[key] as Schema
      const propLines = generateMarkdown(val, `\`${key}\``, `${level}#`)
      if (propLines.length) {
        lines.push('', ...propLines)
      }
    }
  }

  return lines
}

const TAG_REGEX = /^@(\w+)\s/

const TagAlertType: Record<string, string> = {
  note: 'note',
  warning: 'warning',
  deprecated: 'caution'
}

const InternalTypes = new Set([
  'version',
  'deprecated'
])

function formatValue(val: unknown) {
  const stringified = JSON.stringify(val, null, 2)
  if (!stringified || stringified === '{}' || stringified === '[]') {
    return null
  }
  if (stringified.includes('\n')) {
    return ['```json', stringified, '```']
  }
  return [`\`${stringified}\``]
}

function renderTag(tag: string) {
  const type = tag.match(TAG_REGEX)?.[1]
  if (!type) {
    return [`<!-- ${tag} -->`]
  }
  if (InternalTypes.has(type)) {
    return []
  }
  tag = tag.replace(`@${type}`, `**${upperFirst(type)}**:`)
    .replace('js\'node:fs\'', 'js')
  if (TagAlertType[type]) {
    return ['::callout', tag, '::', '']
  }
  return [`${tag}\n`]
}

let schemaPromise: Promise<Schema> | undefined

async function loadNuxt3Schema() {
  schemaPromise ??= fetch('https://unpkg.com/@nuxt/schema@3x/schema/config.schema.json')
    .then(res => res.json() as Promise<Schema>)
  return schemaPromise
}

/** Used by the 3.x docs only — Nuxt 4 dropped `config.schema.json`. */
export async function injectGeneratedConfigDocs(body: string, fileId: string) {
  if (!body.includes(GENERATE_KEY)) {
    return body
  }

  try {
    const rootSchema = await loadNuxt3Schema()
    const start = Date.now()
    console.log(`Generating config docs on ${fileId}`)

    let generatedDocs = ''
    const keys = Object.keys(rootSchema.properties || {}).sort()
    for (const key of keys) {
      const schema = rootSchema.properties?.[key] as Schema | undefined
      if (!schema) continue
      const lines = generateMarkdown(schema, key, '##')
      if (lines.length < 3) continue
      generatedDocs += `${lines.join('\n')}\n`
    }

    console.log(`Config docs generated in ${(Date.now() - start) / 1000} seconds!`)
    return body.replace(GENERATE_KEY, generatedDocs)
  } catch (error) {
    console.error('Could not generate config docs', error)
    schemaPromise = undefined
    return body
  }
}
