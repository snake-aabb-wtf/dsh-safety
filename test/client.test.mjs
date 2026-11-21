import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = new URL('../src/client.cjs', import.meta.url)
const ready = { status: 'ready', value: { enabled: false }, writable: true }

function setup() {
  const Switch = Symbol('native Switch')
  const Shield = Symbol('native shield')
  const states = []
  const writes = []
  let nextHook = 0
  let language = 'zh'
  let dictionaries
  let snapshot = ready
  let settingsError = null
  let section
  let sectionIcon
  let renderSection
  const form = {
    snapshot: () => snapshot,
    getSnapshot() { return this.snapshot() },
    subscribe() { return () => {} },
    set(field, value) {
      const pending = Promise.withResolvers()
      writes.push({ field, value, pending })
      return pending.promise
    },
  }
  const modules = {
    react: {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useRef(initial) { return states[nextHook++] ??= { current: initial } },
      useState(initial) {
        const index = nextHook++
        if (!(index in states)) states[index] = initial
        return [states[index], value => { states[index] = value }]
      },
      useSyncExternalStore: (_, getSnapshot) => getSnapshot(),
    },
    '@deepseek-ai/dsh-client-ui-primitives': { Switch, IconShieldOutlineMedium: Shield },
  }
  const translate = key => dictionaries[language][key]
  const ctx = {
    effect: register => register(),
    locale: { register(_, values) { dictionaries = values }, bind: () => translate },
    slots: {
      inject(slot, callback) {
        assert.ok(['settings.section', 'settings.section.icon'].includes(slot))
        return callback()
      },
      register(entry, component) {
        if (entry.name === 'settings.section.icon') {
          assert.equal(entry.id, 'dsh-safety')
          assert.equal(sectionIcon, undefined)
          sectionIcon = component({ size: 16 })
          return
        }
        assert.equal(section, undefined)
        section = entry
        renderSection = component
      },
    },
    configForms: {
      get(id) { assert.equal(id, 'dsh-safety'); return form },
      describe: () => ({ getSnapshot: () => ({ error: settingsError }), subscribe: () => () => {} }),
    },
  }
  runInNewContext(readFileSync(source, 'utf8'), {
    window: { __ModuleLoader__: { load({ id, factory }) {
      assert.equal(id, 'dsh-safety')
      const plugin = factory(id => modules[id])
      assert.ok(plugin.inject.includes('configForms'))
      plugin.apply(ctx)
    } } },
  }, { filename: source.pathname })

  function render() {
    nextHook = 0
    const tree = renderSection({ ...section.inject(), t: translate })
    const find = (node, predicate) => {
      if (!node || typeof node !== 'object') return undefined
      if (predicate(node)) return node
      return node.children.map(child => find(child, predicate)).find(Boolean)
    }
    const text = node => typeof node === 'string' ? node : node?.children?.map(text).join(' ') ?? ''
    return {
      toggle: find(tree, node => node.type === Switch)?.props,
      alert: find(tree, node => node.props?.role === 'alert')?.children.join(''),
      status: find(tree, node => node.props?.role === 'status')?.children.join(''),
      heading: find(tree, node => node.type === 'h2')?.children.join(''),
      rules: find(tree, node => node.type === 'dl'),
      text: text(tree),
    }
  }
  return {
    section, sectionIcon, Shield, render, writes,
    setSnapshot: next => { snapshot = next },
    setLanguage: next => { language = next },
    setSettingsError: next => { settingsError = next },
  }
}

test('registers one localized safety section in global settings', () => {
  const page = setup()
  assert.equal(page.section.name, 'settings.section')
  assert.equal(page.section.id, 'dsh-safety')
  assert.equal(page.section.label(), '安全模式')
  page.setLanguage('en')
  assert.equal(page.section.label(), 'Safety Mode')
})

test('uses the native shield and explains the three features in both languages', () => {
  const page = setup()
  assert.equal(page.sectionIcon?.type, page.Shield)
  assert.equal(page.sectionIcon.props.size, 16)
  for (const [locale, heading, labels] of [
    ['zh', '安全模式', ['三次确认', '风险提示', '不可逆操作']],
    ['en', 'Safety Mode', ['Three confirmations', 'Risk review', 'Irreversible actions']],
  ]) {
    page.setLanguage(locale)
    const view = page.render()
    assert.equal(view.heading, heading)
    assert.deepEqual(Array.from(view.rules.children, row => row.children[0].children.join('')), labels)
    assert.doesNotMatch(view.text, /遵守程度|depends on the model/i)
    assert.equal(view.status, undefined)
    assert.equal(view.alert, undefined)
  }
})

test('disables a switch whose value is unknown or whose form is read-only', () => {
  const page = setup()
  for (const snapshot of [
    { status: 'loading' },
    { status: 'unavailable' },
    { ...ready, value: { enabled: true }, writable: false },
  ]) {
    page.setSnapshot(snapshot)
    const { toggle, status } = page.render()
    assert.equal(toggle?.disabled, true)
    assert.ok(status)
  }
  assert.equal(page.render().toggle.checked, true)
})

test('waits for the confirmed value and prevents overlapping saves', async () => {
  const page = setup()
  const change = page.render().toggle.onChange
  const saving = change(true)
  await change(true)
  assert.equal(page.writes.length, 1)
  assert.equal(page.writes[0].field, 'enabled')
  assert.equal(page.writes[0].value, true)
  assert.equal(page.render().toggle.checked, false)
  assert.equal(page.render().toggle.disabled, true)
  page.setSnapshot({ ...ready, value: { enabled: true } })
  page.writes[0].pending.resolve(true)
  await saving
  assert.equal(page.render().toggle.checked, true)
  assert.equal(page.render().toggle.disabled, false)
})

test('keeps the accepted value and explains refusal or transport failure', async () => {
  const page = setup()
  let saving = page.render().toggle.onChange(true)
  page.writes[0].pending.resolve(false)
  await saving
  const refused = page.render()
  assert.equal(refused.toggle.checked, false)
  assert.ok(refused.alert)
  saving = page.render().toggle.onChange(true)
  page.writes[1].pending.reject(new Error('offline'))
  await saving
  const rejected = page.render()
  assert.equal(rejected.toggle.checked, false)
  assert.ok(rejected.alert)
  assert.notEqual(rejected.alert, refused.alert)
})

test('reports an initial or later read failure and recovers with the settings mirror', () => {
  const page = setup()
  page.setSnapshot({ status: 'loading' })
  const loading = page.render().status
  page.setSettingsError('initial describe failed')
  assert.ok(page.render().status)
  assert.notEqual(page.render().status, loading)
  assert.equal(page.render().toggle.disabled, true)

  page.setSnapshot({ ...ready, value: { enabled: true } })
  assert.equal(page.render().toggle.checked, true)
  assert.equal(page.render().toggle.disabled, true)
  page.setSettingsError(null)
  assert.equal(page.render().toggle.checked, true)
  assert.equal(page.render().toggle.disabled, false)
  assert.equal(page.render().status, undefined)
})
