<script setup lang="ts">
import { filename } from 'pathe/utils'
import type { File } from '~/server/api/example/[...slug].get'

const props = defineProps({
  repo: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    default: 'main'
  },
  dir: {
    type: String,
    default: ''
  },
  file: {
    type: String,
    default: 'app.vue'
  }
})

// TODO: create examples/ prefix on nuxt/starter
const command = computed(() => `npx nuxi init -t "gh:${props.repo}/${props.dir}" ${filename(props.dir)}`)

const icons: Record<string, string> = {
  'package.json': 'vscode-icons:file-type-npm',
  'tsconfig.json': 'vscode-icons:file-type-tsconfig',
  '.eslintrc': 'vscode-icons:file-type-eslint',
  '.eslintrc.cjs': 'vscode-icons:file-type-eslint',
  '.gitignore': 'vscode-icons:file-type-git',
  'yarn.lock': 'vscode-icons:file-type-yarn',
  '.env': 'vscode-icons:file-type-config',
  '.env.example': 'vscode-icons:file-type-config',
  ts: 'vscode-icons:file-type-typescript',
  cjs: 'vscode-icons:file-type-js',
  js: 'vscode-icons:file-type-js',
  md: 'vscode-icons:file-type-markdown',
  ico: 'vscode-icons:file-type-favicon'
}
function getIcon (filename: string) {
  return icons[filename] ?? icons[filename.split('.').pop()!] ?? `vscode-icons:file-type-${filename.split('.').pop()!}`
}

const { data: repoContents } = await useFetch<Record<string, File>>(() => `/api/example/${props.repo}/branch/${props.branch}/dir/${props.dir}`)

const collapsed = ref<string[]>([])
function toggleCollapsed (dir: string) {
  const index = collapsed.value.indexOf(dir)
  if (index === -1) {
    collapsed.value.push(dir)
  } else {
    collapsed.value.splice(index, 1)
  }
}

const files = computed(() => {
  return Object.values(repoContents.value || {})?.filter((file) => {
    return !collapsed.value.some(f => file.path.startsWith(f) && f !== file.path)
  })
})

// TODO: fetch files and links from docs repo
// const significantFiles: string[] = ['app.vue']
const significantFiles: string[] = []

const activeFile = ref((files.value!.find(f => f.name === props.file) ?? files.value!.find(f => f.type !== 'dir')))

function htmlToText (html?: string) {
  if (!html) { return '' }

  return html
    .replace(/<span class="line">/g, '\n')
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

const code = computed(() => repoContents.value && activeFile.value ? htmlToText(repoContents.value[activeFile.value?.path].code) : '')

const RenderCode = defineComponent({
  setup () {
    useHead({
      style: () => activeFile.value?.styles ? [{ innerHTML: activeFile.value.styles }] : []
    })
    return () => h('pre', { class: 'highlighted-code', innerHTML: activeFile.value?.code })
  }
})
</script>

<template>
  <section class="mx-auto max-w-5xl w-full flex flex-col gap-2 sm:gap-4 overflow-hidden">
    <header v-if="$slots.header" class="text-3xl font-bold sm:text-3xl u-text-gray-900">
      <slot name="header" />
    </header>
    <slot name="description" />
    <div class="rounded-lg bg-gray-900 text-gray-200 flex min-h-[500px] max-h-[600px] relative overflow-hidden">
      <div class="hidden md:flex flex-col shrink-0 min-w-[50px]">
        <div class="pt-4 text-sm flex flex-col overflow-y-auto">
          <button
            v-for="item in files"
            :key="item.path"
            class="flex items-center gap-2 py-1 hover:text-white hover:bg-gray-800 pr-1"
            :style="`padding-left: ${1 + (item.path.split('/').length - 1) * 0.5}rem`"
            :class="{
              'text-white bg-gray-800': activeFile === item
            }"
            @click="item.type === 'file' ? activeFile = item : toggleCollapsed(item.path)"
          >
            <Icon :name="item.type === 'dir' ? collapsed.includes(item.path) ? 'uil:folder' : 'uil:folder-open' : getIcon(item.name)" class="w-4 h-4" />
            {{ item.name }}
          </button>
        </div>
        <div class="flex-grow" />
        <NuxtLink :href="`https://github.com/${repo}/tree/${branch}/${dir}`" class="p-4 text-sm gap-2 flex shrink-0 items-center opacity-60 hover:opacity-100 transition-opacity" external target="_blank">
          <Icon name="simple-icons:github" class="w-4 h-4" />
          Open on GitHub
        </NuxtLink>
      </div>
      <div class="border-l-[1px] border-gray-800 flex-grow flex flex-col overflow-hidden">
        <div class="text-sm flex justify-between items-center">
          <div class="flex items-center gap-1 md:gap-2 py-2 px-2 md:py-4 md:px-4 font-semibold text-white flex-grow">
            <USelectCustom
              v-model="activeFile"
              :options="files?.filter(f => f.type === 'file')"
              class="md:hidden flex-grow"
            >
              <UButton
                variant="gray"
                :label="activeFile?.path"
                class="flex-grow"
                trailing-icon="octicon:chevron-down-24"
              />

              <template #option="{ option }">
                <span class="leading-4">{{ option.path }}</span>
              </template>
            </USelectCustom>
            <span class="hidden md:inline">
              {{ activeFile?.name }}
            </span>
          </div>
          <div class="flex">
            <NuxtLink :href="`https://github.com/${repo}/tree/${branch}/${dir}`" external target="_blank" class="md:hidden p-4 text-sm gap-2 flex shrink-0 items-center opacity-60 hover:opacity-100 transition-opacity">
              <Icon name="uil:external-link-alt" class="w-4 h-4" />
              <span class="hide-when-small">Open on GitHub</span>
            </NuxtLink>
            <a v-if="activeFile && significantFiles.includes(activeFile.name)" class="py-4 px-4 flex items-center gap-2">
              <Icon name="uil:question-circle" class="w-4 h-4" />
              <a class="hide-when-small">
                Learn about {{ activeFile.name }}
              </a>
            </a>
          </div>
        </div>
        <div class="p-4 border-t-[1px] border-gray-800 overflow-auto max-w-[100vw] text-sm flex-grow">
          <img v-if="activeFile?.image" :src="activeFile.image">
          <RenderCode v-else />
        </div>
      </div>
      <ProseCodeCopyButton v-if="code" show :content="code" class="absolute right-0 bottom-0" />
    </div>
    <div class="grid grid-columns-3 gap-2 md:flex md:gap-3 md:flex-wrap mt-4 justify-stretch relative">
      <a
        target="_blank"
        :href="`https://stackblitz.com/github/${repo}/tree/${branch}/${dir}`"
        rel="noopener"
        class="button"
      >
        <Icon class="w-4 h-4" alt="" name="simple-icons:stackblitz" />
        Open on StackBlitz
      </a>
      <a
        target="_blank"
        :href="`https://codesandbox.io/s/github/${repo}/tree/${branch}/${dir}`"
        rel="noopener"
        class="button"
      >
        <Icon class="w-4 h-4" alt="" name="simple-icons:codesandbox" />
        Open on CodeSandbox
      </a>
      <button
        class="button"
        :onclick="`navigator.clipboard.writeText('${command}')`"
      >
        <span class="sr-only">Click to copy</span>
        <code class="flex items-center gap-2 line-clamp overflow-hidden truncate text-ellipsis w-full">
          <Icon class="w-4 h-4" alt="" name="bi:terminal" />
          {{ command }}
        </code>
        <span
          class="backdrop-blur bg-white dark:bg-black px-2 absolute bottom-[0.5rem] right-[0.5rem] transition-opacity opacity-0 copy-confirmation pointer-events-none"
          alt=""
        >
          Copied!
        </span>
      </button>
    </div>
  </section>
</template>

<style lang="postcss" scoped>
.button {
  @apply relative text-xs rounded inline-flex gap-2 items-center px-3 py-2 border-[1px] dark:border-white dark:border-opacity-[0.1] transition-all border-r-[1px];
  &:hover {
    @apply border-gray-800 dark:border-gray-200 bg-opacity-[0.2]
  }
}
.button .copy-confirmation {
  transition: 1s;
}
.button .button:active .copy-confirmation {
  opacity: 1;
  transition: 0s;
  right: 1.5rem;
}

@media screen and (max-width: 767px) {
  .hide-when-small {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
}
</style>

<style lang="postcss">
.highlighted-code {
  display: flex;
  flex-direction: column;

  .line:first-child {
    counter-reset: line;
  }

  .line::before {
    counter-increment: line;
    content: counter(line);
    display: inline-block;
    width: 3rem;
    margin-left: -2rem;
    text-align: right;
    margin-right: 1rem;
    color: #666;
  }
}
</style>
