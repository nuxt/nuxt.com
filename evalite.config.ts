import { existsSync } from 'node:fs'
import { defineConfig } from 'evalite/config'

if (existsSync('.env')) {
  process.loadEnvFile()
}

export default defineConfig({
  cache: true
})
