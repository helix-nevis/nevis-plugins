import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD_PATH = ROOT / "adapters" / "claude-code" / "build.py"
SPEC = importlib.util.spec_from_file_location("skill_build", BUILD_PATH)
build = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = build
SPEC.loader.exec_module(build)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.manifest = build.load_manifest(ROOT / "skill-src" / "manifest.yaml")

    def test_manifest_contains_skill_identity_and_version(self):
        self.assertEqual(self.manifest["skill"]["name"], "solution-delivery-loop")
        self.assertIn("方案收敛与交付闭环", self.manifest["skill"]["description"])
        self.assertRegex(self.manifest["version"], r"^\d+\.\d+\.\d+$")

    def test_all_required_concepts_are_in_execution_source(self):
        source = (ROOT / self.manifest["instructions"]).read_text(encoding="utf-8")
        for concept in self.manifest["required_concepts"]:
            with self.subTest(concept=concept):
                self.assertIn(concept, source)

    def test_build_writes_frontmatter_and_exact_instruction_body(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "skill"
            manifest = dict(self.manifest)
            manifest["output"] = str(output)
            original_resolver = build.resolve_repo_path

            def allow_test_output(value):
                if isinstance(value, str) and value == str(output):
                    return output
                return original_resolver(value)

            build.resolve_repo_path = allow_test_output
            try:
                result = build.build(manifest)
            finally:
                build.resolve_repo_path = original_resolver
            generated = result.read_text(encoding="utf-8")
            source = (ROOT / self.manifest["instructions"]).read_text(encoding="utf-8")
            self.assertTrue(generated.startswith("---\nname: solution-delivery-loop\n"))
            self.assertTrue(generated.endswith(source.rstrip() + "\n"))
            self.assertEqual(generated.count("```") % 2, 0)

    def test_committed_distribution_is_current(self):
        result = subprocess.run(
            [sys.executable, str(BUILD_PATH), "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        diff = subprocess.run(
            ["git", "diff", "--exit-code", "--", "dist/"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        self.assertEqual(diff.returncode, 0, diff.stdout + diff.stderr)

    def test_distribution_has_no_python_cache(self):
        distribution = ROOT / self.manifest["output"]
        self.assertTrue((distribution / "SKILL.md").is_file())
        self.assertFalse(list(distribution.rglob("__pycache__")))


if __name__ == "__main__":
    unittest.main()
