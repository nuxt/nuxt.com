import type { Ref } from 'vue'
import type { GitHubBranch, Project } from '~/types'
import ProjectModalBranchCreate from '~/components/project/modal/ProjectModalBranchCreate.vue'
import ProjectModalPublish from '~/components/project/modal/ProjectModalPublish.vue'

export const useProjectBranches = (project: Project) => {
  const { $socket } = useNuxtApp()
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const cookie = useCookie(`project-${project.id}-branch`, { path: '/' })
  const { $toast } = useNuxtApp()

  const recentBranches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches-recent`, () => [])
  const branches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches`, () => [])
  const branch: Ref<string> = useState(`project-${project.id}-branch`, () => cookie.value)

  const pending = ref(false)
  const loading = ref(false)

  // Http

  async function fetch ({ force, resetCache }: { force?: boolean, resetCache?: boolean } = {}) {
    if (branches.value.length && !force && !resetCache) {
      return
    }

    pending.value = true

    branches.value = await client<GitHubBranch[]>(`/projects/${project.id}/branches`, {
      params: {
        force: resetCache
      }
    })

    pending.value = false

    init()
  }

  function refresh (resetCache?: boolean) {
    return fetch({ force: true, resetCache })
  }

  async function create (name: string, mergeDraft?: boolean) {
    try {
      const b = await client<GitHubBranch>(`/projects/${project.id}/branches`, {
        method: 'POST',
        body: {
          name,
          mergeDraft
        }
      })

      branches.value.push(b)

      select(b.name)
    } catch (e) {}
  }

  async function commit () {
    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value)}/commit`, { method: 'POST' })

      $socket.emit('branch:commit', `project-${project.id}:${branch.value}`)

      $toast.success({
        title: 'Changes saved!',
        description: `Your changes have been committed on ${branch.value} branch.`
      })
    } catch (e) {}

    loading.value = false
  }

  async function publish () {
    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value)}/publish`, { method: 'POST' })

      select(project.repository.default_branch)

      branches.value = branches.value.filter(b => b.name !== branch.value)

      $toast.success({
        title: 'Published!',
        description: `Your branch ${branch.value} has been merged into ${project.repository.default_branch}.`
      })
    } catch (e) {}

    loading.value = false
  }

  async function reset () {
    await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value)}/reset`, { method: 'DELETE' })

    $socket.emit('draft:update', `project-${project.id}:${branch.value}`)
  }

  // Modals

  function openCreateModal (name: string, mergeDraft: boolean, commitDraft: boolean, callback?: () => void) {
    openModal(ProjectModalBranchCreate, {
      name,
      mergeDraft,
      branches: branches.value,
      onSubmit: async (name: string) => {
        await create(name, mergeDraft)

        if (commitDraft) {
          await commit()
        }

        if (callback) {
          await callback()
        }
      }
    })
  }

  function openPublishModal (callback?: () => void) {
    openModal(ProjectModalPublish, {
      project,
      branch: branch.value,
      onSubmit: async () => {
        await publish()

        if (callback) {
          await callback()
        }
      }
    })
  }

  // Methods

  function init () {
    let branchToSelect = branch.value ? branches.value.find(b => b.name === branch.value) : null

    branchToSelect = branchToSelect || branches.value.find(b => b.name === project.repository.default_branch)
    branchToSelect = branchToSelect || branches.value[0]

    select(branchToSelect.name)
  }

  function select (name: string) {
    branch.value = name
    cookie.value = name

    if (branch.value) {
      recentBranches.value = [{ name: branch.value, openedAt: Date.now() }, ...recentBranches.value.filter(rb => rb.name !== branch.value)]

      if (process.client) {
        $socket.emit('branch:join', `project-${project.id}:${branch.value}`)
      }
    }
  }

  return {
    // Http
    fetch,
    refresh,
    create,
    commit,
    reset,
    // Modals
    openCreateModal,
    openPublishModal,
    // Methods
    select,
    // Refs
    pending,
    loading,
    // Data
    recentBranches,
    branches,
    branch: readonly(branch)
  }
}
