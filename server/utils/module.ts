import { createMarkdownParser, rehypeHighlight, createShikiHighlighter } from '@nuxtjs/mdc/runtime'

import darkTheme from '@shikijs/themes/material-theme-palenight'
import defaultTheme from '@shikijs/themes/material-theme-lighter'
import js from '@shikijs/langs/js'
import jsx from '@shikijs/langs/jsx'
import json from '@shikijs/langs/json'
import ts from '@shikijs/langs/ts'
import tsx from '@shikijs/langs/tsx'
import vue from '@shikijs/langs/vue'
import css from '@shikijs/langs/css'
import html from '@shikijs/langs/html'
import bash from '@shikijs/langs/bash'
import md from '@shikijs/langs/md'
import mdc from '@shikijs/langs/mdc'
import yaml from '@shikijs/langs/yaml'
import sql from '@shikijs/langs/sql'
import diff from '@shikijs/langs/diff'
import ini from '@shikijs/langs/ini'

import type { H3Event } from 'h3'
import type { BaseModule, Module, ModuleContributor, ModuleStats } from '#shared/types'
import type { NpmDownloadStats } from '../types/npm'

export function isBot(username: string) {
  return username.includes('[bot]') || username.includes('-bot')
}

export const fetchModules = cachedFunction(async (_event: H3Event): Promise<Module[]> => {
  console.info(`Fetching modules from CDN..`)
  return await $fetch<BaseModule[]>('https://unpkg.com/@nuxt/modules@latest/modules.json')
}, {
  name: 'modules',
  getKey: _event => '_all',
  maxAge: 10 * 60 // 10 minutes
})

export async function fetchModuleStats(event: H3Event, module: BaseModule, preloadedNpmStats?: NpmDownloadStats) {
  console.info(`Fetching module ${module.name} stats...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, repo] = await Promise.all([
    npm.fetchPackage(module.npm),
    preloadedNpmStats || npm.fetchPackageStats(module.npm, 'last-month'),
    github.fetchRepo(event, owner, name)
      .then((repo) => {
        return {
          stars: repo.stars,
          watchers: repo.watchers,
          forks: repo.forks,
          defaultBranch: repo.defaultBranch
        }
      })
  ])
  return {
    version: npmInfos?.['dist-tags']?.latest || '0.0.0',
    downloads: npmStats.downloads,
    stars: repo.stars,
    watchers: repo.watchers,
    forks: repo.forks,
    defaultBranch: repo.defaultBranch,
    publishedAt: +new Date(npmInfos?.time?.modified || Date.now()),
    createdAt: +new Date(npmInfos?.time?.created || Date.now())
  } satisfies ModuleStats
}

interface UnghContributor {
  id: number
  username: string
  contributions: number
}

interface UnghResponse {
  contributors: UnghContributor[]
}

export async function fetchModuleContributors(_event: H3Event, module: BaseModule): Promise<ModuleContributor[]> {
  console.info(`Fetching module ${module.name} contributors ...`)
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')

  try {
    const { contributors } = await $fetch<UnghResponse>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
    return contributors.filter(contributor => !isBot(contributor.username))
  } catch (err) {
    console.error(`Cannot fetch github contributors info for ${module.repo}: ${err}`)
    return []
  }
}

let parser: Awaited<ReturnType<typeof createMarkdownParser>>

export async function fetchModuleReadme(_event: H3Event, module: BaseModule) {
  console.info(`Fetching module ${module.name} readme ...`)
  const readme = await $fetch(`https://unpkg.com/${module.npm}/README.md`).catch(() => {
    console.warn(`Could not fetch ${module.npm}/README.md`)
    return 'Readme not found'
  }) as string

  parser ||= await createParser()

  return await parser(readme)
}

async function createParser() {
  return await createMarkdownParser({
    rehype: {
      plugins: {
        highlight: {
          instance: rehypeHighlight,
          options: {
            theme: 'material-theme-lighter',
            highlighter: createShikiHighlighter({
              bundledThemes: {
                'material-theme-lighter': defaultTheme,
                'material-theme-palenight': darkTheme
              },
              bundledLangs: {
                js,
                jsx,
                json,
                ts,
                tsx,
                vue,
                css,
                html,
                bash,
                md,
                mdc,
                yaml,
                sql,
                diff,
                ini
              }
            })
          }
        }
      }
    }
  })
}
