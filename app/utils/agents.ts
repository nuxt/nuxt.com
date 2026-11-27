import type { InjectionKey, Ref } from 'vue'

export interface AgentsSectionLink {
  id: string
  label: string
}

/** One half of the `/agents` page, from the `halves` frontmatter of `content/agents.md`. */
export interface AgentsHalf {
  id: 'development' | 'production'
  num: number
  when: string
  title: string
  description: string
  icon: string
  sections: AgentsSectionLink[]
}

export const AGENTS_HALVES_KEY: InjectionKey<Ref<AgentsHalf[]>> = Symbol('agents-halves')

/** The halves `app/pages/agents.vue` provides to the components rendered from its markdown. */
export function useAgentsHalves(): Ref<AgentsHalf[]> {
  return inject(AGENTS_HALVES_KEY, ref([]))
}

/** "01", "02"…, the numbering the overview, half headers and chips share. */
export function agentsSectionNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
