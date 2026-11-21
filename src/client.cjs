window.__ModuleLoader__.load({
  id: 'dsh-safety',
  factory(require) {
    const { createElement: element, useRef, useState, useSyncExternalStore } = require('react')
    const { IconShieldOutlineMedium, Switch } = require('@deepseek-ai/dsh-client-ui-primitives')
    const id = 'dsh-safety'
    const features = ['confirmations', 'risks', 'irreversible']
    const dictionaries = {
      zh: {
        nav: '安全模式',
        toggle: '启用安全模式',
        confirmations: '三次确认',
        confirmationsDetail: '敏感操作分三轮确认，最后一轮需输入指定措辞。',
        risks: '风险提示',
        risksDetail: '说明可能的风险和仍待核实的信息。',
        irreversible: '不可逆操作',
        irreversibleDetail: '先说明影响和恢复选项，再请求确认。',
        loading: '正在读取设置…',
        readFailed: '读取失败。重新连接后自动刷新。',
        unavailable: '无法读取此设置。',
        readonly: '此设置为只读。',
        saving: '正在保存…',
        refused: '未能保存此设置。',
        disconnected: '连接中断。重新连接后请检查设置。',
      },
      en: {
        nav: 'Safety Mode',
        toggle: 'Enable Safety Mode',
        confirmations: 'Three confirmations',
        confirmationsDetail: 'Confirm sensitive actions in three rounds. Enter the requested phrase in the final round.',
        risks: 'Risk review',
        risksDetail: 'See possible risks and what still needs checking.',
        irreversible: 'Irreversible actions',
        irreversibleDetail: 'Review the impact and recovery options before confirming.',
        loading: 'Loading setting…',
        readFailed: 'Could not load the setting. It will refresh after reconnecting.',
        unavailable: 'This setting is unavailable.',
        readonly: 'This setting is read-only.',
        saving: 'Saving…',
        refused: 'Could not save this setting.',
        disconnected: 'Connection lost. Check the setting after reconnecting.',
      },
    }
    const styles = {
      page: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBlock: '8px', color: 'var(--dsw-alias-label-primary)' },
      heading: { margin: 0, fontSize: '16px', fontWeight: 500, lineHeight: '24px' },
      card: {
        border: '0.5px solid var(--dsw-alias-settings-card-stroke)',
        borderRadius: 'var(--dsw-radius-xl)',
        background: 'var(--dsw-alias-settings-card-fill)',
      },
      control: {
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
      },
      icon: {
        display: 'grid',
        placeItems: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--dsw-radius-md)',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      toggle: { fontSize: '14px', fontWeight: 500, lineHeight: '20px' },
      status: { margin: '2px 0 0', fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' },
      error: { margin: '2px 0 0', fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-state-error-primary)' },
      details: { margin: 0 },
      detailRow: {
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: '16px',
        rowGap: '2px',
        padding: '12px 16px',
        borderTop: '0.5px solid var(--dsw-alias-border-l2)',
      },
      term: { flex: '0 1 124px', minWidth: 0, fontSize: '13px', lineHeight: '20px' },
      detail: { flex: '1 1 210px', minWidth: 0, margin: 0, fontSize: '12px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' },
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

      const headingId = `${id}-heading`
      return element('section', { 'aria-labelledby': headingId, style: styles.page },
        element('h2', { id: headingId, style: styles.heading }, t('nav')),
        element('div', { style: styles.card },
          element('div', { style: styles.control },
            element('span', { 'aria-hidden': true, style: styles.icon }, element(IconShieldOutlineMedium, { size: 18 })),
            element('div', null,
              element('div', { style: styles.toggle }, t('toggle')),
              statusKey && element('p', { role: 'status', style: styles.status }, t(statusKey)),
              error && element('p', { role: 'alert', style: styles.error }, t(error)),
            ),
            element(Switch, {
              checked: value?.enabled === true,
              disabled: !editable || busy,
              label: t('toggle'),
              onChange: save,
            }),
          ),
          element('dl', { style: styles.details }, ...features.map(feature =>
            element('div', { key: feature, style: styles.detailRow },
              element('dt', { style: styles.term }, t(feature)),
              element('dd', { style: styles.detail }, t(`${feature}Detail`)),
            ),
          )),
        ),
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
        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id,
        }, ({ size }) => element(IconShieldOutlineMedium, { size })))
      },
    }
  },
})
