# dsh-safety

`dsh-safety` 为 DeepSeek Harness 增加「安全模式」。开启后，Harness 在系统提示词中加入策略，要求 Agent 披露有依据的低概率风险和剩余不确定性，对敏感操作逐轮请求三次确认，并在不可逆操作前先给出风险报告。

## 安装和启用

首版面向 **DeepSeek Harness `0.2.2-rc.5`** 的标准 Desktop 和 Web 配置。

1. 在工作区运行 `npm pack`，生成 `dsh-safety-0.1.2.tgz`。
2. 在 Desktop 或 Web 的侧栏打开「插件 → 添加插件」，输入 tarball 的绝对路径，安装后启用 bundle。
3. 打开全局「设置 → 安全模式」，打开「启用安全模式」。该开关默认关闭，设置保存在当前 Host profile。

Web 用户也可用 CLI 向已有的 Web profile 安装本地包：

```powershell
dsh plugin --profile web add (Resolve-Path './dsh-safety-0.1.2.tgz').Path
```

开关从下一次系统提示词组装起生效。在途请求继续使用发出时的提示词。已有会话保留历史对话，支持历史系统提示词更新的 Flash 路由以最新的完整系统消息为准。关闭开关后可以从同一个设置页重新启用。

## 确认如何工作

Agent 根据会话记录跟踪三次确认，用自然语言逐次询问。需要输入指定措辞时，Agent 会给出针对本次操作的完整句子。不可逆操作还要求用户确认理解并愿意承担该操作的全部后果。目标、范围或预期后果发生实质变化时，需要重新确认。

安全模式通过提示词指导模型，执行效果取决于模型遵守程度。Harness 的权限、审批和沙箱独立生效。首版用于标准提示词组装和使用同一提示词服务的进程内子 Agent。

## 开发与验证

```powershell
npm ci
npm run check
npm test
npm pack --dry-run
```

测试需要 Node `>=24.9.0`。实际验收及运行环境见 [验证记录](docs/verification.md)。
