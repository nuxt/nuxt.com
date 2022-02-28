import type { Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import type { GitHubInstallation, GitHubAccount } from '~/types'

export const useGitHubInstallations = () => {
  const client = useStrapiClient()
  const visibility = useDocumentVisibility()

  const accounts: Ref<GitHubAccount[]> = ref([])
  const { data: installations, refresh } = useAsyncData('installations', () => client<GitHubInstallation[]>('/github/installations'))

  watch(visibility, (current, previous) => {
    if (current === 'visible' && previous === 'hidden') {
      refresh()
    }
  })

  watch(installations, () => {
    accounts.value = installations.value.map(({ account }) => account)
  })

  return {
    accounts,
    installations,
    refresh
  }
}
