import { disableTool } from 'eve/tools'

// Nuxi answers docs questions — it never needs a shell. Public web sessions
// must not reach the sandbox.
export default disableTool()
