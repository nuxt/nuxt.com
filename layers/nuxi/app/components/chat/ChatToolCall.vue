<script setup lang="ts">
import { getToolName } from 'ai'
import {
  blogCardProps, hostingCardProps, nuxterCardProps, playgroundCardProps,
  getFeedbackOutput, getModuleCards, getPromptOutput, getTemplates,
  hasToolOutput, isValidModuleCardData, moduleCardProps, normalizeToolName,
  showCardOutput, showFeedbackCard, showModuleCard, showPromptCard, showTemplateCards,
  type ToolPart
} from '../../composables/useChatTools'

const props = defineProps<{ part: ToolPart }>()
const name = computed(() => normalizeToolName(getToolName(props.part)))
const moduleCards = computed(() => getModuleCards(props.part).filter(isValidModuleCardData))
</script>

<template>
  <Transition
    enter-from-class="opacity-0"
    enter-active-class="transition-opacity duration-150 motion-reduce:transition-none"
  >
    <div v-if="hasToolOutput(part)" class="empty:hidden">
      <template v-if="name === 'show_module'">
        <ToolsModuleCard
          v-if="showModuleCard(part)"
          v-bind="moduleCardProps(part.output as ModuleCardData)"
        />
      </template>

      <template v-else-if="name === 'show_template'">
        <div
          v-if="showTemplateCards(part)"
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3 w-full"
        >
          <ToolsTemplateCard
            v-for="tpl in getTemplates(part.output)"
            :key="tpl.slug"
            v-bind="tpl"
          />
        </div>
      </template>

      <template v-else-if="name === 'show_blog_post'">
        <ToolsBlogCard
          v-if="showCardOutput(part) && blogCardProps(part.output)"
          v-bind="blogCardProps(part.output)!"
        />
      </template>

      <template v-else-if="name === 'show_hosting'">
        <ToolsHostingCard
          v-if="showCardOutput(part) && hostingCardProps(part.output)"
          v-bind="hostingCardProps(part.output)!"
        />
      </template>

      <template v-else-if="name === 'show_nuxter'">
        <ToolsNuxterCard
          v-if="showCardOutput(part) && nuxterCardProps(part.output)"
          v-bind="nuxterCardProps(part.output)!"
        />
      </template>

      <template v-else-if="name === 'open_playground'">
        <ToolsPlaygroundCard
          v-if="showCardOutput(part) && playgroundCardProps(part.output)"
          v-bind="playgroundCardProps(part.output)!"
        />
      </template>

      <template v-else-if="name === 'report_issue'">
        <ToolsFeedbackCard
          v-if="showFeedbackCard(part) && getFeedbackOutput(part.output)"
          :title="getFeedbackOutput(part.output)!.title"
          :summary="getFeedbackOutput(part.output)!.summary"
        />
      </template>

      <template v-else-if="name === 'show_prompt'">
        <ToolsPromptCard
          v-if="showPromptCard(part) && getPromptOutput(part.output)"
          :description="getPromptOutput(part.output)!.description"
          :prompt="getPromptOutput(part.output)!.prompt"
          :icon="getPromptOutput(part.output)!.icon"
        />
      </template>

      <template v-else-if="moduleCards.length">
        <div class="flex flex-col gap-2 w-full">
          <ToolsModuleCard
            v-for="mod in moduleCards"
            :key="mod.name"
            v-bind="moduleCardProps(mod)"
          />
        </div>
      </template>
    </div>
  </Transition>
</template>
