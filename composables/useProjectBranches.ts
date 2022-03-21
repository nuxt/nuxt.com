import type { Ref } from 'vue'
import type { GitHubBranch, Project } from '~/types'
import ProjectContentCreateBranchModal from '~/components/organisms/project/content/ProjectContentCreateBranchModal.vue'

export const useProjectBranches = (project: Project) => {
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const cookie = useCookie(`project-${project.id}-branch`, { path: '/' })

  const branches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches`, () => [])
  const branch: Ref<GitHubBranch> = useState(`project-${project.id}-branch`, () => null)
  const pending = ref(false)

  async function fetch (force?: boolean) {
    if (branches.value.length && !force) {
      return
    }

    pending.value = true

    branches.value = await client<GitHubBranch[]>(`/projects/${project.id}/branches`)

    pending.value = false

    init()
  }

  function refresh () {
    return fetch(true)
  }

  async function create (name: string, mergeDraft?: boolean) {
    const b = await client<GitHubBranch>(`/projects/${project.id}/branches`, {
      method: 'POST',
      body: {
        name,
        mergeDraft
      }
    })

    branches.value.push(b)

    select(b)
  }

  function openCreateModal (name: string, mergeDraft: boolean, onSuccess?: () => void) {
    openModal(ProjectContentCreateBranchModal, {
      name,
      mergeDraft,
      onSubmit: async (name: string) => {
        await create(name, mergeDraft)

        if (onSuccess) {
          onSuccess()
        }
      }
    })
  }

  function init () {
    let b: GitHubBranch
    if (cookie.value) {
      b = branches.value.find(branch => branch.name === cookie.value)
    } else {
      b = branches.value.find(branch => branch.name === project.repository.default_branch)
    }

    select(b || branches.value[0])
  }

  function select (b: GitHubBranch) {
    branch.value = b
    cookie.value = b.name
  }

  return {
    fetch,
    refresh,
    create,
    openCreateModal,
    select,
    init,
    pending,
    branches,
    branch
  }
}
