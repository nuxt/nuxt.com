import type { Schema } from 'untyped'
import { upperFirst } from 'scule'

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
    if (defaultValue && defaultValue.length) {
      if (defaultValue.length === 1) {
        lines.push(`- **Default:** ${defaultValue[0]}`)
      } else {
        lines.push('- **Default**', ...defaultValue)
      }
    }
    lines.push('')
  }

  if (schema.tags) {
    lines.push(...schema.tags.map(renderTag).flat())
  }

  if (schema.type === 'object') {
    const properties = schema.properties || {}
    const keys = Object.keys(properties).sort()
    for (const key of keys) {
      const val = properties[key] as Schema
      const propLines = generateMarkdown(val, `\`${key}\``, level + '#')
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

const InternalTypes = new Set(['version', 'deprecated'])

function formatValue(val: unknown) {
  const stringified = JSON.stringify(val, null, 2)
  if (!stringified || stringified === '{}' || stringified === '[]') {
    return null
  }
  if (stringified.includes('\n')) {
    return ['```json', stringified, '```']
  } else {
    return ['`' + stringified + '`']
  }
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
  return [tag + '\n']
}

export default async function schemaToMarkdown(): Promise<string | null> {
  try {
    const rootSchema = await fetch('https://unpkg.com/@nuxt/schema@3x/schema/config.schema.json').then(res => res.json()) as Schema
    const start = Date.now()
    console.log('Generating config docs from schema...')

    const rootProperties = rootSchema.properties || {}
    const keys = Object.keys(rootProperties).sort()
    let generatedDocs = ''

    for (const key of keys) {
      const schema = rootProperties[key]
      if (!schema) continue
      const lines = generateMarkdown(schema, key, '##')
      if (lines.length < 3) continue
      generatedDocs += lines.join('\n') + '\n'
    }

    console.log(`Config docs generated in ${(Date.now() - start) / 1000} seconds!`)
    return generatedDocs
  } catch (err) {
    console.error('Could not generate config docs', err)
    return null
  }
}
