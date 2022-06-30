import { AtomList, createPlugin } from '@milkdown/utils'
import remarkMDC from '@docus/remark-mdc'
import nodes from './nodes'

const remarkPlugin = createPlugin(() => ({
  remarkPlugins: () => [remarkMDC]
}))

export default AtomList.create([remarkPlugin(), ...nodes])
