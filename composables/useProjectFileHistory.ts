import { Project, Root, GitHubFile } from '~/types'

export const useProjectFileHistory = (project: Project, root: Root) => {
  const { branch } = useProjectBranches(project)
  const { file, draft } = useProjectFiles(project, root)
  const client = useStrapiClient()

  const pending = ref(false)
  const historyData = ref(null)

  const fetch = async (file: GitHubFile) => {
    if (!file?.path) {
      return
    }

    // renamed file case
    const oldPath = draft.value?.additions?.find(f => f.path === file.path)?.oldPath

    pending.value = true

    const data = await client<Object[]>(`/projects/${project.id}/files/${encodeURIComponent(oldPath || file.path)}/history`, {
      params: {
        ref: branch.value.name
      }
    })

    pending.value = false

    return data
  }

  // Computed

  const history = computed(() => {
    return historyData.value?.repository.ref.target.history.nodes.map(commit => ({
      authors: commit.authors.nodes.flatMap(author => author.user),
      message: commit.message,
      oid: commit.oid,
      shortSha: commit.oid.slice(0, 7),
      date: commit.pushedDate
    })) || []
  })

  // Watch

  watch(file, async () => {
    historyData.value = await fetch(file.value)
  }, { immediate: true })

  return {
    history,
    pending
  }
}
