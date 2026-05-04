<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isToolUIPart, isReasoningUIPart, isTextUIPart, getToolName } from 'ai'
import { isPartStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
import type {
  BlogCardData,
  HostingCardData,
  ModuleCardData,
  PlaygroundCardData,
  TemplateCardData
} from '~/composables/useChatTools'

defineProps<{
  message: UIMessage
}>()

function getTemplates(output: unknown): TemplateCardData[] {
  if (!output || typeof output !== 'object') return []
  const o = output as Record<string, unknown>
  if (Array.isArray(o.templates)) return o.templates as TemplateCardData[]
  return []
}

function hasTemplatesOutput(output: unknown): boolean {
  return getTemplates(output).length > 0
}

type FeedbackOutput = { title: string, summary: string }

function getFeedbackOutput(output: unknown): FeedbackOutput | null {
  if (!output || typeof output !== 'object') return null
  const o = output as Record<string, unknown>
  if (typeof o.title === 'string' && typeof o.summary === 'string') {
    return { title: o.title, summary: o.summary }
  }
  return null
}

function getMessagePagePath(message: UIMessage): string | null {
  const metaPath = (message.metadata as { pagePath?: string } | undefined)?.pagePath
  return typeof metaPath === 'string' && metaPath.length > 0 ? metaPath : null
}
</script>

<template>
  <template v-for="(part, partIndex) in getMergedParts(message.parts)" :key="`${message.id}-${part.type}-${partIndex}`">
    <UChatReasoning
      v-if="isReasoningUIPart(part)"
      :text="part.text"
      :streaming="isPartStreaming(part)"
      icon="i-lucide-brain"
    >
      <AgentComark
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
      />
    </UChatReasoning>

    <template v-else-if="isToolUIPart(part)">
      <UChatTool
        v-if="getToolName(part) === 'web_search'"
        :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
        :suffix="getSearchQuery(part)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <ToolsToolSources :sources="getSources(part)" />
      </UChatTool>
      <template v-else-if="getToolName(part) === 'show_module'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Loading module...' : (part.state === 'output-available' && isValidModuleCardData(part.output) ? 'Found module' : 'Module not found')"
          icon="i-lucide-box"
          :streaming="isToolStreaming(part)"
        />
        <ToolsModuleCard
          v-if="part.state === 'output-available' && isValidModuleCardData(part.output)"
          v-bind="moduleCardProps(part.output as ModuleCardData)"
        />
      </template>
      <template v-else-if="getToolName(part) === 'show_template'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Loading templates...' : (part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error && hasTemplatesOutput(part.output) ? 'Found templates' : 'Templates not found')"
          icon="i-lucide-layout-template"
          :streaming="isToolStreaming(part)"
        />
        <div
          v-if="part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error && hasTemplatesOutput(part.output)"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <ToolsTemplateCard
            v-for="tpl in getTemplates(part.output)"
            :key="tpl.slug"
            v-bind="tpl"
          />
        </div>
      </template>
      <template v-else-if="getToolName(part) === 'show_blog_post'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Finding blog post...' : (part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error ? 'Found blog post' : 'Blog post not found')"
          icon="i-lucide-newspaper"
          :streaming="isToolStreaming(part)"
        />
        <ToolsBlogCard
          v-if="part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error"
          v-bind="part.output as BlogCardData"
        />
      </template>
      <template v-else-if="getToolName(part) === 'show_hosting'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Loading provider...' : (part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error ? 'Found provider' : 'Provider not found')"
          icon="i-lucide-server"
          :streaming="isToolStreaming(part)"
        />
        <ToolsHostingCard
          v-if="part.state === 'output-available' && part.output && !(part.output as Record<string, unknown>).error"
          v-bind="part.output as HostingCardData"
        />
      </template>
      <template v-else-if="getToolName(part) === 'open_playground'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Generating playground...' : 'Playground ready'"
          icon="i-simple-icons-stackblitz"
          :streaming="isToolStreaming(part)"
        />
        <ToolsPlaygroundCard
          v-if="part.state === 'output-available' && part.output"
          v-bind="part.output as PlaygroundCardData"
        />
      </template>
      <template v-else-if="getToolName(part) === 'report_issue'">
        <UChatTool
          :text="isToolStreaming(part) ? 'Preparing feedback form...' : 'Help us improve'"
          icon="i-lucide-message-circle-warning"
          :streaming="isToolStreaming(part)"
        />
        <ToolsFeedbackCard
          v-if="part.state === 'output-available' && getFeedbackOutput(part.output)"
          :title="getFeedbackOutput(part.output)!.title"
          :summary="getFeedbackOutput(part.output)!.summary"
        />
      </template>
      <template v-else-if="(getToolName(part) === 'get-module' || getToolName(part) === 'list-modules') && getModuleCards(part).length">
        <UChatTool
          :text="getToolText(part)"
          :icon="getToolIcon(part)"
          :streaming="isToolStreaming(part)"
          chevron="leading"
        />
        <div class="flex flex-col gap-2">
          <ToolsModuleCard
            v-for="mod in getModuleCards(part).filter(isValidModuleCardData)"
            :key="mod.name"
            v-bind="moduleCardProps(mod)"
          />
        </div>
      </template>
      <UChatTool
        v-else
        :text="getToolText(part)"
        :icon="getToolIcon(part)"
        :streaming="isToolStreaming(part)"
        chevron="leading"
      >
        <pre v-if="getToolOutput(part)" class="text-xs text-dimmed whitespace-pre-wrap break-all" v-text="getToolOutput(part)" />
      </UChatTool>
    </template>

    <template v-else-if="isTextUIPart(part) && part.text.length > 0">
      <AgentComark
        v-if="message.role === 'assistant'"
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
      />
      <div v-else-if="message.role === 'user'">
        <div v-if="getMessagePagePath(message)" class="flex items-center gap-1.5 mb-1.5 rounded-md bg-default/10 px-2 py-1 w-fit">
          <img src="/icon.png" alt="Nuxt" class="size-3.5 shrink-0">
          <span class="text-xs text-default/70">{{ getMessagePagePath(message)!.replace(/^\//, '') }}</span>
        </div>
        <p class="whitespace-pre-wrap text-sm/6">
          {{ part.text }}
        </p>
      </div>
    </template>
  </template>
</template>
