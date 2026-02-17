import type { Stats } from '#shared/types'

export const useStats = () => useState<Stats | null>('stats', () => null)
