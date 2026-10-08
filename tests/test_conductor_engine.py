"""Unit test suite for Conductor Engine."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT))

from scripts import conductor_engine


class TestConductorEngine(unittest.TestCase):
    """Test suite for scripts/conductor_engine.py."""

    def test_verify_handshake(self):
        """Verify handshake passes when index.md links exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            cond = root / "conductor"
            cond.mkdir()

            # Missing index.md
            res = conductor_engine.verify_handshake(root_dir=tmpdir)
            self.assertFalse(res["valid"])

            # Create index with valid links
            (cond / "product.md").write_text("# Product", encoding="utf-8")
            (cond / "index.md").write_text("# Index\n- [Product](./product.md)\n", encoding="utf-8")

            res = conductor_engine.verify_handshake(root_dir=tmpdir)
            self.assertTrue(res["valid"])
            self.assertEqual(res["total_links"], 1)
            self.assertEqual(len(res["missing_links"]), 0)

            # Broken link
            (cond / "index.md").write_text("# Index\n- [Missing](./missing.md)\n", encoding="utf-8")
            res = conductor_engine.verify_handshake(root_dir=tmpdir)
            self.assertFalse(res["valid"])
            self.assertIn("./missing.md", res["missing_links"])

    def test_init_and_advance_track(self):
        """Test track initialization, metadata creation, plan task progression, and completion."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            cond = root / "conductor"
            cond.mkdir()

            # 1. Initialize track
            track_id = "test_feat_1"
            init_res = conductor_engine.init_track(
                track_id=track_id,
                track_type="feature",
                description="Test feature track",
                root_dir=tmpdir,
            )
            self.assertEqual(init_res["track_id"], track_id)

            meta_file = Path(init_res["metadata_file"])
            self.assertTrue(meta_file.exists())
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            self.assertEqual(meta["status"], "new")

            # Check tracks registry entry
            registry_file = Path(init_res["registry_file"])
            self.assertTrue(registry_file.exists())
            self.assertIn(track_id, registry_file.read_text(encoding="utf-8"))

            # 2. Advance task in plan.md
            plan_file = root / "conductor" / "tracks" / track_id / "plan.md"
            plan_file.write_text(
                "# Plan\n- [ ] Task: Set up db\n- [ ] Task: Write API\n",
                encoding="utf-8",
            )

            # In progress
            adv_res = conductor_engine.advance_task(
                track_id=track_id,
                task_name="Set up db",
                status="in_progress",
                root_dir=tmpdir,
            )
            self.assertTrue(adv_res["updated"])
            content = plan_file.read_text(encoding="utf-8")
            self.assertIn("- [~] Task: Set up db", content)

            # Done with SHA
            adv_res = conductor_engine.advance_task(
                track_id=track_id,
                task_name="Set up db",
                status="done",
                sha="abc1234567",
                root_dir=tmpdir,
            )
            self.assertTrue(adv_res["updated"])
            content = plan_file.read_text(encoding="utf-8")
            self.assertIn("- [x] Task: Set up db [abc1234]", content)

            # 3. Complete track
            comp_res = conductor_engine.complete_track(track_id=track_id, root_dir=tmpdir)
            self.assertEqual(comp_res["status"], "complete")

            updated_meta = json.loads(meta_file.read_text(encoding="utf-8"))
            self.assertEqual(updated_meta["status"], "complete")

            reg_content = registry_file.read_text(encoding="utf-8")
            self.assertIn("- [x] **Track: Test feature track**", reg_content)

    def test_cli_execution(self):
        """Test engine CLI execution via subprocess."""
        script_path = str(REPO_ROOT / "scripts" / "conductor_engine.py")
        res = subprocess.run([sys.executable, script_path, "resume"], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout)
        self.assertIn("setup_complete", data)
        self.assertIn("checklist", data)


if __name__ == "__main__":
    unittest.main()
