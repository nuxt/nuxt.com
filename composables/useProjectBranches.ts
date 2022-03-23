import type { Ref } from 'vue'
import type { GitHubBranch, Project } from '~/types'
import ProjectModalBranchCreate from '~/components/organisms/project/modal/ProjectModalBranchCreate.vue'
import ProjectModalPublish from '~/components/organisms/project/modal/ProjectModalPublish.vue'

export const useProjectBranches = (project: Project) => {
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const cookie = useCookie(`project-${project.id}-branch`, { path: '/' })
  const { $toast } = useNuxtApp()

  const branches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches`, () => [])
  const branch: Ref<GitHubBranch> = useState(`project-${project.id}-branch`, () => null)

  const pending = ref(false)
  const loading = ref(false)

  // Http

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

  async function commit () {
    if (branch.value.name === project.repository.default_branch) {
      return openCreateModal('', true)
    }

    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value.name)}/commit`, { method: 'POST' })

      await refresh()

      $toast.success({
        title: 'Changes saved!',
        description: `Your changes have been committed on ${branch.value.name} branch.`
      })
    } catch (e) {}

    loading.value = false
  }

  async function publish () {
    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value.name)}/publish`, { method: 'POST' })

      await refresh()

      $toast.success({
        title: 'Published!',
        description: `Your branch ${branch.value.name} has been merged into ${project.repository.default_branch}.`
      })
    } catch (e) {}

    loading.value = false
  }

  // Modals

  function openCreateModal (name: string, mergeDraft: boolean) {
    openModal(ProjectModalBranchCreate, {
      name,
      mergeDraft,
      branches: branches.value,
      onSubmit: async (name: string) => {
        await create(name, mergeDraft)

        if (mergeDraft) {
          commit()
        }
      }
    })
  }

  function openPublishModal () {
    openModal(ProjectModalPublish, {
      project,
      branch: branch.value,
      onSubmit: publish
    })
  }

  // Methods

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
    // Http
    fetch,
    refresh,
    create,
    commit,
    // Modals
    openCreateModal,
    openPublishModal,
    // Methods
    select,
    // Refs
    pending,
    loading,
    // Data
    branches,
    branch
  }
}
