import { afterEach, describe, expect, it, vi } from 'vitest'
import { useClipboard as useVueUseClipboard } from '@vueuse/core'
import { useClipboard } from '../../app/composables/useClipboard'

vi.mock('@vueuse/core', () => ({ useClipboard: vi.fn() }))
afterEach(() => vi.unstubAllGlobals())

describe('clipboard feedback', () => {
  it('waits for the write before showing a success toast', async () => {
    let finish!: () => void
    const add = vi.fn()
    const copied = { value: false }
    const copy = vi.fn(() => new Promise<void>((resolve) => {
      finish = () => {
        copied.value = true
        resolve()
      }
    }))
    vi.mocked(useVueUseClipboard).mockReturnValue({ copy, copied } as any)
    vi.stubGlobal('useToast', () => ({ add }))
    const result = useClipboard().copy('pnpm create nuxt', { title: 'Copied' })
    expect(add).not.toHaveBeenCalled()
    finish()
    await result
    expect(add).toHaveBeenCalledWith({ title: 'Copied' })
  })

  it('rejects a write that the browser did not perform', async () => {
    const add = vi.fn()
    vi.mocked(useVueUseClipboard).mockReturnValue({ copy: vi.fn().mockResolvedValue(undefined), copied: { value: false } } as any)
    vi.stubGlobal('useToast', () => ({ add }))
    await expect(useClipboard().copy('pnpm create nuxt', { title: 'Copied' })).rejects.toThrow('Could not copy to clipboard')
    expect(add).not.toHaveBeenCalled()
  })

  it('lets the caller handle a rejected write without a success toast', async () => {
    const add = vi.fn()
    const copy = vi.fn().mockRejectedValue(new Error('Clipboard denied'))
    vi.mocked(useVueUseClipboard).mockReturnValue({ copy, copied: { value: false } } as any)
    vi.stubGlobal('useToast', () => ({ add }))
    await expect(useClipboard().copy('pnpm create nuxt', { title: 'Copied' })).rejects.toThrow('Clipboard denied')
    expect(add).not.toHaveBeenCalled()
  })
})
