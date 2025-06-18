export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const adminMember = await isCoreTeamMember(user.login.toLowerCase())

    if (!adminMember) {
      return sendRedirect(event, '/admin/login?error=access-denied')
    }

    await setUserSession(event, { user })
    return sendRedirect(event, '/admin')
  }
})
