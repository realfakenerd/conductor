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

    def test_track_lifecycle_start_and_reset(self):
        """Test starting and resetting track lifecycle state."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            track_id = "test_lifecycle_track"
            conductor_engine.init_track(
                track_id=track_id,
                track_type="refactor",
                description="Lifecycle test",
                root_dir=tmpdir,
            )

            meta_file = root / "conductor" / "tracks" / track_id / "metadata.json"
            reg_file = root / "conductor" / "tracks.md"

            # Initial status is new / [ ]
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            self.assertEqual(meta["status"], "new")
            self.assertIn("- [ ] **Track: Lifecycle test**", reg_file.read_text(encoding="utf-8"))

            # Start track -> in_progress / [~]
            start_res = conductor_engine.start_track(track_id=track_id, root_dir=tmpdir)
            self.assertEqual(start_res["status"], "in_progress")
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            self.assertEqual(meta["status"], "in_progress")
            self.assertIn("- [~] **Track: Lifecycle test**", reg_file.read_text(encoding="utf-8"))

            # Reset track -> pending / [ ]
            reset_res = conductor_engine.reset_track(track_id=track_id, root_dir=tmpdir)
            self.assertEqual(reset_res["status"], "new")
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            self.assertEqual(meta["status"], "new")
            self.assertIn("- [ ] **Track: Lifecycle test**", reg_file.read_text(encoding="utf-8"))

    def test_list_tracks_and_get_project_status(self):
        """Test deterministic track listing and project status inspection."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            # Create two tracks
            conductor_engine.init_track("t1", "feature", "Track 1", root_dir=tmpdir)
            conductor_engine.init_track("t2", "bug", "Track 2", root_dir=tmpdir)

            # Complete track 1
            conductor_engine.complete_track("t1", root_dir=tmpdir)
            # Start track 2
            conductor_engine.start_track("t2", root_dir=tmpdir)

            # Create plan for track 2
            plan2 = root / "conductor" / "tracks" / "t2" / "plan.md"
            plan2.write_text(
                "# Plan\n## Phase 1\n- [x] Task: Step 1 [sha1]\n- [~] Task: Step 2\n- [ ] Task: Step 3\n",
                encoding="utf-8",
            )

            # List tracks
            tracks = conductor_engine.list_tracks(root_dir=tmpdir)
            self.assertEqual(len(tracks), 2)
            self.assertEqual(tracks[0]["track_id"], "t1")
            self.assertEqual(tracks[0]["status"], "complete")
            self.assertEqual(tracks[1]["track_id"], "t2")
            self.assertEqual(tracks[1]["status"], "in_progress")

            # Get project status
            status = conductor_engine.get_project_status(root_dir=tmpdir)
            self.assertEqual(status["tracks"]["total"], 2)
            self.assertEqual(status["tracks"]["complete"], 1)
            self.assertEqual(status["tracks"]["in_progress"], 1)
            self.assertEqual(status["active_track"]["track_id"], "t2")
            self.assertEqual(status["active_track"]["current_task"], "Step 2")
            self.assertEqual(status["active_track"]["next_pending_task"], "Step 3")
            self.assertEqual(status["active_track"]["total_tasks"], 3)
            self.assertEqual(status["active_track"]["completed_tasks"], 1)
            self.assertEqual(status["active_track"]["progress_percent"], 33.3)

    def test_cli_status_and_lifecycle(self):
        """Test CLI subcommands list, status, track start, track reset."""
        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = str(REPO_ROOT / "scripts" / "conductor_engine.py")
            # Init track via CLI
            res = subprocess.run(
                [sys.executable, script_path, "track", "init", "cli_t", "--type", "feature", "--description", "CLI Track", "--root-dir", tmpdir],
                capture_output=True, text=True,
            )
            self.assertEqual(res.returncode, 0)

            # Start track via CLI
            res = subprocess.run(
                [sys.executable, script_path, "track", "start", "cli_t", "--root-dir", tmpdir],
                capture_output=True, text=True,
            )
            self.assertEqual(res.returncode, 0)
            data = json.loads(res.stdout)
            self.assertEqual(data["status"], "in_progress")

            # Status via CLI --json
            res = subprocess.run(
                [sys.executable, script_path, "status", "--root-dir", tmpdir, "--json"],
                capture_output=True, text=True,
            )
            self.assertEqual(res.returncode, 0)
            status_data = json.loads(res.stdout)
            self.assertEqual(status_data["tracks"]["in_progress"], 1)

            # List via CLI --json
            res = subprocess.run(
                [sys.executable, script_path, "list", "--root-dir", tmpdir, "--json"],
                capture_output=True, text=True,
            )
            self.assertEqual(res.returncode, 0)
            list_data = json.loads(res.stdout)
            self.assertEqual(len(list_data), 1)
            self.assertEqual(list_data[0]["track_id"], "cli_t")


if __name__ == "__main__":
    unittest.main()
