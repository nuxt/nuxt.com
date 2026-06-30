import { Actions, Card, CardText, LinkButton } from 'eve/channels/slack'
import type { PromptCardData } from '../../shared/types/tools.js'
import { truncateForSlackPreview } from '../../shared/utils/ide-deeplinks.js'

export function buildSlackPromptCard(data: Pick<PromptCardData, 'description' | 'prompt' | 'deeplinks'>) {
  return Card({
    children: [
      CardText(`*${data.description}*`),
      CardText(`\`\`\`\n${truncateForSlackPreview(data.prompt)}\n\`\`\``),
      Actions([
        LinkButton({ url: data.deeplinks.cursor, label: 'Open in Cursor' }),
        LinkButton({ url: data.deeplinks.claude, label: 'Open in Claude Code' })
      ])
    ]
  })
}

export function buildSlackPromptFallbackText(data: Pick<PromptCardData, 'description' | 'prompt' | 'deeplinks'>) {
  return [
    `*${data.description}*`,
    `\`\`\`\n${truncateForSlackPreview(data.prompt)}\n\`\`\``,
    `<${data.deeplinks.cursor}|Open in Cursor> · <${data.deeplinks.claude}|Open in Claude Code>`
  ].join('\n')
}
