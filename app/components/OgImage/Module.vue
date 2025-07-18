<script lang="ts" setup>
import type { Module } from '~/types'

function moduleImage(icon: string = '') {
  if (!icon) return

  if (/^https?:\/\//.test(icon)) return icon

  return `https://raw.githubusercontent.com/nuxt/modules/main/icons/${icon}`
}

defineProps<{
  module: Module
  headline?: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="size-full flex flex-col justify-center items-center bg-[#020420] py-8">
    <img
      src="data:image/jpeg;base64,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ALCVKAVBbCVBQlQWwVCWwVKlQWwVKlQW5qVBpm2VBpmlQlsFQVCaZGkFQVBUFQVBUVUhUFQtSGpBUBC1AQWCkFQpAItgEKAQCLYAihAgCgEAKIAACFQoAZBQAAAFCAAVKALCUCwVKgFQUFQlBUJUpUFS2VBbBUJUpUFualQVBpCVBUFQW5GkFQVlWpBUFQVBUBC1BUBBULZBUBC2AQWCiFgpBYAi2AIWChABFBKQAAAogAAGQlVKAAALBQgAFSgAFQlS0sFQUIsFSlQlSiwVCUFQVBbCVBbmlQVCW5GkFQVBUFRVQlQVBULUFQWQVBUFgpBUFkFQtgCFQohUAhULYAhYKAAQAoCAAAItQABAEELFVBQAAALBQAgCwVBQAiwUAFQVKiwVBUoCVBUFsFQlQaQVBUFuRpmpUVUFQVBUFQVBUFQVAQtQVBUABBULYhUFQAohUABBUKAIVACiFQAAAogAAAABBmrFVCUAAAAFQVKAAAgFQUACwVCVKALBUFSosFQVBRVRJUVUFQVKVBUFQVCVBUFQVBULUFQWAQVBUFQWCkFQVAIVC1BYAAhYAKAQAAAAoBAAAAIWAAGaFALBUJUFAAAAsFQVKAAgACwVBUoBUJUFAFLBUFQVKgCwVBUFQVBUFAAAAAAQVBUFQWAAIVC1BYABBUFQWACkFQVAAAACiFgAAAAAEKAsAZBoAAABUFQlSgAAAAFQUAAAIABUFQUACwVCVBUFQUAAFQVBUFQVBUFQVBUFQVBYAAABBUFQVCgACFQVAAACgCFQVAAAAAAAQWCgAABkGgAAAAACwVKAgAAAAAFQVBUoAACAALBUFQVKAAAAAALBUFQVBUFQVAAFBAAUAAQVBYAAAAKAIVAAAAAAAAIVKAsURYAAAABgGgAAAAAAAAFQVCUAAAAAAAACwVBUFQUAUEAgUAAAsFQVAsFQVBYAAAAAAAAKQVBUFQVBUAAAAAAAAAAi1AAAAAAAAAAGQUAFBAUAAEAAAAAVFVBUoAACAAAAAAAALBUFQVBUFQVBUFQVBUFQVBUFQVBUFQWAAAAAAAAAAAACggKQVAAAAAAAAAAAAAGQaAAAAAAAAAAAAAAAAALBYFQUAAAAAAIAAAAAAAAAAAAAAAAAAAItSgIAQtQUABBUAAAAAAAAAAAAAAAAAAZBoAAAAAAAAAAAAAAAAAAAAAAABUFQVABUFQUhUoAQVBUFSgBBUFQVBUFgAAAAAAAAAABQAAAAQAAAFAAAAAAAAABgGgAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZBoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBAUAAAAAAAAAAAAGAaAAAAAAABQQAAAAAAAAFBAUAEBQAAQFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZBqgAAAAAAAAAAAAAAAgAAKAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAoIAAAAAACgAAgAAAKAAAAAAGYGgKAAAAAAAAAAAAAAAFAAgAAKAAAAAAEABQICgAAAAAAAAAAAAAAAAAgAAAAKAAAAACAAAAAAoAAICgBmBoAAAAAAAAAAAAAACggAAAAAAAAAAAAKAAACAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICgAABmBqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmBqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAYBsAAAAAAAAEAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZBoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmBqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQQAAAFABAUAEAAAAAAAAAAABQQAAAFABAAAUGAbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/EAB4QAQACAwADAQEAAAAAAAAAABEAEAEgYDBwgFDA/9oACAEBAAECAPx8aK4yrjKqqqqqqqqqqqqqqqq5yrnK5yszpnisaKqqqqqqqqqqqqqqqqqqqucqrMxzxToqqqqqqqqqqqqqqqqqqqqqqx49pVVVVVVVVVVVVVVVVVVVVVV5VVVVVVVVVVVVVVVVVVVVVY8wqqqqqqqqqqqqqqqqqqqvNsVVVVVVVVVVVVVVVVVVjo8wsVVVVVVVVVVVVViqq6vQKqqqqqxVVWLFVVVVVaecfCqrTFWK0qtKqqqtq+B5dWLGKqxViqrGKqq2q09WtLFpaYrGmKsbdnrl0Y2vhaaVaXtW3wMdFtp9CPqJj8Svp97Z3dn4bfjJ8L9dPoR9IP8AbYf/xAAUEAEAAAAAAAAAAAAAAAAAAADQ/9oACAEBAAM/ADkr/8QAGREAAwEBAQAAAAAAAAAAAAAAAQJgMjFw/9oACAECAQE/APFhFjkWORY5FjkWORY5FjgixwRY5FrwRa8EWOCLXgi14IteCLXgi1yItciLXIi1yItciLXIi1yItciLTIi0yItMiLTIi0yItMiLTIi0yItMiLTAi0wsWmFi0wIv/8QAHhEBAQEAAgMAAwAAAAAAAAAAABEBEFACIGAwQLD/2gAIAQMBAT8A/R1rWtxuNxuNxviiIiIiIiIiIiIiIiM8WeLMZjMZjGM4xnQ7xEbjcbiNxERERERERERERERmM8WYzGYzGYzOM6eIiIiIiIiIiIiIiIiIiIiIidTERERERERERERERERERERERE6uIiIiIiIiIiIiIiIiIiInE66IiIiIiIiIiIiIiIiIidlOIiIiIiIiIiIiIiInaRERE4iIiIiIifBROInw84iJ6TvZzPwT2neTmIiInxERE9Z/AH//2Q=="
      class="absolute opacity-70"
      alt="og background"
    >
    <div class="size-full mx-auto max-w-[1000px] flex flex-row items-center justify-between">
      <div class="flex flex-col">
        <p v-if="headline" class="text-[26px] text-[#00DC82] mb-4 font-semibold">
          {{ headline }}
        </p>
        <h1 class="m-0 text-[65px] font-semibold mb-2 text-white flex items-center max-w-[850px]">
          <span>{{ title }}</span>
        </h1>
        <p v-if="description" class="text-[34px] text-[#E4E4E7] leading-tight max-w-[700px]">
          {{ description.slice(0, 200) }}
        </p>
      </div>
      <div class="flex justify-center">
        <img v-if="module.icon" :src="moduleImage(module.icon)" :alt="module.npm" class="size-40">
      </div>
    </div>
    <div class="absolute mx-auto bottom-8">
      <svg viewBox="0 0 256 168" xmlns="http://www.w3.org/2000/svg" width="50" preserveAspectRatio="xMidYMid">
        <path fill="#00DC82" d="M143.618 167.029h95.166c3.023 0 5.992-.771 8.61-2.237a16.963 16.963 0 0 0 6.302-6.115 16.324 16.324 0 0 0 2.304-8.352c0-2.932-.799-5.811-2.312-8.35L189.778 34.6a16.966 16.966 0 0 0-6.301-6.113 17.626 17.626 0 0 0-8.608-2.238c-3.023 0-5.991.772-8.609 2.238a16.964 16.964 0 0 0-6.3 6.113l-16.342 27.473-31.95-53.724a16.973 16.973 0 0 0-6.304-6.112A17.638 17.638 0 0 0 96.754 0c-3.022 0-5.992.772-8.61 2.237a16.973 16.973 0 0 0-6.303 6.112L2.31 141.975A16.302 16.302 0 0 0 0 150.325c0 2.932.793 5.813 2.304 8.352a16.964 16.964 0 0 0 6.302 6.115 17.628 17.628 0 0 0 8.61 2.237h59.737c23.669 0 41.123-10.084 53.134-29.758l29.159-48.983 15.618-26.215 46.874 78.742h-62.492l-15.628 26.214Zm-67.64-26.24-41.688-.01L96.782 35.796l31.181 52.492-20.877 35.084c-7.976 12.765-17.037 17.416-31.107 17.416Z" />
      </svg>
    </div>
  </div>
</template>
