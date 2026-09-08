import { disableTool } from 'eve/tools'

// Root-only delegation opens a full Sonnet session per call. No instruction or
// skill asks for it, so it is pure unbounded spend.
export default disableTool()
