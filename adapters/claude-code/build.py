# 方案收敛与交付闭环工作法 Skill 构建器
# 仅使用 Python 标准库；manifest 是本仓库受信任的构建输入。

from __future__ import annotations

import argparse
import ast
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "skill-src" / "manifest.yaml"


def scalar(value: str) -> object:
    value = value.strip()
    if value.startswith("[") or value.startswith("{"):
        return ast.literal_eval(value)
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def load_manifest(path: Path) -> dict:
    """读取本构建器使用的 YAML 子集：嵌套映射、字符串和字符串列表。"""
    root: dict = {}
    stack: list[tuple[int, dict | list]] = [(-1, root)]
    for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if "\t" in raw[: len(raw) - len(raw.lstrip())]:
            raise ValueError(f"{path.name}:{line_no}: 缩进不能使用 Tab")
        indent = len(raw) - len(raw.lstrip(" "))
        text = raw.strip()
        while stack and indent <= stack[-1][0]:
            stack.pop()
        if not stack:
            raise ValueError(f"{path.name}:{line_no}: 缩进无效")
        parent = stack[-1][1]
        if text.startswith("- "):
            if not isinstance(parent, list):
                raise ValueError(f"{path.name}:{line_no}: 列表位置无效")
            item = scalar(text[2:])
            if not isinstance(item, str):
                raise ValueError(f"{path.name}:{line_no}: 列表仅支持字符串")
            parent.append(item)
            continue
        if ":" not in text or not isinstance(parent, dict):
            raise ValueError(f"{path.name}:{line_no}: 应为 key: value")
        key, value = text.split(":", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"{path.name}:{line_no}: 键不能为空")
        if value.strip():
            parent[key] = scalar(value)
        else:
            # 本仓库只有 required_concepts 使用块列表，其余为空值则创建映射。
            next_container: dict | list = [] if key == "required_concepts" else {}
            parent[key] = next_container
            stack.append((indent, next_container))
    return root


def resolve_repo_path(value: object) -> Path:
    if not isinstance(value, str) or not value:
        raise ValueError("仓库路径必须是非空字符串")
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"路径不能离开仓库：{value}")
    return path


def frontmatter(manifest: dict) -> str:
    skill = manifest.get("skill")
    if not isinstance(skill, dict):
        raise ValueError("manifest 缺少 skill 映射")
    name = skill.get("name")
    description = skill.get("description")
    if not isinstance(name, str) or not name:
        raise ValueError("skill.name 不能为空")
    if not isinstance(description, str) or not description:
        raise ValueError("skill.description 不能为空")
    # 当前描述不含 YAML 特殊换行；显式拒绝多行，保证 frontmatter 可解析。
    if "\n" in description or "\r" in description:
        raise ValueError("description 暂不支持多行")
    return f"---\nname: {name}\ndescription: {description}\n---\n\n"


def build(manifest: dict) -> Path:
    instructions_path = resolve_repo_path(manifest.get("instructions"))
    output = resolve_repo_path(manifest.get("output"))
    instructions = instructions_path.read_text(encoding="utf-8-sig").rstrip() + "\n"
    if instructions.startswith("---"):
        raise ValueError("instructions.md 不应包含 frontmatter")
    if not instructions.strip():
        raise ValueError("instructions.md 不能为空")
    output.mkdir(parents=True, exist_ok=True)
    skill_path = output / "SKILL.md"
    skill_path.write_text(
        frontmatter(manifest) + instructions.strip() + "\n",
        encoding="utf-8",
        newline="\n",
    )

    references = ROOT / "skill-src" / "references"
    target_references = output / "references"
    if target_references.exists():
        shutil.rmtree(target_references)
    if references.exists():
        shutil.copytree(references, target_references)
    return skill_path


def validate(manifest: dict) -> list[str]:
    messages: list[str] = []
    version = manifest.get("version")
    if not isinstance(version, str) or not version:
        raise ValueError("version 不能为空")
    for key in ("methodology", "instructions"):
        path = resolve_repo_path(manifest.get(key))
        if not path.is_file():
            raise ValueError(f"文件不存在：{path.relative_to(ROOT)}")
    instructions = resolve_repo_path(manifest["instructions"]).read_text(encoding="utf-8")
    missing = [item for item in manifest.get("required_concepts", []) if item not in instructions]
    if missing:
        raise ValueError("执行源缺少必要规则：\n- " + "\n- ".join(missing))
    skill_path = build(manifest)
    generated = skill_path.read_text(encoding="utf-8")
    if not generated.startswith("---\n") or generated.count("---") < 2:
        raise ValueError("生成结果缺少有效 frontmatter")
    messages.append(f"必要规则：{len(manifest.get('required_concepts', []))} 项通过")
    messages.append(f"生成文件：{skill_path.relative_to(ROOT).as_posix()}")
    messages.append(f"发布版本：v{version}")
    return messages


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="校验源文件并重建发布产物")
    args = parser.parse_args()
    try:
        manifest = load_manifest(MANIFEST)
        messages = validate(manifest) if args.check else [f"已生成：{build(manifest).relative_to(ROOT).as_posix()}"]
    except (OSError, ValueError) as exc:
        print(f"构建失败：{exc}", file=sys.stderr)
        return 1
    for message in messages:
        print(message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
