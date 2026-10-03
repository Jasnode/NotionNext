/** @jest-environment node */

import { execFileSync } from 'node:child_process'
import path from 'node:path'

// Run outside Jest's global Next mocks with the real React/Notion renderer.
// The fixture only stubs application data and unrelated dynamic leaf components.
it.each(['development', 'production'])('renders page and RSS links with real dependencies in %s', mode => {
  const output = execFileSync(process.execPath, [
    path.join(__dirname, '../fixtures/notion-page-ssr.cjs')
  ], {
    cwd: path.join(__dirname, '../..'),
    env: { ...process.env, NODE_ENV: mode },
    encoding: 'utf8',
    timeout: 30000
  })
  expect(output).toContain(`${mode}: real NotionRenderer SSR and router-free RSS assertions passed`)
}, 35000)
