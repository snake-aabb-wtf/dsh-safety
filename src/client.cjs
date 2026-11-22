window.__ModuleLoader__.load({
  id: 'dsh-safety',
  factory(require) {
    const { createElement: element, useRef, useState, useSyncExternalStore } = require('react')
    const {
      IconChecklistOutlineRegular, IconClockOutlineRegular, IconRefreshOutlineRegular,
      IconShieldOutlineMedium, IconShieldOutlineRegular, IconWarningTriangleOutlineRegular, Switch,
    } = require('@deepseek-ai/dsh-client-ui-primitives')
    const id = 'dsh-safety'
    const features = [
      ['confirmations', IconChecklistOutlineRegular],
      ['risks', IconWarningTriangleOutlineRegular],
      ['irreversible', IconClockOutlineRegular],
      ['credentials', IconShieldOutlineRegular],
      ['guardrails', IconRefreshOutlineRegular],
    ]
    const dictionaries = {
      zh: {
        nav: '安全模式',
        toggle: '启用安全模式',
        on: '已开启',
        off: '已关闭',
        rules: '启用后的规则',
        confirmations: '三次确认',
        confirmationsDetail: '敏感操作分三轮确认，最后一轮需输入指定措辞。',
        risks: '风险提示',
        risksDetail: '说明可能的风险和仍待核实的信息。',
        irreversible: '不可逆操作',
        irreversibleDetail: '先说明影响和恢复选项，再请求确认。',
        credentials: '凭据保护',
        credentialsDetail: '提示轮换已暴露的凭据。通过受信工具使用预先保存的凭据，避免将明文带入聊天。',
        guardrails: '安全措施与跨轮判断',
        guardrailsDetail: '保留代码和公网服务中的有效防护，结合先前请求判断操作的累计影响。',
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
        on: 'On',
        off: 'Off',
        rules: 'Rules when enabled',
        confirmations: 'Three confirmations',
        confirmationsDetail: 'Confirm sensitive actions in three rounds. Enter the requested phrase in the final round.',
        risks: 'Risk review',
        risksDetail: 'See possible risks and what still needs checking.',
        irreversible: 'Irreversible actions',
        irreversibleDetail: 'Review the impact and recovery options before confirming.',
        credentials: 'Credential protection',
        credentialsDetail: 'Get rotation guidance for exposed credentials. Use saved credentials through trusted tools to keep secrets out of chat.',
        guardrails: 'Safeguards across turns',
        guardrailsDetail: 'Keep safeguards in code and public services, and consider the combined effect of related requests.',
        loading: 'Loading setting…',
        readFailed: 'Could not load the setting. It will refresh after reconnecting.',
        unavailable: 'This setting is unavailable.',
        readonly: 'This setting is read-only.',
        saving: 'Saving…',
        refused: 'Could not save this setting.',
        disconnected: 'Connection lost. Check the setting after reconnecting.',
      },
    }
    const stylesheet = `
      .dsh-safety-page {
        --safety-red: #ae2c43;
        --safety-green: #087749;
        --safety-red-track: #b9344d;
        --safety-green-track: #168251;
        --safety-thumb: #fff;
        --safety-accent: var(--dsw-alias-label-secondary);
        --safety-surface: var(--dsw-alias-settings-card-fill);
        --safety-border: var(--dsw-alias-settings-card-stroke);
        --safety-ease: cubic-bezier(.22, 1, .36, 1);
        display: grid;
        gap: 20px;
        padding-block: 8px;
        color: var(--dsw-alias-label-primary);
      }
      body[data-ds-dark-theme] .dsh-safety-page {
        --safety-red: #ff899b;
        --safety-green: #61dfa9;
        --safety-red-track: #ee7288;
        --safety-green-track: #43b585;
        --safety-thumb: #0f1115;
      }
      .dsh-safety-page[data-mode='off'] {
        --safety-accent: var(--safety-red);
        --safety-track: var(--safety-red-track);
      }
      .dsh-safety-page[data-mode='on'] {
        --safety-accent: var(--safety-green);
        --safety-track: var(--safety-green-track);
      }
      .dsh-safety-hero {
        position: relative;
        isolation: isolate;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: clamp(12px, 3vw, 24px);
        min-height: 146px;
        padding: 18px clamp(12px, 3vw, 28px);
        border: 1px solid color-mix(in srgb, var(--safety-accent) 28%, var(--safety-border));
        border-radius: var(--dsw-radius-xl);
        background-color: var(--safety-surface);
        box-shadow: inset 0 1px color-mix(in srgb, var(--safety-accent) 10%, transparent);
        transition: border-color 320ms ease, box-shadow 320ms ease;
      }
      .dsh-safety-hero::before {
        position: absolute;
        z-index: -1;
        inset: 0;
        border-radius: inherit;
        background-color: color-mix(in srgb, var(--safety-accent) 7%, transparent);
        background-image: radial-gradient(ellipse at 7% 38%, currentColor, transparent 66%);
        color: color-mix(in srgb, var(--safety-accent) 14%, transparent);
        content: '';
        pointer-events: none;
        transition: background-color 360ms ease, color 360ms ease;
      }
      .dsh-safety-orb {
        position: relative;
        display: grid;
        place-items: center;
        width: clamp(62px, 10vw, 106px);
        aspect-ratio: 1;
        color: var(--safety-accent);
        transition: color 360ms ease;
      }
      .dsh-safety-orb::before, .dsh-safety-orb::after, .dsh-safety-wave {
        position: absolute;
        border: 1px solid currentColor;
        border-radius: 50%;
        content: '';
        pointer-events: none;
      }
      .dsh-safety-orb::before {
        inset: 0;
        opacity: .26;
      }
      .dsh-safety-orb::after {
        inset: 12%;
        border-style: dashed;
        opacity: .35;
      }
      .dsh-safety-shield {
        position: absolute;
        inset: 24%;
        display: grid;
        place-items: center;
        border: 1px solid color-mix(in srgb, currentColor 38%, transparent);
        border-radius: 50%;
        background: color-mix(in srgb, currentColor 12%, transparent);
        box-shadow: 0 0 23px color-mix(in srgb, currentColor 19%, transparent);
      }
      .dsh-safety-shield svg {
        width: 55%;
        height: 55%;
      }
      .dsh-safety-wave {
        inset: 7%;
        opacity: 0;
        animation: dsh-safety-wave 720ms var(--safety-ease);
      }
      @keyframes dsh-safety-wave {
        from { transform: scale(.6); opacity: .72; }
        to { transform: scale(1.22); opacity: 0; }
      }
      .dsh-safety-heading, .dsh-safety-rules-heading {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
      }
      .dsh-safety-mode {
        margin: 4px 0 0;
        color: var(--safety-accent);
        font-size: 30px;
        font-weight: 600;
        line-height: 1.2;
        transition: color 360ms ease;
      }
      .dsh-safety-message {
        margin: 4px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        overflow-wrap: anywhere;
      }
      .dsh-safety-message[role='alert'] {
        color: var(--safety-red);
      }
      .dsh-safety-page .dsh-safety-switch[role='switch'][aria-checked] {
        background-color: var(--safety-track, var(--dsw-alias-bg-module-platform));
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--safety-accent) 13%, transparent);
        transition: background-color 320ms ease, box-shadow 320ms ease;
      }
      .dsh-safety-page .dsh-safety-switch[role='switch']:focus-visible {
        outline-offset: 5px;
      }
      .dsh-safety-page:is([data-mode='on'], [data-mode='off']) .dsh-safety-switch[role='switch'] > span {
        background-color: var(--safety-thumb);
      }
      .dsh-safety-rules-heading {
        margin-bottom: 8px;
      }
      .dsh-safety-rules {
        margin: 0;
        border: .5px solid var(--safety-border);
        border-radius: var(--dsw-radius-xl);
        background-color: var(--safety-surface);
      }
      .dsh-safety-rule {
        position: relative;
        display: grid;
        gap: 2px;
        padding-block: 11px;
        padding-inline: 58px 16px;
      }
      .dsh-safety-rule + .dsh-safety-rule {
        border-top: .5px solid var(--dsw-alias-border-l2);
      }
      .dsh-safety-rule-icon {
        position: absolute;
        inset-inline-start: 16px;
        top: 50%;
        transform: translateY(-50%);
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: var(--dsw-radius-md);
        background-color: color-mix(in srgb, var(--safety-accent) 9%, transparent);
        color: var(--safety-accent);
        transition: background-color 320ms ease, color 320ms ease;
      }
      .dsh-safety-rule dt {
        font-size: 13px;
        font-weight: 500;
        line-height: 18px;
      }
      .dsh-safety-rule dd {
        margin: 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        overflow-wrap: anywhere;
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-safety-page *, .dsh-safety-page *::before, .dsh-safety-page *::after,
        .dsh-safety-page .dsh-safety-switch[role='switch'][aria-checked],
        .dsh-safety-page .dsh-safety-switch[role='switch'] > span {
          animation: none;
          transition: none;
        }
      }
    `

    function SafetySettings({ t, form, settings }) {
      const { status, value, writable } = useSyncExternalStore(form.subscribe, form.getSnapshot)
      const readFailed = useSyncExternalStore(settings.subscribe, settings.getSnapshot)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const saving = useRef(false)
      const ready = status === 'ready' && typeof value?.enabled === 'boolean'
      const known = ready && !readFailed
      const checked = value?.enabled === true
      const mode = known ? (checked ? 'on' : 'off') : 'unknown'
      const editable = known && writable

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
      return element('section', { 'aria-labelledby': headingId, className: 'dsh-safety-page', 'data-mode': mode },
        element('style', null, stylesheet),
        element('div', { className: 'dsh-safety-hero' },
          element('div', { 'aria-hidden': true, className: 'dsh-safety-orb' },
            element('span', { className: 'dsh-safety-shield' }, element(IconShieldOutlineMedium, { size: 30 })),
            known && element('span', { key: mode, className: 'dsh-safety-wave' }),
          ),
          element('div', null,
            element('h2', { id: headingId, className: 'dsh-safety-heading' }, t('nav')),
            known && element('p', { id: `${id}-mode`, className: 'dsh-safety-mode' }, t(mode)),
            statusKey && element('p', { role: 'status', className: 'dsh-safety-message' }, t(statusKey)),
            error && element('p', { role: 'alert', className: 'dsh-safety-message' }, t(error)),
          ),
          element(Switch, { className: 'dsh-safety-switch', checked, disabled: !editable || busy, label: t('toggle'), onChange: save }),
        ),
        element('div', null,
          element('h3', { className: 'dsh-safety-rules-heading' }, t('rules')),
          element('dl', { className: 'dsh-safety-rules' }, ...features.map(([feature, Icon]) =>
            element('div', { key: feature, className: 'dsh-safety-rule' },
              element('dt', null,
                element('span', { 'aria-hidden': true, className: 'dsh-safety-rule-icon' }, element(Icon, { size: 16 })),
                t(feature),
              ),
              element('dd', null, t(`${feature}Detail`)),
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
