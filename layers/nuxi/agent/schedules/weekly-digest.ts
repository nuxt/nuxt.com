import { defineSchedule } from 'eve/schedules'
import { runDigest } from '../lib/run-digest.js'

export default defineSchedule({
  cron: '0 9 * * 1',
  async run(args) {
    args.waitUntil(runDigest({ ...args, mode: 'weekly' }))
  }
})
