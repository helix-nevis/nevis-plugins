# 用户输入来源索引

插件通过 `UserPromptSubmit` command hook 执行 `capture-input.mjs`。开发源码是 `capture-input.ts`，运行时无需 TypeScript 编译器、不使用 npx、不安装第三方 SQLite 包。维护时须同步源码与运行文件。

## 加载验证

要求 PATH 中有 Node.js 22.13.0 或更高的受支持版本，内置 `node:sqlite`。原生 Claude Code 不保证自带可供 Hook 使用的 Node.js，须自行安装。Hook 仅抑制 SQLite 的 ExperimentalWarning，其他错误仍可见。

从终端加载本地开发版插件：

```bash
claude --plugin-dir E:/solution-delivery-loop/plugins/nevis-toolkit
```

在测试项目发送普通消息。脚本从事件 cwd 向上查找最近的 `.proj/` 或 Git 根目录；都不存在时使用 cwd，自动创建 `.proj/sources/messages.sqlite3`。加载后对该会话每条 UserPromptSubmit 输入生效。

每次捕获新增一行 messages：capture_id、captured_at（UTC）、session_id、可选 prompt_id、transcript_path、cwd、prompt_sha256、source_instance_id。不存正文、摘要、业务关联或处理进度，不调用模型。

source_instance_id 是该索引数据库的稳定身份，不代表机器或客户端身份。复制数据库保留它，不同项目数据库会生成不同身份。捕获 ID 为 UUID；重复文本不会合并。重试事件去重尚未实现。

## 并发和失败

使用 WAL、FULL synchronous、短事务、500 毫秒 busy_timeout 和约 10 秒的锁等待重试。Hook 超时配置为 15 秒。成功静默；失败打印不含事件内容的通用错误并退出 1，不主动阻断输入。

多 worktree 不会自动共享数据库。只保证按上述项目根查找规则定位本机数据库，不实现跨机器同步。

## 验证范围

本次尚未执行 Node 运行测试、TypeScript 类型检查和并发测试：自动审批服务不可用，执行工具未能运行。文件存在不代表运行已验证。旧 Python 实现已删除。

## 边界

这里只登记来源索引。transcript 可能异步写入；prompt_id 不假定等于 transcript 的消息 UUID。准确取回原消息、附件、导出与迁移合并尚未实现。

数据库及 WAL/SHM 文件不是供 Git 合并的普通文本。不要在写入期间只复制主数据库做备份，后续导出应通过 SQLite 备份接口生成一致快照。

未修改用户全局设置，未安装插件或发布版本。已安装市场缓存不包含工作区修改，需加载本地开发版验证。
