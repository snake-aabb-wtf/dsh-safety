window.__ModuleLoader__.load({
  id: 'dsh-safety',
  factory(require) {
    const { createElement: element, useRef, useState, useSyncExternalStore } = require('react')
    const { Switch } = require('@deepseek-ai/dsh-client-ui-primitives')
    const id = 'dsh-safety'
    const dictionaries = {
      zh: {
        nav: '安全模式',
        toggle: '启用安全模式',
        description: '提醒低概率风险和剩余不确定性，要求 Agent 对敏感操作逐轮请求三次确认。遵守程度取决于模型。',
        loading: '正在读取安全模式设置…',
        readFailed: '未能从宿主读取最新设置。连接恢复后会刷新。',
        unavailable: '当前无法读取安全模式设置。',
        readonly: '当前连接或宿主配置限制了对此设置的编辑。',
        saving: '正在保存…',
        refused: '宿主未接受此次修改。请检查写入权限和配置覆盖。',
        disconnected: '保存时无法连接到宿主。请在连接恢复后重试。',
      },
      en: {
        nav: 'Safety Mode',
        toggle: 'Enable Safety Mode',
        description: 'Ask the agent to report unlikely risks and remaining uncertainty and seek three separate confirmations for sensitive actions. Adherence depends on the model.',
        loading: 'Reading the Safety Mode setting…',
        readFailed: 'Could not read the latest setting from the host. It will refresh when the connection returns.',
        unavailable: 'The Safety Mode setting is currently unavailable.',
        readonly: 'This connection or the host configuration prevents editing this setting.',
        saving: 'Saving…',
        refused: 'The host did not accept the change. Check write permissions and configuration overrides.',
        disconnected: 'Could not reach the host while saving. Try again when the connection returns.',
      },
    }

    function SafetySettings({ t, form, settings }) {
      const { status, value, writable } = useSyncExternalStore(form.subscribe, form.getSnapshot)
      const readFailed = useSyncExternalStore(settings.subscribe, settings.getSnapshot)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const saving = useRef(false)
      const ready = status === 'ready' && typeof value?.enabled === 'boolean'
      const editable = ready && writable && !readFailed

      async function save(next) {
        if (!editable || saving.current) return
        saving.current = true
        setBusy(true)
        setError(null)
        try {
          if (!await form.set('enabled', next)) setError('refused')
        } catch {
          setError('disconnected')
        } finally {
          saving.current = false
          setBusy(false)
        }
      }

      const statusKey = readFailed ? 'readFailed'
        : status === 'loading' ? 'loading'
        : !ready ? 'unavailable'
        : !writable ? 'readonly'
        : busy ? 'saving' : null

      return element('section', { 'aria-label': t('nav') },
        element('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' } },
          element('div', null,
            element('strong', null, t('toggle')),
            element('p', { style: { margin: '4px 0 0' } }, t('description')),
          ),
          element(Switch, {
            checked: value?.enabled === true,
            disabled: !editable || busy,
            label: t('toggle'),
            onChange: save,
          }),
        ),
        statusKey && element('p', { role: 'status' }, t(statusKey)),
        error && element('p', { role: 'alert' }, t(error)),
      )
    }

    return {
      name: 'dsh-safety-client',
      inject: ['slots', 'configForms', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(id, dictionaries))
        const t = ctx.locale.bind(id)
        const form = ctx.configForms.get(id)
        const settings = ctx.configForms.describe()
        const props = {
          form: {
            subscribe: listener => form.subscribe(listener),
            getSnapshot: () => form.getSnapshot(),
            set: (field, value) => form.set(field, value),
          },
          settings: {
            subscribe: listener => settings.subscribe(listener),
            getSnapshot: () => settings.getSnapshot().error !== null,
          },
        }
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id,
          order: 30,
          label: () => t('nav'),
          locale: id,
          inject: () => props,
        }, SafetySettings))
      },
    }
  },
})
