"""Tests for Conductor setup resumption detection script."""

import os
import sys
import unittest
from pathlib import Path

# Add script directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "skills", "conductor-setup", "scripts")))

import resume


class TestResumeScript(unittest.TestCase):
    """Test suite for resume.py determine_resumption logic."""

    def test_greenfield_uninitialized(self):
        """When conductor/ does not exist, all checklist items should be False and next step Product Definition."""
        original_cwd = os.getcwd()
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                os.chdir(tmpdir)
                result = resume.determine_resumption()
                self.assertFalse(result["setup_complete"])
                self.assertEqual(result["next_step"]["step"], "Product Definition")
                self.assertEqual(result["next_step"]["file"], "product.md")
                for key, val in result["checklist"].items():
                    self.assertFalse(val, f"Expected {key} to be False in greenfield state")
            finally:
                os.chdir(original_cwd)

    def test_partial_setup_progression(self):
        """When some artifacts exist, next_step should point to the first missing artifact in sequence."""
        original_cwd = os.getcwd()
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                os.chdir(tmpdir)
                cond_dir = Path("conductor")
                cond_dir.mkdir()

                # Step 1 present
                (cond_dir / "product.md").write_text("# Product", encoding="utf-8")
                res = resume.determine_resumption()
                self.assertFalse(res["setup_complete"])
                self.assertEqual(res["next_step"]["step"], "Product Guidelines")
                self.assertEqual(res["next_step"]["file"], "product-guidelines.md")

                # Step 2 present
                (cond_dir / "product-guidelines.md").write_text("# Guidelines", encoding="utf-8")
                res = resume.determine_resumption()
                self.assertEqual(res["next_step"]["step"], "Technology Stack")
                self.assertEqual(res["next_step"]["file"], "tech-stack.md")

                # Step 3 present
                (cond_dir / "tech-stack.md").write_text("# Tech Stack", encoding="utf-8")
                res = resume.determine_resumption()
                self.assertEqual(res["next_step"]["step"], "Code Style Guides")
                self.assertEqual(res["next_step"]["file"], "code_styleguides")

                # Step 4 present
                (cond_dir / "code_styleguides").mkdir()
                res = resume.determine_resumption()
                self.assertEqual(res["next_step"]["step"], "Workflow Configuration")
                self.assertEqual(res["next_step"]["file"], "workflow.md")
            finally:
                os.chdir(original_cwd)

    def test_complete_setup(self):
        """When all artifacts and index.md exist, setup_complete should be True and next_step None."""
        original_cwd = os.getcwd()
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                os.chdir(tmpdir)
                cond_dir = Path("conductor")
                cond_dir.mkdir()
                (cond_dir / "product.md").write_text("# Product", encoding="utf-8")
                (cond_dir / "product-guidelines.md").write_text("# Guidelines", encoding="utf-8")
                (cond_dir / "tech-stack.md").write_text("# Tech Stack", encoding="utf-8")
                (cond_dir / "code_styleguides").mkdir()
                (cond_dir / "workflow.md").write_text("# Workflow", encoding="utf-8")
                (cond_dir / "index.md").write_text("# Index", encoding="utf-8")

                res = resume.determine_resumption()
                self.assertTrue(res["setup_complete"])
                self.assertIsNone(res["next_step"])
                for key, val in res["checklist"].items():
                    self.assertTrue(val, f"Expected {key} to be True in complete state")
            finally:
                os.chdir(original_cwd)

    def test_custom_root_dir(self):
        """determine_resumption should accept an optional root_dir argument without changing cwd."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            cond_dir = Path(tmpdir) / "conductor"
            cond_dir.mkdir()
            (cond_dir / "product.md").write_text("# Product", encoding="utf-8")

            res = resume.determine_resumption(root_dir=tmpdir)
            self.assertFalse(res["setup_complete"])
            self.assertEqual(res["next_step"]["step"], "Product Guidelines")



if __name__ == "__main__":
    unittest.main()
