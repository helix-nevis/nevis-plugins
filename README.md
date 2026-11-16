# 方案收敛与交付闭环工作法

把影响执行的不确定性逐步转化为已对齐、可验证的结论，让智能体按明确依据推进常规工作，让人只处理关键取舍、矛盾与授权事项。

本仓库维护：

- [完整方法论正文](methodology/solution-delivery-loop.md)：解释方法、原则与产物结构；
- [正式 Claude Code Skill](solution-delivery-loop/SKILL.md)：直接维护、可直接安装的执行内容。

内层 `solution-delivery-loop/` 就是 Skill 本体，不需要构建、生成或平台适配。

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

## 安装 Claude Code Skill

安装只需要内层 `solution-delivery-loop/` 目录，其中包含 `SKILL.md` 与 `references/`。仓库中的方法论、README、CI 和维护说明不是运行依赖。

### 项目级安装

在本仓库根目录执行：

```bash
cp -R solution-delivery-loop /path/to/project/.claude/skills/
```

Windows PowerShell：

```powershell
Copy-Item -Recurse -Force solution-delivery-loop `
  <目标项目>/.claude/skills/
```

安装后的结构：

```text
<目标项目>/.claude/skills/solution-delivery-loop/
├── SKILL.md
└── references/
```

重新打开或刷新 Claude Code 会话后，使用 `/solution-delivery-loop`。

### 用户级安装

如果希望所有项目可用，将内层目录复制到：

- Windows：`%USERPROFILE%\.claude\skills\solution-delivery-loop\`
- macOS / Linux：`~/.claude/skills/solution-delivery-loop/`

也可以下载 GitHub 仓库源码，再按上述方式复制内层目录。当前版本不使用自动 zip 构建或 Release 打包流程。

## 使用示例

只梳理需求，不进入开发：

```text
/solution-delivery-loop
请使用这套工作法，先盘点影响当前判断的现有资产，
再帮助我收敛本次需求。本轮只讨论需求，不进入开发。
```

审计已有方案：

```text
/solution-delivery-loop
请审计 docs/ 下的当前方案，重点检查需求覆盖、状态一致性、
外部能力证据和阻断实施的问题。不要自行修改核心范围。
```

规划当前批次：

```text
/solution-delivery-loop
请将已确认方案拆成规划级工作项，明确当前批次、依赖、验收和授权事项，
不提前细化未来批次，也不要开始编码。
```

## 仓库结构

```text
├── solution-delivery-loop/  # 正式 Skill，直接维护与安装
│   ├── SKILL.md             # 执行主干、硬约束与细则导航
│   └── references/          # 按需读取的完整操作细则
├── methodology/             # 方法论完整说明
├── README.md                # 项目与安装入口
├── CHANGELOG.md             # 版本变化
├── CLAUDE.md                # 仓库维护约定
└── .github/workflows/       # 轻量结构与链接校验
```

## 维护与版本

1. 直接修改 `solution-delivery-loop/SKILL.md` 和其 `references/`。
2. 方法论负责完整解释，Skill 负责执行；所有影响行为的规则必须进入 Skill 本体或其 references。
3. 修改核心方法时逐条审阅正文与 Skill，不依赖关键词检查证明语义一致。
4. 使用 Git 提交和标签记录版本；没有 src、dist、manifest、构建器或自动 Release 打包。
5. 讨论执行步骤不等于获得付费调用、真实写入、迁移或部署授权。

历史 `v0.1.0` 保留旧的构建发布结构；`v0.2.0` 起使用当前直接维护结构。

## License

[MIT](LICENSE)
