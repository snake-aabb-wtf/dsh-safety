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
