# 方案收敛与交付闭环工作法

把影响执行的不确定性逐步转化为已对齐、可验证的结论，让智能体按明确依据推进常规工作，让人只处理关键取舍、矛盾与授权事项。

本仓库同时是 **Claude Code 插件市场（marketplace）** 和其中第一个插件的源码仓库：

- 市场标识：`nevis-plugins`
- 首个插件：`nevis-toolkit`
- 插件内技能：`solution-delivery-loop`
- [完整方法论正文](methodology/solution-delivery-loop.md)：解释方法、原则与产物结构；
- [插件技能正文](plugins/nevis-toolkit/skills/solution-delivery-loop/SKILL.md)：可直接安装的执行内容。

## 工作法能解决什么

适用于新功能、系统改造、技术方案、方案审计、工作规划、任务开工和交付复核，重点改善：

- 需求与方案在讨论中反复漂移；
- 重要结论只留在会话里；
- 外部能力未核验就被写成承诺；
- 工作拆解过细、依赖不清或把规划误当授权；
- 执行偏差没有回到正确的事实源；
- 测试通过被误认为业务目标已经达成。

工作法主线：

```text
现状盘点 → 需求梳理与统一语言 → 方案设计
       → 方案审计 → 工作规划 → 任务派发与执行反馈
```

实际使用不必完整走完六步。先判断本轮需要解决的问题，只执行相关步骤。

## 安装

### 通过市场安装（推荐）

在 Claude Code 会话外执行：

```bash
claude plugin marketplace add helix-nevis/nevis-plugins
```

```bash
claude plugin install nevis-toolkit@nevis-plugins
```

或在会话内使用 `/plugin marketplace add helix-nevis/nevis-plugins`，再从 `/plugin` 面板安装。

安装后技能命令为 `/nevis-toolkit:solution-delivery-loop`。命令由“插件名:技能名”组成，以后往这个插件里增加别的技能时，只需在 `skills/` 下新增目录，安装命令和插件标识都不用变。

本地开发时，可直接加载工作副本而不安装：

```bash
claude --plugin-dir ./plugins/nevis-toolkit
```

自定义市场默认不自动更新。需要跟随更新时，在 `/plugin` 的 **Marketplaces** 中开启 **Enable auto-update**，或手动执行 `claude plugin update nevis-toolkit@nevis-plugins`。

### 直接复制技能目录

如果不需要插件机制，也可以只复制技能目录：

```bash
cp -R plugins/nevis-toolkit/skills/solution-delivery-loop \
  /path/to/project/.claude/skills/
```

Windows PowerShell：

```powershell
Copy-Item -Recurse -Force `
  plugins/nevis-toolkit/skills/solution-delivery-loop `
  <目标项目>/.claude/skills/
```

复制后命令为 `/solution-delivery-loop`，不带前缀。

### 版本提示

插件清单固定了 `version`。维护者每次发布必须同时更新插件清单中的版本号并打 Git 标签，否则已安装的用户不会收到更新。

## 使用示例

只梳理需求，不进入开发：

```text
/nevis-toolkit:solution-delivery-loop
请使用这套工作法，先盘点影响当前判断的现有资产，
再帮助我收敛本次需求。本轮只讨论需求，不进入开发。
```

审计已有方案：

```text
/nevis-toolkit:solution-delivery-loop
请审计 docs/ 下的当前方案，重点检查需求覆盖、状态一致性、
外部能力证据和阻断实施的问题。不要自行修改核心范围。
```

规划当前批次：

```text
/nevis-toolkit:solution-delivery-loop
请将已确认方案拆成规划级工作项，明确当前批次、依赖、验收和授权事项，
不提前细化未来批次，也不要开始编码。
```

## 仓库结构

```text
├── .claude-plugin/
│   └── marketplace.json          # 市场清单：列出插件及来源
├── plugins/
│   └── nevis-toolkit/            # 插件根
│       ├── .claude-plugin/
│       │   └── plugin.json       # 插件清单：名称、版本、元数据
│       └── skills/
│           └── solution-delivery-loop/
│               ├── SKILL.md      # 执行主干、硬约束与细则导航
│               └── references/   # 按需读取的完整操作细则
├── methodology/                  # 方法论完整说明
├── README.md                     # 项目与安装入口
├── CHANGELOG.md                  # 版本变化
├── CLAUDE.md                     # 仓库维护约定
└── .github/workflows/            # 结构与清单校验
```

## 维护与版本

1. 直接修改 `plugins/nevis-toolkit/skills/solution-delivery-loop/` 下的 `SKILL.md` 与 `references/`。
2. 方法论负责完整解释，插件技能负责执行；所有影响行为的规则必须进入技能本体或其 references。
3. 修改核心方法时逐条审阅正文与技能，不依赖关键词检查证明语义一致。
4. 发布新版本时同时更新 `CHANGELOG.md`、插件清单的 `version` 和 Git 标签。
5. 讨论执行步骤不等于获得付费调用、真实写入、迁移或部署授权。

历史 `v0.1.0` 使用旧的构建发布结构，`v0.2.0` 起改为直接维护，`v0.3.0` 起改为插件市场结构。

## License

[MIT](LICENSE)
