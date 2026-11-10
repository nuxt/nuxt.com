import { defineMcpAuth } from '@nuxtjs/mcp-toolkit/server'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineMcpAuth({
  schemes: ['bearer'],
  validate: ({ token }) => {
    const { mcpAdminToken } = useRuntimeConfig()
    return Boolean(mcpAdminToken) && token === mcpAdminToken
  }
})
