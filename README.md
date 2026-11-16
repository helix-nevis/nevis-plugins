# 方案收敛与交付闭环工作法

把影响执行的不确定性逐步转化为已对齐、可验证的结论，让智能体按明确依据推进常规工作，让人只处理关键取舍、矛盾与授权事项。

本仓库同时维护：

- **方法论正文**：完整解释工作法及产物结构；
- **Claude Code Skill**：将工作法转化为可按当前阶段调用的执行指令。

两者不追求逐字一致，但核心规则必须一致。

## 工作法能解决什么

适用于新功能、系统改造、技术方案、方案审计、工作规划、任务开工和交付复核，重点改善：

- 需求与方案在讨论中反复漂移；
- 重要结论只留在会话里；
- 外部能力未核验就被写成承诺；
- 工作拆解过细、依赖不清或把规划误当授权；
- 执行偏差没有回到正确的事实源；
- 测试通过被误认为业务目标已经达成。

## 阅读与使用

- [完整方法论](methodology/solution-delivery-loop.md)
- [Skill 执行源](skill-src/instructions.md)
- [构建产物说明](dist/README.md)
- [仓库维护约定](CLAUDE.md)
- [变更记录](CHANGELOG.md)

工作法的主线是：

```text
现状盘点 → 需求梳理与统一语言 → 方案设计
       → 方案审计 → 工作规划 → 任务派发与执行反馈
```

实际使用不必从第零步完整走到第五步。先判断本轮需要解决的问题，只执行相关步骤。

## 安装 Claude Code Skill

### 项目级安装

将发布包中的 `solution-delivery-loop/` 目录复制到目标项目：

```text
<目标项目>/.claude/skills/solution-delivery-loop/
├── SKILL.md
└── references/（如发布包包含）
```

在当前源码仓库中，也可以直接复制：

```bash
cp -R dist/solution-delivery-loop /path/to/project/.claude/skills/
```

Windows PowerShell：

```powershell
Copy-Item -Recurse -Force dist/solution-delivery-loop `
  <目标项目>/.claude/skills/
```

重新打开或刷新 Claude Code 会话后，使用 `/solution-delivery-loop`。

### 用户级安装

如果希望所有项目可用，可将同一目录复制到：

- Windows：`%USERPROFILE%\.claude\skills\solution-delivery-loop\`
- macOS / Linux：`~/.claude/skills/solution-delivery-loop/`

### 发布包

GitHub Release 提供 `solution-delivery-loop-skill-v<version>.zip`。压缩包只包含安装所需文件，不包含仓库开发、测试和 CI 内容。

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

## 目录结构

```text
├── methodology/             # 方法论完整事实源
├── skill-src/               # Skill 执行源与发布清单
├── adapters/claude-code/    # 无第三方依赖的构建器
├── dist/                    # 可安装发布产物，不直接编辑
├── tests/                   # 构建与同步测试
└── .github/workflows/       # 持续校验与 Release
```

## 构建与验证

要求 Python 3.10 或更高版本，无需安装第三方依赖。

```bash
python adapters/claude-code/build.py
python adapters/claude-code/build.py --check
python -m unittest discover -s tests -v
```

`--check` 会检查必要规则覆盖并重建发布产物。CI 额外执行：

```bash
git diff --exit-code -- dist/
```

因此修改执行源或 manifest 后，必须重新构建并提交 `dist/` 的变化。

## 发布版本

- 方法论保留自己的 `v1.x` 文档演进记录；
- Skill 发布使用 `0.x.y` 语义化版本；
- 两者分别标识，避免把 Skill 包版本误当成方法论正文版本。

发布前更新 `skill-src/manifest.yaml` 和 `CHANGELOG.md`，完成构建与测试，再创建同名 Git tag 和 GitHub Release。

## 维护原则

1. 方法论正文负责完整解释，Skill 负责有效执行。
2. 不直接修改生成的 `dist/solution-delivery-loop/SKILL.md`。
3. 修改核心方法时，同时审阅执行规则，而非仅做关键词匹配。
4. 发布包不包含项目过程记录、真实业务数据或敏感配置。
5. 本 Skill 讨论执行步骤不等于获得付费调用、真实写入、迁移或部署授权。

## License

[MIT](LICENSE)
