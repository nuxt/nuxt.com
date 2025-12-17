import { isCoreTeamMember } from '../utils/team'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('feedback:authorize', async (ctx) => {
    ctx.allowed = await isCoreTeamMember(ctx.user.login.toLowerCase())
  })
})
