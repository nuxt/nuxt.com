import { disableTool } from 'eve/tools'

// No sandbox filesystem access: content comes from nuxt-mcp, not files.
export default disableTool()
