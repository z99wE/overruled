#!/usr/bin/env node
import { execSync } from 'node:child_process'

const repo = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
process.chdir(repo)

const run = (name, cmd, opts = {}) => {
  const label = `[${name}]`
  try {
    execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', shell: true })
    console.log(`${label} GREEN`)
    return true
  } catch {
    console.error(`${label} RED`)
    return false
  }
}

const checks = []
checks.push(['typecheck (app)', 'npm run typecheck --silent', { silent: true }])
checks.push(['typecheck (workers)', 'npx tsc -p tsconfig.workers.json --noEmit'])
checks.push(['lint', 'npm run lint --silent'])
checks.push(['tests', 'npm test --silent', { silent: true }])
checks.push(['coverage floor', 'npm run test:coverage --silent', { silent: true }])

const alive = (url) => {
  try {
    const out = execSync(`curl -s -o /dev/null -w '%{http_code}' '${url}'`, { encoding: 'utf8' })
    return out.trim() === '200'
  } catch {
    return false
  }
}

const live = [
  'https://overrool.pages.dev/llms.txt',
  'https://overrool.pages.dev/robots.txt',
  'https://overrool.pages.dev/sitemap.xml',
  'https://overrool.pages.dev/manifest.webmanifest',
]
checks.push(['live SEO/AI 200s', 'true', { silent: true }]) // replaced below
checks.pop()
const liveOk = live.every(alive)
console.log(`[live SEO/AI 200s] ${liveOk ? 'GREEN' : 'RED'}`)

const results = checks.map(([name, cmd, opts]) => [name, run(name, cmd, opts)])
results.push(['live SEO/AI 200s', liveOk])

const allGreen = results.every(([, ok]) => ok)
console.log('\n== knucklegate five-seam scorecard ==')
let green = 0
for (const [name, ok] of results) {
  console.log(`  ${ok ? '✓' : '✗'} ${name}`)
  if (ok) green++
}
console.log(`\n${green}/${results.length} seams green`)
process.exit(allGreen ? 0 : 1)
