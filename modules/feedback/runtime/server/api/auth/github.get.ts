export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const { public: { feedback } } = useRuntimeConfig(event)
    const adminPath = feedback?.adminPath || '/_feedback/admin'

    const ctx = { user, allowed: true }
    await useNitroApp().hooks.callHook('feedback:authorize', ctx)

    if (!ctx.allowed) {
      return sendRedirect(event, `${adminPath}/login?error=access-denied`)
    }

    await setUserSession(event, { user })
    return sendRedirect(event, adminPath)
  }
})
