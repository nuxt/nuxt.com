import type { Starter } from './starter'

export interface Theme extends Starter {
  studio: boolean,
  shop?: string,
  free?: boolean
}
