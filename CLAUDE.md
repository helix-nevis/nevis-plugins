# 仓库维护约定

## 仓库职责

本仓库维护“方案收敛与交付闭环工作法”及其 Claude Code Skill 发布结果。它不是使用该方法的具体项目，不存放项目需求、实施代码、业务数据或过程日志。

## 修改位置

- 方法论解释与完整规则：修改 `methodology/solution-delivery-loop.md`。
- 智能体执行规则：修改 `skill-src/instructions.md`。
- Skill 名称、描述、版本及必要规则清单：修改 `skill-src/manifest.yaml`。
- 构建和校验：修改 `adapters/claude-code/build.py` 与 `tests/`。
- `dist/`：只能由构建器生成，不直接修改生成的 `SKILL.md`。

## 同步原则

方法论与 Skill 不追求逐字一致，但必须保持核心规则一致。方法论修改后检查执行源；执行适配不得引入与方法论冲突的新规则。

必要规则检查只能发现明显遗漏，不能替代语义审阅。涉及核心流程变化时，在提交说明中同时描述方法论与 Skill 的变化。

## 验证

```bash
python adapters/claude-code/build.py --check
python -m unittest discover -s tests -v
git diff --exit-code -- dist/
```

## 发布

发布版本由 `skill-src/manifest.yaml` 的 `version` 与 Git tag 共同标识。发布前更新 `CHANGELOG.md`，确保构建产物已同步。Release 只打包 `dist/solution-delivery-loop/`。

## 安全边界

不得提交密钥、令牌、账号信息、真实业务数据、本地路径中的敏感内容或其他项目的未脱敏验证材料。
