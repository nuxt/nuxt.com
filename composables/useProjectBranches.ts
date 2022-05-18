import type { Ref } from 'vue'
import type { GitHubBranch, Project } from '~/types'
import ProjectModalBranchCreate from '~/components/project/modal/ProjectModalBranchCreate.vue'
import ProjectModalPublish from '~/components/project/modal/ProjectModalPublish.vue'

export const useProjectBranches = (project: Project) => {
  const { $socket, $toast } = useNuxtApp()
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const cookie = useCookie(`project-${project.id}-branch`, { path: '/' })

  const recentBranches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches-recent`, () => [])
  const branches: Ref<GitHubBranch[]> = useState(`project-${project.id}-branches`, () => [])
  const branch: Ref<GitHubBranch> = useState(`project-${project.id}-branch`, () => null)

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
    loading.value = true

    try {
      const b = await client<GitHubBranch>(`/projects/${project.id}/branches`, {
        method: 'POST',
        body: {
          name,
          mergeDraft
        }
      })

      branches.value.push(b)

      select(b)

      if (mergeDraft) {
        $socket.emit('draft:update', `project-${project.id}:${project.repository.default_branch}:content`)
        $socket.emit('draft:update', `project-${project.id}:${project.repository.default_branch}:public`)
      }
    } catch (e) {}

    loading.value = false
  }

  async function commit () {
    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value.name)}/commit`, { method: 'POST' })

      $socket.emit('branch:commit', `project-${project.id}:${branch.value.name}`)

      $toast.success({
        title: 'Changes saved!',
        description: `Your changes have been committed on ${branch.value.name} branch.`
      })
    } catch (e) {}

    loading.value = false
  }

  async function publish () {
    const name = branch.value.name

    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(name)}/publish`, { method: 'POST' })

      $toast.success({
        title: 'Published!',
        description: `Your branch ${name} has been merged into ${project.repository.default_branch}.`
      })
    } catch (e) {}

    loading.value = false
  }

  async function reset () {
    await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value.name)}/reset`, { method: 'DELETE' })

    $socket.emit('draft:update', `project-${project.id}:${branch.value.name}:content`)
    $socket.emit('draft:update', `project-${project.id}:${branch.value.name}:public`)
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

  function openPublishModal () {
    openModal(ProjectModalPublish, {
      project,
      branch: branch.value,
      onSubmit: publish
    })
  }

  // Links

  function openGithub () {
    window.open(`https://github.com/${project.repository.owner}/${project.repository.name}`, '_blank')
  }

  function openGithubDesktop () {
    window.open(`x-github-client://openRepo/https://github.com/${project.repository.owner}/${project.repository.name}`)
  }

  // Methods

  function init () {
    let branchToSelect

    if (branch.value) {
      branchToSelect = branchToSelect || branches.value.find(b => b.name === branch.value.name)
    }
    if (cookie.value) {
      branchToSelect = branchToSelect || branches.value.find(b => b.name === cookie.value)
    }

    branchToSelect = branchToSelect || branches.value.find(b => b.name === project.repository.default_branch)
    branchToSelect = branchToSelect || branches.value[0]

    select(branchToSelect)
  }

  function select (b: GitHubBranch) {
    branch.value = b
    cookie.value = branch.value?.name

    if (branch.value) {
      recentBranches.value = [{ ...branch.value, openedAt: Date.now() }, ...recentBranches.value.filter(rb => rb.name !== branch.value.name)]

      if (process.client) {
        $socket.emit('branch:join', `project-${project.id}:${branch.value.name}`)
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
    // Links
    openGithub,
    openGithubDesktop,
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
