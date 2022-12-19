<script setup lang="ts">
import { filename } from 'pathe/utils'

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

interface File {
  'type': 'file' | 'dir'
  name: string
  path: string
  content?: string
}

interface Token {
  content: string
  color?: string | { default: string }
  types: string[]
}

const images = ['.ico', '.png', '.jpg']
const isImage = (path?: string) => path && images.some(ext => path.endsWith(ext))

const icons: Record<string, string> = {
  'package.json': 'vscode-icons:file-type-npm',
  'tsconfig.json': 'vscode-icons:file-type-tsconfig',
  ts: 'vscode-icons:file-type-typescript',
  js: 'vscode-icons:file-type-js',
  ico: 'vscode-icons:file-type-favicon'
}
function getIcon (filename: string) {
  return icons[filename] ?? icons[filename.split('.').pop()!] ?? `vscode-icons:file-type-${filename.split('.').pop()!}`
}

const config = useRuntimeConfig()
const github = $fetch.create({
  baseURL: 'https://api.github.com/repos',
  headers: {
    Authorization: config.github?.token ? `Bearer ${config.github.token}` : ''
  }
})

async function fetchFiles (path: string): Promise<File[]> {
  const promises = []
  const files = await github<File[]>(`${props.repo}/contents/${path}`)

  files.sort((a, b) => {
    if (a.type === 'dir' && b.type === 'file') { return -1 }
    if (a.type === 'file' && b.type === 'dir') { return 1 }
    return a.name.localeCompare(b.name)
  })

  for (const file of files) {
    if (file.type === 'dir') {
      promises.push(fetchFiles(file.path).then((newFiles) => {
        const currentIndex = files.indexOf(file)
        files.splice(currentIndex, files.length, file, ...newFiles, ...files.slice(currentIndex + 1))
      }))
    }
    file.path = file.path.replace(`${props.dir}/`, '')
  }

  await Promise.all(promises)
  return files
}

const { data: files } = await useAsyncData(`${props.repo}-${props.dir}`, () => fetchFiles(props.dir), {
  default: () => []
})

// TODO: fetch files and links from docs repo
// const significantFiles: string[] = ['app.vue']
const significantFiles: string[] = []
function getColorProps (token: Token) {
  if (!token.color) {
    return {}
  }
  if (typeof token.color === 'string') {
    return { style: { color: token.color } }
  }
  return { style: { color: token.color.default } }
}

const activeFile = ref((files.value!.find(f => f.name === props.file) ?? files.value!.find(f => f.type !== 'dir')))
const { data: content } = await useAsyncData(`${props.repo}-${props.dir}-${activeFile.value?.path}`, async () => {
  if (!activeFile.value) { return {} }

  const { content } = activeFile.value.content
    ? activeFile.value
    : await github<File>(`${props.repo}/contents/${props.dir}/${activeFile.value.path}`)

  if (isImage(activeFile.value.name)) {
    return {
      image: `data:image/png;base64,${content}`
    }
  }

  const ext = activeFile.value.name.split('.').pop()
  const code = atob(content!)

  return {
    tokens: await $fetch<Token[][]>('/api/_content/highlight', {
      method: 'POST',
      body: {
        code,
        lang: ext,
        theme: 'github-dark'
      }
    })
  }
}, { watch: [activeFile] })

const code = computed(() => content.value?.tokens?.map(l => l.map(t => t.content).join('')).join('\n'))

const RenderCode = defineComponent({
  render () {
    return content.value?.tokens?.map(line => h('pre', { class: 'highlighted-code' }, line.map(token => h('span', getColorProps(token), [token.content])) ?? []))
  }
})
</script>

<template>
  <section class="mx-auto max-w-5xl w-full flex flex-col gap-2 sm:gap-4 overflow-hidden">
    <header v-if="$slots.header" class="text-3xl font-bold sm:text-3xl u-text-gray-900">
      <slot name="header" />
    </header>
    <slot name="description" />
    <div class="grid grid-columns-3 gap-2 md:flex md:gap-3 md:flex-wrap text-xs mt-4 justify-stretch relative">
      <a
        target="_blank"
        :href="`https://stackblitz.com/github/${repo}/tree/${branch}/${dir}`"
        class="open-button"
      >
        <Icon class="w-4 h-4" alt="" name="simple-icons:stackblitz" />
        Open on StackBlitz
      </a>
      <a
        target="_blank"
        :href="`https://codesandbox.io/s/github/${repo}/tree/${branch}/${dir}`"
        class="open-button"
      >
        <Icon class="w-4 h-4" alt="" name="simple-icons:codesandbox" />
        Open on CodeSandbox
      </a>
      <button
        class="open-button"
        :onclick="`navigator.clipboard.writeText('${command}')`"
      >
        <span class="sr-only">Click to copy</span>
        <code class="flex items-center gap-2 line-clamp overflow-hidden truncate text-ellipsis w-full">
          <Icon class="w-4 h-4" alt="" name="bi:terminal" />
          {{ command }}
        </code>
        <span
          class="backdrop-blur bg-white dark:bg-black px-2 absolute bottom-[0.5rem] right-[0.5rem] transition-opacity duration-1000 opacity-0 copy-confirmation pointer-events-none"
          alt=""
        >
          Copied!
        </span>
      </button>
    </div>
    <div class="rounded-lg bg-gray-900 text-gray-200 flex min-h-[500px] max-h-[600px] relative">
      <div class="hidden md:flex flex-col shrink-0 min-w-[50px]">
        <div class="pt-4 px-4 text-sm flex flex-col gap-2">
          <component
            :is="item.type === 'dir' ? 'div' : 'button'"
            v-for="item, index in files"
            :key="item.path"
            class="flex items-center gap-2"
            :style="`padding-left: ${(item.path.split('/').length - 1) * 0.5}rem`"
            :class="{ 'text-white font-bold': activeFile === item, 'mt-1': index && (files![index - 1].type !== item.type || item.path.split('/').length !== files![index - 1].path.split('/').length) }"
            @click="item.type === 'file' ? activeFile = item : null"
          >
            <Icon :name="item.type === 'dir' ? 'uil:folder-open' : getIcon(item.name)" class="w-4 h-4" />
            {{ item.name }}
          </component>
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
          <img v-if="(isImage(activeFile?.name) && content?.image)" :src="content.image">
          <RenderCode v-else />
        </div>
      </div>
      <ProseCodeCopyButton v-if="code" show :content="code" class="absolute right-0 bottom-0" />
    </div>
  </section>
</template>

<style lang="postcss" scoped>
.open-button {
  @apply relative rounded flex gap-2 items-center px-3 py-2 dark:rounded border-[1px] dark:border-white dark:border-opacity-[0.1] transition-all border-r-[1px];
  &:hover {
    @apply border-gray-800 dark:border-gray-200 bg-opacity-[0.2]
  }
}
.highlighted-code:first-child {
  counter-reset: line;
}
.highlighted-code::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 3rem;
  margin-left: -2rem;
  text-align: right;
  margin-right: 1rem;
  color: #666;
}

.copy-confirmation {
  transition: 1s;
}
:active .copy-confirmation {
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
