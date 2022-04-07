<script setup lang="ts">
import type { PropType } from 'vue'
import { hash } from 'ohash'
import type { Lang } from 'shiki-es'
import { highlightCode, useAsyncData } from '#imports'

const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String as PropType<Lang>,
    default: null
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array as () => number[],
    default: () => []
  }
})

const key = `highlighted-code-${hash([props.code, props.language, props.filename, props.highlights])}`

const { data: highlightedCode } = await useAsyncData(key, () => highlightCode(props.code, { lang: props.language }))
</script>

<template>
  <div class="prose-code w-full group">
    <pre class="bg-gray-800"><code>
      <span
        v-for="(line, lineIndex) in highlightedCode"
        :key="`line-${lineIndex + 1}`"
        class="line"
        :class="{ 'highlight': highlights.includes(lineIndex + 1) }"
      >
        <span
          v-for="(token, tokenIndex) in line"
          :key="`token-${tokenIndex}`"
          :style="{ color: token.color }"
          v-text="token.content"
        />
      </span>
    </code></pre>

    <CopyButton :content="code" class="copy-button opacity-100 transition-all duration-300" />
  </div>
</template>

<style>
.prose {
  li {
    .prose-code {
      @apply my-4;
    }
  }
}
</style>

<style lang="postcss" scoped>
div {
  @apply flex relative;

  /* Style filename span added by @nuxt/content */
  & > .filename {
    @apply group-hover:opacity-0 transition-opacity duration-300 absolute top-0 right-0 z-0 m-1 py-1.5 px-2 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-md font-mono font-medium text-xs leading-none tracking-tight;
  }
}

pre {
  @apply flex-1 p-4 my-0 overflow-x-auto leading-normal bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-100 rounded-lg;
}

code {
  display: flex;
  flex-direction: column;
}

.line {
  display: inline-table;
  min-height: 15px;
}

.group:hover {
  .copy-button {
    @apply opacity-100;
  }
}
</style>
