import { Project, Root, GitHubFile } from '~/types'

export const useProjectFileHistory = (project: Project, root: Root) => {
  const { branch } = useProjectBranches(project)
  const { file, draft } = useProjectFiles(project, root)
  const client = useStrapiClient()

  const pending = ref(true)
  const historyData = ref(null)

  const fetch = async () => {
    // created file case
    if (file.value.status === 'created') {
      historyData.value = null
      pending.value = false
      return
    }

    // renamed file case
    const oldPath = draft.value?.additions?.find(f => f.path === file.value.path)?.oldPath

    pending.value = true

    try {
      historyData.value = await client<Object[]>(`/projects/${project.id}/files/${encodeURIComponent(oldPath || file.value.path)}/history`, {
        params: {
          ref: branch.value.name
        }
      })
    } catch (e) {}

    pending.value = false
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

  if (process.client) {
    watch(file, fetch, { immediate: true })
  }

  return {
    history,
    pending
  }
}
