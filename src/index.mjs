import Schema from '@deepseek-ai/schemastery'
import { SAFETY_POLICY } from './policy.mjs'

export const name = 'dsh-safety'
export const inject = ['systemPrompt']

export const Config = Schema.object({
  enabled: Schema.boolean().default(false).volatile(),
})

export function apply(ctx, config) {
  ctx.systemPrompt.section({
    name: 'dsh-safety:policy',
    order: 10300,
    interpolate: false,
    text: () => config.enabled.get() ? SAFETY_POLICY : '',
  })
}
