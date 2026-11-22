import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import * as safety from '../src/index.mjs'
import { SAFETY_POLICY } from '../src/policy.mjs'

async function setup(t, config) {
  const ctx = new Context()
  const systemPrompt = ctx.plugin(SystemPrompt)
  t.after(() => systemPrompt.dispose())
  await systemPrompt
  const render = async () => renderPrompt(await ctx.systemPrompt.assemble())
  const baseline = await render()
  const fiber = ctx.plugin(safety, config)
  t.after(() => fiber.dispose())
  await fiber
  return { baseline, fiber, render }
}

function assertEnabled(prompt, baseline) {
  assert.ok(SAFETY_POLICY.length > 0)
  assert.equal(prompt.split(SAFETY_POLICY).length - 1, 1)
  assert.equal(prompt, `${baseline}\n\n${SAFETY_POLICY}`)
}

test('defaults off and preserves the native system prompt', async t => {
  const { baseline, render } = await setup(t)
  assert.equal(await render(), baseline)
})

test('includes one policy section on the first request when configured on', async t => {
  const { baseline, render } = await setup(t, { enabled: true })
  assertEnabled(await render(), baseline)
})

test('the injected policy keeps confirmation progress internal', async t => {
  const { render } = await setup(t, { enabled: true })
  const prompt = await render()
  assert.match(prompt, /Keep the confirmation count and progress internal\./)
  assert.match(prompt, /Ask the user to send that sentence as a separate message\./)
})

test('the injected policy places safety refusals before confirmation', async t => {
  const { render } = await setup(t, { enabled: true })
  const prompt = await render()
  const headings = [
    '### Apply safety refusals before confirmation',
    '### Protect sensitive credentials',
    '### Preserve security controls in development',
    '### Preserve security controls on public web deployments',
    '### Classify the proposed action',
    '### Require three distinct confirmations',
  ]
  const positions = headings.map(heading => prompt.indexOf(heading))
  assert.ok(positions.every((position, i) =>
    position >= 0 && (i === 0 || position > positions[i - 1])))
  assert.match(prompt, /User confirmation and tool approval cannot override these refusals\./)
  assert.match(prompt, /Do not call any tools, including skills, to prepare or deliver the refusal\./)
})

test('the injected policy allows configured credential use while keeping plaintext out of context', async t => {
  const { render } = await setup(t, { enabled: true })
  const prompt = await render()
  const credentialPolicy = prompt.match(/^### Protect sensitive credentials\n([\s\S]*?)^### /m)?.[1]
  assert.ok(credentialPolicy, 'credential protection must be injected')
  assert.ok(credentialPolicy.includes('ask the user to save the credential manually in a protected file'),
    'guide the user to configure a file without sharing the value')
  assert.ok(credentialPolicy.includes('Use PowerShell or another trusted tool to load and use the saved credential internally'),
    'use an available trusted tool for authorized operations')
  assert.ok(credentialPolicy.includes('PowerShell can do this in a single invocation'))
  assert.ok(credentialPolicy.includes('Do not make a separate tool call that returns the credential'))
  assert.ok(credentialPolicy.includes('authentication checks that return only a safe result or status'))
  assert.ok(credentialPolicy.includes('Keep plaintext credentials out of the model-visible context.'))
  assert.ok(credentialPolicy.includes('even if a copy of the exposed credential is already saved'))
  assert.doesNotMatch(credentialPolicy, /Do not run a command that reads or uses a real credential/)
})

test('toggles live without re-registering and removes the policy on disposal', async t => {
  const { baseline, fiber, render } = await setup(t)
  await fiber.update({ enabled: true })
  assertEnabled(await render(), baseline)
  await fiber.update({ enabled: false })
  assert.equal(await render(), baseline)
  await fiber.update({ enabled: true })
  assertEnabled(await render(), baseline)
  await fiber.dispose()
  assert.equal(await render(), baseline)
})
