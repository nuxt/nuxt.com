import type { SourceData } from 'comark-content'
import type { Filter } from './filters'

/**
 * An agency page from the local content source, with the string frontmatter
 * fields (`services`, `regions`, `location`) resolved into filterable entries.
 */
export interface Agency extends Omit<SourceData<'local'>, 'services' | 'regions' | 'location'> {
  path: string
  services: Filter[]
  regions: Filter[]
  location: Filter | null
}
