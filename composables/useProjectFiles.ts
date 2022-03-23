import type { Ref } from 'vue'
import { omit } from 'lodash-es'
import type { GitHubFile, GitHubDraft, Project } from '~/types'
import ProjectModalFileCreate from '~/components/organisms/project/modal/ProjectModalFileCreate.vue'
import ProjectModalFileRename from '~/components/organisms/project/modal/ProjectModalFileRename.vue'
import ProjectModalFileDelete from '~/components/organisms/project/modal/ProjectModalFileDelete.vue'
import ProjectModalFileRevert from '~/components/organisms/project/modal/ProjectModalFileRevert.vue'

export const useProjectFiles = (project: Project, root: string) => {
  const { open: openModal } = useModal()
  const client = useStrapiClient()
  const { branch } = useProjectBranches(project)

  const files: Ref<GitHubFile[]> = useState(`project-${project.id}-${root}-files`, () => [])
  const draft: Ref<GitHubDraft> = useState(`project-${project.id}-${root}-draft`, () => null)
  const file: Ref<GitHubFile> = useState(`project-${project.id}-${root}-file`, () => null)

  const pending = ref(false)

  // Http

  async function fetch (force?: boolean) {
    if (files.value.length && !force) {
      return
    }

    pending.value = true

    const data = await client<{ files: GitHubFile[], draft: GitHubDraft }>(`/projects/${project.id}/files`, {
      params: {
        ref: branch.value.name,
        root
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

  async function create (path: string, formData?: FormData) {
    let body

    if (formData) {
      formData.append('data', JSON.stringify({ path }))
      body = formData
    } else {
      body = { data: { path } }
    }

    const data = await client<GitHubDraft>(`/projects/${project.id}/files`, {
      method: 'POST',
      params: {
        ref: branch.value.name,
        root
      },
      body
    })

    draft.value = data

    select(computedFiles.value.find(file => file.path === path))
  }

  async function rename (oldPath: string, newPath: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/rename`, {
      method: 'PUT',
      params: {
        ref: branch.value?.name,
        root
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
        ref: branch.value?.name,
        root
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
        ref: branch.value?.name,
        root
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
    } else {
      // No new selection, fetch new content
      // FIXME: hacky update to trigger any watchers on `file`
      file.value = { ...file.value }
    }
  }

  async function _delete (path: string) {
    const data = await client<GitHubDraft>(`/projects/${project.id}/files/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      params: {
        ref: branch.value?.name,
        root
      }
    })

    draft.value = data

    // Select new file when deleted was selected
    if (file.value?.path === path) {
      file.value = null
      init()
    }
  }

  // Modals

  function openCreateModal (path: string) {
    openModal(ProjectModalFileCreate, {
      computedFiles: computedFiles.value,
      path,
      onSubmit: create
    })
  }

  function openRenameModal (oldPath: string, lockedPath?: string) {
    openModal(ProjectModalFileRename, {
      computedFiles: computedFiles.value,
      oldPath,
      lockedPath,
      onSubmit: rename
    })
  }

  function openDeleteModal (path: string) {
    openModal(ProjectModalFileDelete, {
      path,
      onSubmit: _delete
    })
  }

  function openRevertModal (path: string) {
    openModal(ProjectModalFileRevert, {
      path,
      onSubmit: revert
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
    const additions = draft.value?.additions.map(a => ({ ...a })) || []
    const deletions = draft.value?.deletions.map(a => ({ ...a })) || []
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
        githubFiles.push({
          type: 'blob',
          status: 'created',
          ...omit(addition, ['new', 'oldPath'])
        })
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
    return (draft.value?.additions?.length || 0) + (draft.value?.deletions.length || 0)
  })

  return {
    // Http
    fetch,
    refresh,
    create,
    bulkRename,
    // Modals
    openCreateModal,
    openRenameModal,
    openDeleteModal,
    openRevertModal,
    // Methods
    select,
    // Refs
    pending,
    // Computed
    computedFiles,
    isDraft,
    // Data
    file,
    draft
  }
}
