import type { Ref } from 'vue'
import type { Project, Root, GitHubUser, Commit } from '~/types'

interface GraphQLHistory {
  path: string,
  repository: {
    ref: {
      target: {
        history: {
          nodes: Array<{
            authors: {
              nodes: Array<{ user: GitHubUser }>
            },
            message: string,
            oid: string,
            pushedDate: string
          }>
        }
      }
    }
  }
}

export const useProjectFileHistory = (project: Project, root: Root) => {
  const { branch } = useProjectBranches(project)
  const { computedFile, draft } = useProjectFiles(project, root)
  const client = useStrapiClient()

  const pending = ref(true)
  const historyData: Ref<GraphQLHistory | null> = useState(`project-${project.id}-${root}-file-history`, () => null)

  const fetch = async () => {
    if (!computedFile.value) {
      return
    }

    // created file case
    if (computedFile.value.status === 'created') {
      historyData.value = null
      pending.value = false
      return
    }

    // renamed file case
    const oldPath = draft.value?.additions?.find(f => f.path === computedFile.value.path)?.oldPath
    const path = oldPath || computedFile.value.path

    if (historyData.value && historyData.value.path === path) {
      pending.value = false
      return
    }

    pending.value = true

    try {
      const result = await client<GraphQLHistory>(`/projects/${project.id}/files/${encodeURIComponent(path)}/history`, {
        params: {
          ref: branch.value.name
        }
      })

      historyData.value = {
        path,
        ...result
      }
    } catch (e) {
      historyData.value = null
    }

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
    })) as Commit[] || []
  })

  return {
    // Data
    history,
    pending,
    // Methods
    fetch
  }
}
