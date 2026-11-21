const { registerHooks } = require('node:module')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')

const runtime = process.env.DSH_TEST_RUNTIME
if (!runtime) throw new Error('DSH_TEST_RUNTIME must point to Desktop resources/app.asar/dsh.')
const anchor = pathToFileURL(join(runtime, 'package.json')).href

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@deepseek-ai/') && !context.parentURL?.startsWith(anchor.replace(/package\.json$/, ''))) {
      return next(specifier, { ...context, parentURL: anchor })
    }
    return next(specifier, context)
  },
})
