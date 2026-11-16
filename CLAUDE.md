# 仓库维护约定

## 仓库职责

本仓库维护“方案收敛与交付闭环工作法”及一个可直接安装的 Claude Code Skill。它不是使用该方法的具体项目，不存放项目需求、实施代码、业务数据或过程日志。

## 正式内容位置

- 方法论解释：修改 `methodology/solution-delivery-loop.md`。
- Skill 执行主干：直接修改 `solution-delivery-loop/SKILL.md`。
- 具体方法、字段和检查表：直接修改 `solution-delivery-loop/references/`。
- 项目介绍和安装说明：修改根目录 `README.md`。

只有内层 `solution-delivery-loop/` 是正式 Skill。不要在仓库根目录创建第二份 `SKILL.md`，不要恢复 src、dist、adapter、manifest 或构建发布链。

## 正文与 Skill 同步

方法论与 Skill 不追求逐字一致，但所有影响执行行为的规则必须进入 `SKILL.md` 或其 references。背景解释可以只保留在方法论正文。

修改核心方法时逐条审阅对应执行规则；引用细则不能代替实际读取。CI 的结构和关键词检查只能发现部分问题，不能证明语义完整。

## 安装边界

安装只需要内层 `solution-delivery-loop/`。所有 Skill 内部引用使用相对于 `SKILL.md` 的路径，复制该目录后仍须有效。方法论和仓库维护文档不应成为 Skill 运行依赖。

## 验证

推送前检查：

- `solution-delivery-loop/SKILL.md` frontmatter 有效；
- Markdown 相对链接可解析；
- 代码块闭合；
- 旧构建路径未回流；
- 工作区无意外生成文件或敏感信息。

## 版本

使用 Git 提交和标签记录版本。发布前更新 `CHANGELOG.md`。不自动构建 zip，不维护 Release workflow；历史 `v0.1.0` 保持原貌。

## 安全边界

不得提交密钥、令牌、账号信息、真实业务数据、本地路径中的敏感内容或其他项目的未脱敏验证材料。
