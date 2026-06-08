<script setup lang="ts">
import { getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

const props = defineProps<{
  part: ToolPart
}>()

const toolName = computed(() => getToolName(props.part))
</script>

<template>
  <UChatTool
    v-if="toolName === 'web_search'"
    icon="i-lucide-search"
    :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
    :suffix="getSearchQuery(part)"
    :streaming="isToolStreaming(part)"
    chevron="leading"
  >
    <ToolsToolSources :sources="getSources(part)" />
  </UChatTool>

  <ChatToolBlock
    v-else-if="toolName === 'show_module'"
    v-bind="getRichToolHeader(part, 'show_module')"
  >
    <ToolsModuleCard
      v-if="showModuleCard(part)"
      v-bind="moduleCardProps(part.output as ModuleCardData)"
    />
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="toolName === 'show_template'"
    v-bind="getRichToolHeader(part, 'show_template')"
  >
    <div
      v-if="showTemplateCards(part)"
      class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
    >
      <ToolsTemplateCard
        v-for="tpl in getTemplates(part.output)"
        :key="tpl.slug"
        v-bind="tpl"
      />
    </div>
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="toolName === 'show_blog_post'"
    v-bind="getRichToolHeader(part, 'show_blog_post')"
  >
    <ToolsBlogCard
      v-if="showCardOutput(part)"
      v-bind="part.output as BlogCardData"
    />
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="toolName === 'show_hosting'"
    v-bind="getRichToolHeader(part, 'show_hosting')"
  >
    <ToolsHostingCard
      v-if="showCardOutput(part)"
      v-bind="part.output as HostingCardData"
    />
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="toolName === 'open_playground'"
    v-bind="getRichToolHeader(part, 'open_playground')"
  >
    <ToolsPlaygroundCard
      v-if="showPlaygroundCard(part)"
      v-bind="part.output as PlaygroundCardData"
    />
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="toolName === 'report_issue'"
    v-bind="getRichToolHeader(part, 'report_issue')"
  >
    <ToolsFeedbackCard
      v-if="showFeedbackCard(part)"
      :title="getFeedbackOutput(part.output)!.title"
      :summary="getFeedbackOutput(part.output)!.summary"
    />
  </ChatToolBlock>

  <ChatToolBlock
    v-else-if="isModuleListTool(part)"
    v-bind="getMcpToolHeader(part)"
  >
    <div class="flex flex-col gap-2 w-full">
      <ToolsModuleCard
        v-for="mod in getModuleCards(part).filter(isValidModuleCardData)"
        :key="mod.name"
        v-bind="moduleCardProps(mod)"
      />
    </div>
  </ChatToolBlock>

  <UChatTool
    v-else
    v-bind="getMcpToolHeader(part)"
    chevron="leading"
  >
    <pre v-if="getToolOutput(part)" v-text="getToolOutput(part)" />
  </UChatTool>
</template>
