# 变更记录

本仓库的显著变更记录在此文件中。版本号遵循语义化版本。

## [0.2.0] - 2026-11-16

### 变更

- 废弃 src、dist、manifest、适配器和自动 zip Release 流程。
- 内层 `solution-delivery-loop/` 改为直接维护、可直接安装的正式 Skill。
- `SKILL.md` 保留执行主干和硬约束，新增四个按需读取的 references。
- 补回现状盘点、需求访谈、领域设计、证据卡、工作规划、根因纪律、偏差分诊和产物生命周期等执行规则。
- CI 改为轻量 frontmatter、相对链接、代码块和旧路径检查。

### 安装

复制内层 `solution-delivery-loop/` 到 `.claude/skills/`，不再需要构建。

## [0.1.0] - 2026-11-16

### 新增

- 发布方案收敛与交付闭环工作法 v1.4 完整正文。
- 提供 Claude Code Skill `solution-delivery-loop`。
- 建立当时采用的方法论正文、执行源与发布产物分离结构。
- 提供无第三方依赖的构建、必要规则覆盖检查和 GitHub Actions 校验。
