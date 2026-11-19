import browser from '@agent-browser/eve'
import { BROWSER_SESSION } from '../../../../lib/media/capture.js'

/**
 * `browser__*`: navigate, read, click, fill and inspect pages in the sandbox's Chromium. Any public
 * site, since a showcase candidate or a linked issue can be anywhere; the sandbox holds no
 * credentials and the extension exposes no cookie or storage reads. The session name is fixed so
 * `capture_screenshot` and `record_video` act on the page these tools left open.
 */
export default browser({
  session: BROWSER_SESSION,
  // The sandbox template installs the matching version; a session never pays for the install.
  autoInstall: false,
  contentBoundaries: true,
  maxOutputChars: 50_000,
  inlineScreenshots: false
})
