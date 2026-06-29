<script setup lang="ts">
import type { ToolUIPart, DynamicToolUIPart, UIMessage } from 'ai'
import { isFileUIPart, isToolUIPart, isReasoningUIPart, isTextUIPart, getToolName } from 'ai'
import { isPartStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
import {
  getFeedbackOutput,
  getModuleCards,
  getRichToolHeader,
  getTemplates,
  normalizeToolName,
  getConnectionSearchSuffix,
  getConnectionSearchToolText,
  getToolIcon,
  getToolSuffix,
  getToolText,
  isConnectionSearchTool,
  isModuleListTool,
  isValidModuleCardData,
  moduleCardProps,
  showCardOutput,
  showFeedbackCard,
  showModuleCard,
  showPlaygroundCard,
  showTemplateCards,
  type ToolPart
} from '../../composables/useChatTools'

defineProps<{
  message: UIMessage
}>()

type ToolPartUnion = ToolUIPart | DynamicToolUIPart

function getToolOutput(part: ToolPartUnion): string | undefined {
  if (part.state !== 'output-available' || !part.output) return undefined

  const output = part.output as Record<string, unknown> | unknown[]

  if (Array.isArray(output)) {
    const lines = output.map((item) => {
      if (!item || typeof item !== 'object') return undefined
      const entry = item as Record<string, unknown>
      const tool = entry.tool ?? entry.qualifiedName
      if (typeof tool !== 'string') return undefined
      const description = typeof entry.description === 'string' ? entry.description : undefined
      return description ? `• ${tool} — ${description}` : `• ${tool}`
    }).filter((line): line is string => Boolean(line))
    if (lines.length > 0) return lines.join('\n')
  }

  const record = output as Record<string, unknown>
  const content = (record.content ?? output) as Array<{ text?: string }> | string

  if (typeof content === 'string') {
    return content || undefined
  }

  if (Array.isArray(content)) {
    const textLines = content.map(c => c.text).filter(Boolean)
    if (textLines.length > 0) return textLines.join('\n')

    const objectLines = content.map((item) => {
      if (!item || typeof item !== 'object') return undefined
      const entry = item as Record<string, unknown>
      const tool = entry.tool ?? entry.qualifiedName
      if (typeof tool !== 'string') return undefined
      const description = typeof entry.description === 'string' ? entry.description : undefined
      return description ? `• ${tool} — ${description}` : `• ${tool}`
    }).filter((line): line is string => Boolean(line))
    if (objectLines.length > 0) return objectLines.join('\n')
  }

  return JSON.stringify(output, null, 2)
}

const streamingCaret = { class: 'inline-block w-2 h-[1em] bg-current align-middle ml-px opacity-80 animate-pulse' }

function resolvedToolName(part: ToolPartUnion): string {
  return normalizeToolName(getToolName(part))
}

function getMessagePagePath(message: UIMessage): string | null {
  const metaPath = (message.metadata as { pagePath?: string } | undefined)?.pagePath
  return typeof metaPath === 'string' && metaPath.length > 0 ? metaPath : null
}

function getUserFileParts(message: UIMessage) {
  return message.parts.filter(isFileUIPart)
}

function getUserTextParts(message: UIMessage) {
  return message.parts.filter((part): part is Extract<UIMessage['parts'][number], { type: 'text' }> =>
    isTextUIPart(part) && part.text.length > 0
  )
}
</script>

<template>
  <div v-if="message.role === 'user'" class="flex flex-col items-start gap-1.5">
    <div v-if="getMessagePagePath(message)" class="flex items-center gap-1 w-fit">
      <img src="/icon.png" alt="Nuxt" class="size-3.5 shrink-0">
      <span class="text-xs text-muted">{{ getMessagePagePath(message)!.replace(/^\//, '') }}</span>
    </div>

    <AgentPasteAttachment
      v-for="(part, index) in getUserFileParts(message)"
      :key="`${message.id}-file-${index}`"
      :attachment="filePartToAttachment(part)"
      variant="preview"
    />

    <p
      v-for="(part, partIndex) in getUserTextParts(message)"
      :key="`${message.id}-text-${partIndex}`"
      class="whitespace-pre-wrap text-sm/6"
    >
      {{ part.text }}
    </p>
  </div>

  <template v-else>
    <template v-for="(part, partIndex) in getMergedParts(message.parts)" :key="`${message.id}-${part.type}-${partIndex}`">
      <UChatReasoning
        v-if="isReasoningUIPart(part)"
        :text="part.text"
        :streaming="isPartStreaming(part)"
        icon="i-lucide-brain"
        chevron="leading"
      >
        <AgentComark
          :markdown="part.text"
          :streaming="isPartStreaming(part)"
          :caret="isPartStreaming(part) ? streamingCaret : false"
        />
      </UChatReasoning>

      <UChatTool
        v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'web_search'"
        icon="i-lucide-search"
        :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
        :suffix="getSearchQuery(part)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <ToolsToolSources :sources="getSources(part)" />
      </UChatTool>

      <UChatTool
        v-else-if="isToolUIPart(part) && isConnectionSearchTool(part as ToolPart)"
        icon="i-lucide-plug"
        :text="getConnectionSearchToolText(part as ToolPart)"
        :suffix="getConnectionSearchSuffix(part as ToolPart)"
        :streaming="isToolStreaming(part)"
      />

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'show_module'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'show_module')" />
        <ToolsModuleCard
          v-if="showModuleCard(part as ToolPart)"
          v-bind="moduleCardProps(part.output as ModuleCardData)"
        />
      </template>

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'show_template'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'show_template')" />
        <div
          v-if="showTemplateCards(part as ToolPart)"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
        >
          <ToolsTemplateCard
            v-for="tpl in getTemplates(part.output)"
            :key="tpl.slug"
            v-bind="tpl"
          />
        </div>
      </template>

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'show_blog_post'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'show_blog_post')" />
        <ToolsBlogCard
          v-if="showCardOutput(part as ToolPart)"
          v-bind="part.output as BlogCardData"
        />
      </template>

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'show_hosting'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'show_hosting')" />
        <ToolsHostingCard
          v-if="showCardOutput(part as ToolPart)"
          v-bind="part.output as HostingCardData"
        />
      </template>

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'open_playground'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'open_playground')" />
        <ToolsPlaygroundCard
          v-if="showPlaygroundCard(part as ToolPart)"
          v-bind="part.output as PlaygroundCardData"
        />
      </template>

      <template v-else-if="isToolUIPart(part) && resolvedToolName(part) === 'report_issue'">
        <UChatTool v-bind="getRichToolHeader(part as ToolPart, 'report_issue')" />
        <ToolsFeedbackCard
          v-if="showFeedbackCard(part as ToolPart) && getFeedbackOutput(part.output)"
          :title="getFeedbackOutput(part.output)!.title"
          :summary="getFeedbackOutput(part.output)!.summary"
        />
      </template>

      <template v-else-if="isToolUIPart(part) && isModuleListTool(part as ToolPart)">
        <UChatTool
          :text="getToolText(part as ToolPart)"
          :suffix="getToolSuffix(part as ToolPart)"
          :icon="getToolIcon(part as ToolPart)"
          :streaming="isToolStreaming(part)"
          chevron="leading"
        />
        <div class="flex flex-col gap-2 w-full">
          <ToolsModuleCard
            v-for="mod in getModuleCards(part as ToolPart).filter(isValidModuleCardData)"
            :key="mod.name"
            v-bind="moduleCardProps(mod)"
          />
        </div>
      </template>

      <UChatTool
        v-else-if="isToolUIPart(part)"
        :text="getToolText(part as ToolPart)"
        :suffix="getToolSuffix(part as ToolPart)"
        :icon="getToolIcon(part as ToolPart)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <pre
          v-if="getToolOutput(part)"
          class="text-xs text-muted whitespace-pre-wrap break-all rounded-md border border-muted bg-muted p-2 max-h-64 overflow-y-auto"
          v-text="getToolOutput(part)"
        />
      </UChatTool>

      <AgentComark
        v-else-if="isTextUIPart(part) && part.text.length > 0"
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
        :caret="isPartStreaming(part) ? streamingCaret : false"
      />
    </template>
  </template>
</template>
