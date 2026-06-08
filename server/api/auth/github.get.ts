export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const allowed = await isAuthorizedAdmin(event, user.login)

    if (!allowed) {
      return sendRedirect(event, '/admin/login?error=access-denied')
    }

    await setUserSession(event, { user })
    return sendRedirect(event, '/admin')
  }
})
