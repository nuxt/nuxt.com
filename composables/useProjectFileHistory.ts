import { Project, Root, GitHubFile } from '~/types'

export const useProjectFileHistory = (project: Project, root: Root) => {
  const { branch } = useProjectBranches(project)
  const { draft } = useProjectFiles(project, root)
  const client = useStrapiClient()

  const pending = ref(false)

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

  return {
    pending,
    fetch
  }
}
