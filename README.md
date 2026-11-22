<h1 align="center">dsh-safety</h1>

<p align="center">DeepSeek Harness 的安全模式插件</p>

<p align="center">
  <a href="https://github.com/snake-aabb-wtf/dsh-safety/releases/latest"><strong>下载安装包</strong></a>
  · <a href="#安装">安装说明</a>
  · <a href="#功能一览">功能一览</a>
  · <a href="docs/verification.md">验证记录</a>
</p>

## 功能一览

| 功能 | 安全模式下的行为 |
| --- | --- |
| **风险提示** | 提醒有依据的低概率风险，说明哪些信息仍待核实。不可逆操作前说明影响、范围和恢复选项。 |
| **三次确认** | 用自然语言逐次询问，等待三条独立回复。最后一次按 Agent 给出的完整句子原样确认。 |
| **凭据保护** | PowerShell 或其他可信工具在同一次调用内使用已保存的 Key，只返回业务结果或认证状态。 |
| **安全防护** | 拒绝削弱开发项目或公网 Web 的有效防护。验证覆盖范围和切换期间的防护后，可以进行等效替换。 |
| **跨轮判断** | 根据同一会话中相关步骤的累计后果判断风险。独立任务按各自的影响处理。 |

## 安装

适用于 **DeepSeek Harness `0.2.2-rc.5`** 的标准 Desktop 和 Web 配置。

1. 从 [GitHub Releases](https://github.com/snake-aabb-wtf/dsh-safety/releases/latest) 下载 `.tgz` 安装包。
2. 打开 **插件 → 添加插件**，填入 Harness 可访问的安装包绝对路径。安装后选择 **立即启用**。
3. 在 **设置 → 安全模式** 打开 **启用安全模式**。

开关默认关闭，保存在当前 Host profile。调整后从下一次系统提示词组装起生效。

<details>
<summary>通过 Web CLI 安装</summary>

在安装包所在目录运行，然后按上面的步骤启用插件和安全模式。

```powershell
dsh plugin --profile web add (Resolve-Path './dsh-safety-0.2.2.tgz').Path
```

</details>

## 配置凭据

1. 将 Key 手动写入你选择的受保护文件，可以使用 `.txt` 或应用支持的其他格式。把文件放在访问受限的位置，并排除在版本控制之外。
2. 只向 Agent 提供文件路径或凭据引用。Key 由工具在执行时读取并向对应服务认证。

如果误把 Key 发进聊天，Agent 会引导你在签发处撤销或轮换，再更新本地文件。

## 开发与发布

使用 **Node.js `>=24.9.0`** 安装依赖、运行检查并构建本地 `.tgz`。

```powershell
npm ci
npm run check
npm test
npm pack
```

推送与 `package.json` 和 `package-lock.json` 一致的版本标签，例如 `v0.2.2`，即可启动 [Release 工作流](.github/workflows/release.yml)。通过检查和测试后，工作流将 `.tgz` 附到对应的 GitHub Release，并为预发布版本标记预发行版。

## 许可证

[MIT](LICENSE)
