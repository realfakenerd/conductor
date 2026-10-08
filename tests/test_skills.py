"""Validation test suite for Conductor agent skills and plugin manifests."""

import json
import os
import unittest
from pathlib import Path
import yaml

REPO_ROOT = Path(__file__).parent.parent


class TestSkillsAndManifests(unittest.TestCase):
    """Test suite validating all skills, YAML frontmatter, and plugin manifests."""

    def test_plugin_json_manifest(self):
        """plugin.json must exist, be valid JSON, and have non-empty name and description."""
        plugin_file = REPO_ROOT / "plugin.json"
        self.assertTrue(plugin_file.exists(), "plugin.json is missing from repository root")

        with open(plugin_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("name", data, "plugin.json missing 'name' field")
        self.assertIn("description", data, "plugin.json missing 'description' field")
        self.assertEqual(data["name"], "conductor")
        self.assertTrue(isinstance(data["description"], str) and len(data["description"]) > 0)

    def test_marketplace_manifest(self):
        """.claude-plugin/marketplace.json must exist and be valid JSON."""
        marketplace_file = REPO_ROOT / ".claude-plugin" / "marketplace.json"
        self.assertTrue(marketplace_file.exists(), ".claude-plugin/marketplace.json is missing")

        with open(marketplace_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIsInstance(data, dict, "marketplace.json should be a JSON object")

    def test_all_skills_have_valid_frontmatter(self):
        """Each skill in skills/ must have SKILL.md with valid YAML frontmatter containing name and description."""
        skills_dir = REPO_ROOT / "skills"
        self.assertTrue(skills_dir.exists(), "skills directory is missing")

        skill_folders = [p for p in skills_dir.iterdir() if p.is_dir()]
        self.assertGreaterEqual(len(skill_folders), 6, "Expected at least 6 conductor skills")

        for skill_dir in skill_folders:
            skill_name = skill_dir.name
            skill_md = skill_dir / "SKILL.md"
            self.assertTrue(skill_md.exists(), f"{skill_name} is missing SKILL.md")

            content = skill_md.read_text(encoding="utf-8")
            self.assertTrue(
                content.startswith("---"),
                f"{skill_name}/SKILL.md must start with YAML frontmatter delimiters (---)"
            )

            parts = content.split("---", 2)
            self.assertGreaterEqual(
                len(parts), 3,
                f"{skill_name}/SKILL.md must have both opening and closing '---' frontmatter delimiters"
            )

            frontmatter_raw = parts[1]
            data = yaml.safe_load(frontmatter_raw)
            self.assertIsInstance(data, dict, f"{skill_name}/SKILL.md frontmatter must parse to a dict")
            self.assertIn("name", data, f"{skill_name}/SKILL.md frontmatter missing 'name'")
            self.assertIn("description", data, f"{skill_name}/SKILL.md frontmatter missing 'description'")
            self.assertEqual(data["name"], skill_name, f"Skill frontmatter name '{data['name']}' must match directory name '{skill_name}'")
            self.assertTrue(len(data["description"].strip()) > 0, f"{skill_name} description must not be empty")

    def test_skill_assets_integrity(self):
        """Conductor assets, rules, and scripts must exist on disk."""
        self.assertTrue((REPO_ROOT / "assets" / "catalog.md").exists(), "root assets/catalog.md missing")
        self.assertTrue((REPO_ROOT / "rules" / "conductor_standards.md").exists(), "rules/conductor_standards.md missing")
        self.assertTrue((REPO_ROOT / "scripts" / "conductor_engine.py").exists(), "scripts/conductor_engine.py missing")

        setup_dir = REPO_ROOT / "skills" / "conductor-setup"
        self.assertTrue((setup_dir / "assets" / "workflow.md").exists(), "conductor-setup assets/workflow.md missing")
        self.assertTrue((setup_dir / "assets" / "catalog.md").exists(), "conductor-setup assets/catalog.md missing")
        self.assertTrue((setup_dir / "scripts" / "resume.py").exists(), "conductor-setup scripts/resume.py missing")


if __name__ == "__main__":
    unittest.main()
