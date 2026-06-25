import { defineTool } from 'eve/tools'
import type { z } from 'zod'
import { internalFetch } from './internal-api.js'

interface DefineNuxtToolOptions<T extends z.ZodType> {
  description: string
  inputSchema: T
  path: string
  body?: (input: z.infer<T>) => unknown
}

export function defineNuxtTool<T extends z.ZodType>(options: DefineNuxtToolOptions<T>) {
  return defineTool({
    description: options.description,
    inputSchema: options.inputSchema,
    async execute(input) {
      const body = options.body ? options.body(input) : input
      return await internalFetch<Record<string, unknown>>(options.path, {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }
  })
}
