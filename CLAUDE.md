# 仓库维护约定

## 仓库职责

本仓库同时是 Claude Code 插件市场 `nevis-plugins` 及其首个插件 `nevis-toolkit` 的源码。它不是使用该方法的具体项目，不存放项目需求、实施代码、业务数据或过程日志。

## 命名分层

- **市场**：`nevis-plugins`，用户通过 `claude plugin marketplace add` 注册。
- **插件**：`nevis-toolkit`，是容纳多个技能的容器，决定安装标识与技能命令前缀。
- **技能**：`solution-delivery-loop` 等，位于 `plugins/nevis-toolkit/skills/<skill>/`。

新增技能时在插件内追加技能目录即可；不要为每个技能新建插件，也不要修改插件名或市场名，否则已安装用户的 `enabledPlugins` 键会失效。

## 正式内容位置

- 市场清单：修改 `.claude-plugin/marketplace.json`。
- 插件清单：修改 `plugins/nevis-toolkit/.claude-plugin/plugin.json`。
- 技能执行主干：修改 `plugins/nevis-toolkit/skills/solution-delivery-loop/SKILL.md`。
- 具体方法、字段和检查表：修改该技能目录下的 `references/`。
- 方法论解释：修改 `methodology/solution-delivery-loop.md`。
- 项目介绍和安装说明：修改根目录 `README.md`。

`.claude-plugin/` 下的两份清单是插件与市场元数据，不是构建产物。不要在仓库根目录创建第二份 `SKILL.md`，不要恢复 src、dist、adapter 或构建发布链。

## 插件布局约束

- 每个技能的 `SKILL.md` 必须位于 `skills/<name>/` 下，与 `references/` 同级。
- 技能内部引用使用相对于 `SKILL.md` 的路径，移动技能目录后仍须有效。
- 市场条目的 `source` 必须以 `./` 开头、不含 `..`，并从仓库根解析。
- 市场条目的 `name` 必须与插件清单的 `name` 一致，否则用户无法按名称安装。
- 插件清单一旦设置 `version`，已安装用户就被固定在该版本；发布新版本必须修改这个字符串并打标签。

## 正文与技能同步

方法论与技能不追求逐字一致，但所有影响执行行为的规则必须进入 `SKILL.md` 或其 references。背景解释可以只保留在方法论正文。

修改核心方法时逐条审阅对应执行规则；引用细则不能代替实际读取。CI 的结构和关键词检查只能发现部分问题，不能证明语义完整。

## 安装边界

市场安装只需要 `.claude-plugin/marketplace.json` 与 `plugins/` 下的插件。方法论和仓库维护文档不是插件运行依赖。技能目录也可以独立复制到 `.claude/skills/` 使用。

## 验证

推送前检查：

- 两份清单 JSON 语法有效，必填字段齐全，`name` 一致；
- `claude plugin validate ./plugins/nevis-toolkit` 通过；
- `claude plugin validate .` 通过，确认市场登记与插件安装可用；
- 技能 `SKILL.md` frontmatter 有效；
- Markdown 相对链接可解析；
- 代码块闭合；
- 旧构建路径未回流；
- 工作区无意外生成文件或敏感信息。

## 版本

使用 Git 提交和标签记录版本，并同步 CHANGELOG 与插件清单的 `version`。不自动构建 zip，不维护 Release workflow；历史 `v0.1.0` 保持原貌。

## 安全边界

不得提交密钥、令牌、账号信息、真实业务数据、本地路径中的敏感内容或其他项目的未脱敏验证材料。
