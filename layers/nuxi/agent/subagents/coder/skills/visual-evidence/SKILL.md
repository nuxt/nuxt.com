---
description: Show a change or a page with screenshots and short clips. Load it before opening a pull request that changes how a page looks or behaves, and when someone asks for a screenshot, a recording, a video, a before/after, or to look at a page.
---

A reviewer should see what you saw. A sentence that describes a page is not evidence; a capture is.

## What you can and can't capture

- **Your change**, from the app you run in the sandbox: check out the repository, start its dev server (`run-project` skill) and capture `http://localhost:<port>/<path>`. This is the "after" of a code change.
- **The same page without your change**, as the "before". Capture it from the dev server before you edit anything, so both captures come from the same place. When you didn't, capture the deployed site of the repository, if your instructions name one, and say that the two come from different places.
- **Any other public page**: a site for the showcase, a template's demo, a page linked in an issue.
- When the app can't run in the sandbox, you have no "after" for a code change. Say so in the pull request in one line, and never present a capture of the deployed site as the result of your change.
- Capture public pages and pages of an app you run, with the demo data it starts with. Never a dashboard, an admin page, or a page that shows a person's data.

## Still or clip

- A still shows a state. Use `capture_screenshot`, with `selector` to bring the part that matters into the frame.
- A clip shows what a still can't: a hover, a menu opening, an animation, a scroll, a flow of several steps. Use `record_video` and keep it under ten seconds.
- To capture a state that needs interaction first, such as an open menu, reach it with the `browser__*` tools, then call `capture_screenshot` without `url`.
- Use the same viewport and the same `selector` for two captures that will be compared. Add a `mobile` capture when the change is responsive.

Look at every capture you get back before you use it, and check that it shows the thing you mean. A frame of the top of the page when the change is in the footer is not evidence. Capture again instead of explaining around it.

## Putting it where people see it

- Call `publish_media` and paste the Markdown it returns into the pull request body, under a short label that says what the capture shows and where it was taken, such as "Before, local dev server, desktop". For a clip, the Markdown is its URL: keep it alone on its line, with a blank line before and after, and it renders as a video player.
- Put the URL of every published capture in your reply too. A capture opens for everyone only once the pull request embeds it, so open the pull request before you reply.
- When the task has no pull request, such as a request to look at a page, say what the capture shows in your reply, give its URL, and say that the link may not open for someone else: nothing on GitHub embeds it.
- Never commit a capture that is evidence to the branch. Only images the site serves go into the repository, with `commit_assets`.
- When `publish_media` fails, say in the pull request and in your reply that the capture exists but could not be published. Never write "see the screenshot" for an image that is not there.
- A change that only adds something has no "before". Don't pair it with an unrelated capture to fill a table.
