import { disableTool } from 'eve/tools'

// `capture_screenshot` replaces it: it returns the frame to the model, which this tool doesn't, and
// saves the WebP the other tools publish or commit.
export default disableTool()
