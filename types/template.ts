import type { Starter } from './starter'

export interface Template extends Starter {
  studio: boolean,
  shop?: string,
  free?: boolean
}
