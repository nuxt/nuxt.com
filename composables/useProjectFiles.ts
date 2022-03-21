import type { Ref } from 'vue'
import type { GitHubFile, GitHubDraft, Project } from '~/types'
import ProjectContentCreateFileModal from '~/components/organisms/project/content/ProjectContentCreateFileModal.vue'
import ProjectContentRenameFileModal from '~/components/organisms/project/content/ProjectContentRenameFileModal.vue'
import ProjectContentDeleteFileModal from '~/components/organisms/project/content/ProjectContentDeleteFileModal.vue'
import ProjectContentRevertFileModal from '~/components/organisms/project/content/ProjectContentRevertFileModal.vue'
import ProjectContentPublishModal from '~/components/organisms/project/content/ProjectContentPublishModal.vue'

export const useProjectFiles = (project: Project, root: string) => {
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const { $toast } = useNuxtApp()
  const { branch, refresh: refreshBranches, openCreateModal: openCreateBranchModal } = useProjectBranches(project)

  const files: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files`, () => [])
  const draft: Ref<GitHubDraft> = useState(`project-${project.id}-${root}-draft`, () => null)
  const file: Ref<GitHubFile> = useState(`project-${project.id}-${root}-file`, () => null)

  const pending = ref(false)
  const loading = ref(false)

  // Http

  async function fetch (force?: boolean) {
    if (files.value.length && !force) {
      return
    }

    pending.value = true

    const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${project.id}/files`, {
      params: {
        ref: branch.value.name,
        root,
        withContent: root === 'public' ? ['png', 'jpg', 'jpeg', 'svg', 'ico'] : undefined
      }
    })

    files.value = data.files
    draft.value = data.draft

    pending.value = false

    init()
  }

  function refresh () {
    return fetch(true)
  }

  async function create (path: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files`, {
      method: 'POST',
      params: {
        ref: branch.value.name
      },
      body: {
        path
      }
    })

    draft.value = data

    select(computedFiles.value.find(file => file.path === path))
  }

  async function rename (oldPath: string, newPath: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/rename`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name
      },
      body: {
        files: [{
          oldPath,
          newPath
        }]
      }
    })

    draft.value = data

    if (file.value?.path === oldPath) {
      select(computedFiles.value.find(file => file.path === newPath))
    }
  }

  async function bulkRename (files) {
    if (!files.length) {
      return
    }

    const data = await client<GitHubDraft>(`/projects/${project.id}/files/rename`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name
      },
      body: {
        files
      }
    })

    draft.value = data
  }

  async function revert (path: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(path)}/revert`, {
      method: 'POST',
      params: {
        ref: branch.value?.name
      }
    })

    const oldFilePath = draft.value.additions.find(addition => addition.path === path)?.oldPath

    draft.value = data

    const currentFileExists = !!computedFiles.value.find(f => f.path === file.value?.path)

    if (!currentFileExists) {
      if (oldFilePath) {
        // Select old file
        const oldFile = computedFiles.value.find(f => f.path === oldFilePath)
        select(oldFile)
      } else {
        // Select new file when reverted file no longer exists
        file.value = null
        init()
      }
    }
    // TODO
    // else {
    //   // No new selection, fetch new content
    //   await fetchContent()
    // }
  }

  async function _delete (path: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      params: {
        ref: branch.value?.name
      }
    })

    draft.value = data

    // Select new file when deleted was selected
    if (file.value?.path === path) {
      file.value = null
      init()
    }
  }

  async function commit () {
    if (branch.value.name === project.repository.default_branch) {
      return openCreateBranchModal('', true, commit)
    }

    loading.value = true

    try {
      await client(`/projects/${project.id}/files/commit`, {
        method: 'POST',
        params: {
          ref: branch.value.name
        }
      })

      $toast.success({
        title: 'Changes saved!',
        description: `Your changes have been committed on ${branch.value.name} branch.`
      })

      await refresh()
    } catch (e) {}

    loading.value = false
  }

  async function publish () {
    if (!branch.value) {
      return
    }

    loading.value = true

    try {
      await client(`/projects/${project.id}/branches/${encodeURIComponent(branch.value.name)}/publish`, { method: 'POST' })

      $toast.success({
        title: 'Published!',
        description: `Your branch ${branch.value.name} has been merged into ${project.repository.default_branch}.`
      })

      await refreshBranches()
    } catch (e) {}

    loading.value = false
  }

  // Modals

  function openCreateModal (path: string) {
    openModal(ProjectContentCreateFileModal, {
      path,
      onSubmit: create
    })
  }

  function openRenameModal (oldPath: string) {
    openModal(ProjectContentRenameFileModal, {
      oldPath,
      onSubmit: rename
    })
  }

  function openDeleteModal (path: string) {
    openModal(ProjectContentDeleteFileModal, {
      path,
      onSubmit: _delete
    })
  }

  function openRevertModal (path: string) {
    openModal(ProjectContentRevertFileModal, {
      path,
      onSubmit: revert
    })
  }

  function openPublishModal () {
    openModal(ProjectContentPublishModal, {
      project,
      branch: branch.value,
      onSubmit: publish
    })
  }

  // Methods

  function init () {
    const currentFile = file.value?.path ? computedFiles.value.find(f => f.path === file.value.path) : null

    select(currentFile || computedFiles.value.find(file => file.path.toLowerCase().endsWith('index.md') && file.status !== 'deleted') || computedFiles.value.find(file => file.type === 'blob' && file.status !== 'deleted'))
  }

  function select (f: GitHubFile) {
    file.value = f
  }

  // Computed

  const computedFiles = computed(() => {
    const { additions, deletions } = draft.value || {}

    const githubFiles = files.value.map(file => ({ ...file }))

    for (const addition of additions) {
      if (addition.oldPath) {
        deletions.splice(deletions.findIndex(d => d.path === addition.oldPath), 1)
        const file = githubFiles.find(f => f.path === addition.oldPath)
        if (file) {
          file.status = 'renamed'
          file.path = addition.path
        }
      } else if (addition.new) {
        githubFiles.push({ path: addition.path, type: 'blob', status: 'created' })
      } else {
        const file = githubFiles.find(f => f.path === addition.path)
        if (file) {
          file.status = 'updated'
        }
      }
    }
    for (const deletion of deletions) {
      const file = githubFiles.find(f => f.path === deletion.path)
      if (file) {
        file.status = 'deleted'
      }
    }
    return githubFiles
  })

  const isDraft = computed(() => {
    return draft.value?.additions?.length || draft.value?.deletions.length
  })

  return {
    // Http
    fetch,
    refresh,
    bulkRename,
    commit,
    // Modals
    openCreateModal,
    openRenameModal,
    openDeleteModal,
    openRevertModal,
    openPublishModal,
    // Methods
    select,
    // Refs
    pending,
    loading,
    // Computed
    computedFiles,
    isDraft,
    // Data
    file,
    draft
  }
}
