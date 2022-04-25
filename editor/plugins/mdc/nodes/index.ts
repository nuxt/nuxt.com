import { AtomList } from '@milkdown/utils'

import { containerComponent, textComponent } from './component'
import { componentSlot } from './slot'

export default AtomList.create([
  containerComponent(),
  textComponent(),
  componentSlot()
])
