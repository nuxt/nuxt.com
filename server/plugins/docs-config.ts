import type { Schema } from 'untyped'
import { upperFirst } from 'scule'
import { writeFile } from 'node:fs/promises'

export default defineNitroPlugin((nitroApp) => {
  // @ts-ignore
  nitroApp.hooks.hook('content:file:beforeParse', async (file) => {
    // Disable docs readme
    if (file._id === 'nuxt-docs:docs:README.md') {
      file.body = '---\nnavigation: false\n---'
    }
    // Generate the markdown from the schema
    const GENERATE_KEY = '<!-- GENERATED_CONFIG_DOCS -->'
    if (file.body.includes(GENERATE_KEY)) {
      let generatedDocs = ''
      try {
        const rootSchema = await $fetch<Schema>('https://unpkg.com/@nuxt/schema@latest/schema/config.schema.json')
        const start = Date.now()
        console.log(`Generating config docs on ${file._id}`)

        // @ts-ignore
        const keys = Object.keys(rootSchema.properties).sort()

        if (!file.body.includes(GENERATE_KEY)) {
          return console.warn(`Could not find ${GENERATE_KEY} in ${file._id}`)
        }

        // Generate each section
        for (const key of keys) {
          // @ts-ignore
          const schema = rootSchema.properties[key]

          const lines = generateMarkdown(schema, key, '##')

          // Skip empty sections
          if (lines.length < 3) {
            continue
          }

          // Add lines to new file content
          generatedDocs += lines.join('\n') + '\n'
        }


        file.body = file.body.replace(GENERATE_KEY, generatedDocs)

        console.log(`Config docs generated in ${(Date.now() - start) / 1000} seconds!`)
      } catch (err) {
        console.error('Could not generate config docs', err)
        await writeFile('debug-config-docs.md', generatedDocs)
      }
    }
  })
})

function generateMarkdown (schema: Schema, title: string, level: string) {
  const lines: string[] = []

  // Skip private
  if (schema.tags?.includes('@private')) {
    return []
  }

  // Render heading
  lines.push(`${level} ${title}`, '')

  // Render title
  if (schema.title) {
    lines.push(schema.title, '')
  }

  // Render description
  if (schema.description) {
    lines.push(schema.description, '')
  }

  // Render meta info
  if (schema.type !== 'object' || !schema.properties) {
    // Type and default
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

    // lines.push(`- **Version**: ${versions.join(', ')}`)

    lines.push('')
  }

  // Render @ tags
  if (schema.tags) {
    lines.push(...schema.tags.map(renderTag).flat())
  }

  // Render properties
  if (schema.type === 'object') {
    const keys = Object.keys(schema.properties || {}).sort()
    for (const key of keys) {
      // @ts-ignore
      const val = schema.properties[key] as Schema
      const propLines = generateMarkdown(val, `\`${key}\``, level + '#')
      if (propLines.length) {
        lines.push('', ...propLines)
      }
    }
  }

  return lines
}

const TAG_REGEX = /^@([\d\w]+)[\s\n]/i

const TagAlertType = {
  note: 'info',
  warning: 'warning',
  deprecated: 'danger'
}

const InternalTypes = new Set([
  'version',
  'deprecated'
])

function formatValue (val) {
  const stringified = JSON.stringify(val, null, 2)
  if (!stringified || stringified === '{}' || stringified === '[]') { return null }
  if (stringified.includes('\n')) {
    return ['```json', stringified, '```']
  } else {
    return ['`' + stringified + '`']
  }
}

function renderTag (tag: string) {
  const type = tag.match(TAG_REGEX)?.[1]
  if (!type) {
    return [`<!-- ${tag} -->`]
  }
  if (InternalTypes.has(type)) {
    return []
  }
  tag = tag.replace(`@${type}`, `**${upperFirst(type)}**:`)
    .replace('js\'node:fs\'', 'js') // hotfix
  if (TagAlertType[type]) {
    return ['::callout', tag, '::', '']
  }
  return tag
}
