"""Conductor Engine: Deterministic state engine for Spec-Driven Development workflows."""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def determine_resumption(root_dir="."):
    """Checks existing setup artifacts and returns the next unblocked step."""
    conductor_dir = os.path.join(root_dir, "conductor")
    files = [
        "product.md",
        "product-guidelines.md",
        "tech-stack.md",
        "code_styleguides",
        "workflow.md",
    ]

    checklist = {}
    for filename in files:
        path = os.path.join(conductor_dir, filename)
        checklist[filename] = os.path.exists(path)

    setup_complete = os.path.exists(os.path.join(conductor_dir, "index.md"))
    next_step = None

    chain = [
        ("product.md", "Product Definition"),
        ("product-guidelines.md", "Product Guidelines"),
        ("tech-stack.md", "Technology Stack"),
        ("code_styleguides", "Code Style Guides"),
        ("workflow.md", "Workflow Configuration"),
    ]

    for filename, step_name in chain:
        if not checklist[filename]:
            next_step = {
                "step": step_name,
                "file": filename,
            }
            break

    return {
        "setup_complete": setup_complete,
        "checklist": checklist,
        "next_step": next_step,
    }


class IntegrityAuditor:
    """Verifies workspace integrity, link validity, track parity, and git commit reconciliation."""

    def __init__(self, root_dir="."):
        self.root_dir = Path(root_dir)
        self.conductor_dir = self.root_dir / "conductor"
        self.index_file = self.conductor_dir / "index.md"
        self.tracks_dir = self.conductor_dir / "tracks"
        self.registry_file = self.conductor_dir / "tracks.md"

    def audit(self, fast=False):
        """Audits workspace. If fast=True, skips track parity and git commit checks."""
        if not self.index_file.exists():
            return {
                "valid": False,
                "error": "Missing conductor/index.md handshake",
                "missing_links": [],
                "broken_tracks": [],
                "ghost_commits": [],
            }

        # 1. Handshake link validation
        content = self.index_file.read_text(encoding="utf-8")
        link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
        links = link_pattern.findall(content)

        missing_links = []
        for link in links:
            if link.startswith("http") or link.startswith("#"):
                continue
            target = (self.conductor_dir / link).resolve()
            if not target.exists():
                missing_links.append(link)

        if fast:
            return {
                "valid": len(missing_links) == 0,
                "total_links": len(links),
                "missing_links": missing_links,
                "broken_tracks": [],
                "ghost_commits": [],
            }

        # 2. Track parity validation
        broken_tracks = []
        if self.registry_file.exists():
            reg_content = self.registry_file.read_text(encoding="utf-8")
            track_pattern = re.compile(r"-\s*\[([ x~])\]\s*\*\*Track:\s*(.*?)\*\*\s*\n\s*\*Link:\s*\[\./tracks/(.*?)/index\.md\]")
            for marker, title, tid in track_pattern.findall(reg_content):
                track_dir = self.tracks_dir / tid
                track_idx = track_dir / "index.md"
                track_meta = track_dir / "metadata.json"

                reasons = []
                if not track_dir.exists():
                    reasons.append("Missing workspace directory")
                if not track_idx.exists():
                    reasons.append("Missing index.md")
                if not track_meta.exists():
                    reasons.append("Missing metadata.json")

                if reasons:
                    broken_tracks.append({
                        "track_id": tid,
                        "title": title.strip(),
                        "reasons": reasons,
                    })

        # 3. Git commit reconciliation across track plans
        ghost_commits = []
        sha_task_regex = re.compile(r"^-\s*\[x\]\s*Task:\s*(.*?)\s*\[([a-f0-9]{7,40})\]")

        def commit_exists(commit_sha):
            try:
                cmd = ["git", "cat-file", "-e", f"{commit_sha}^{{commit}}"]
                res = subprocess.run(cmd, cwd=str(self.root_dir), capture_output=True, text=True)
                return res.returncode == 0
            except Exception:
                return True

        if self.tracks_dir.exists():
            for t_dir in self.tracks_dir.iterdir():
                if t_dir.is_dir():
                    plan_file = t_dir / "plan.md"
                    if plan_file.exists():
                        plan_lines = plan_file.read_text(encoding="utf-8").splitlines()
                        for line in plan_lines:
                            m = sha_task_regex.match(line.strip())
                            if m:
                                task_title = m.group(1).strip()
                                sha = m.group(2)
                                if not commit_exists(sha):
                                    ghost_commits.append({
                                        "track_id": t_dir.name,
                                        "task": task_title,
                                        "sha": sha,
                                    })

        is_valid = (len(missing_links) == 0 and len(broken_tracks) == 0 and len(ghost_commits) == 0)

        return {
            "valid": is_valid,
            "total_links": len(links),
            "missing_links": missing_links,
            "broken_tracks": broken_tracks,
            "ghost_commits": ghost_commits,
        }


def verify_handshake(root_dir=".", fast=False):
    """Verifies that conductor/index.md exists and validates workspace integrity."""
    auditor = IntegrityAuditor(root_dir=root_dir)
    return auditor.audit(fast=fast)



class EngineError(Exception):
    """Base exception for deterministic conductor engine errors."""
    pass


class TrackRepository:
    """Encapsulates track state persistence across tracks.md and metadata.json with atomic rollback."""

    def __init__(self, root_dir="."):
        self.root_dir = Path(root_dir)
        self.conductor_dir = self.root_dir / "conductor"
        self.tracks_dir = self.conductor_dir / "tracks"
        self.registry_path = self.conductor_dir / "tracks.md"

    def list_tracks(self):
        """Returns structured list of registered tracks."""
        if not self.registry_path.exists():
            return []

        content = self.registry_path.read_text(encoding="utf-8")
        pattern = re.compile(r"-\s*\[([ x~])\]\s*\*\*Track:\s*(.*?)\*\*\s*\n\s*\*Link:\s*\[\./tracks/(.*?)/index\.md\]")
        matches = pattern.findall(content)

        status_map = {
            " ": "new",
            "~": "in_progress",
            "x": "complete",
        }

        tracks = []
        for marker, title, track_id in matches:
            track_info = {
                "track_id": track_id,
                "title": title.strip(),
                "status": status_map.get(marker, "new"),
                "path": f"tracks/{track_id}",
            }
            meta_file = self.tracks_dir / track_id / "metadata.json"
            if meta_file.exists():
                try:
                    meta = json.loads(meta_file.read_text(encoding="utf-8"))
                    track_info["type"] = meta.get("type")
                    track_info["created_at"] = meta.get("created_at")
                    track_info["updated_at"] = meta.get("updated_at")
                except Exception:
                    pass
            tracks.append(track_info)

        return tracks

    def get_track(self, track_id):
        """Returns track info dictionary or None."""
        for t in self.list_tracks():
            if t["track_id"] == track_id:
                return t
        return None

    def resolve_track(self, query=None):
        """Resolves track target deterministically by exact ID, query search, or next incomplete track."""
        all_tracks = self.list_tracks()
        if not all_tracks:
            return {"status": "none", "track": None, "candidates": []}

        if query:
            q_clean = query.strip().lower()
            # 1. Exact ID match
            for t in all_tracks:
                if t["track_id"].lower() == q_clean:
                    return {"status": "matched", "track": t, "candidates": []}

            # 2. Substring match across ID and Title
            matches = [
                t for t in all_tracks
                if q_clean in t["track_id"].lower() or q_clean in t["title"].lower()
            ]

            if len(matches) == 1:
                return {"status": "matched", "track": matches[0], "candidates": []}
            elif len(matches) > 1:
                return {"status": "ambiguous", "track": None, "candidates": matches}
            else:
                return {"status": "not_found", "track": None, "candidates": []}

        # No query: return first incomplete track (in_progress first, then new/pending)
        for t in all_tracks:
            if t["status"] == "in_progress":
                return {"status": "matched", "track": t, "candidates": []}

        for t in all_tracks:
            if t["status"] in ("new", "pending"):
                return {"status": "matched", "track": t, "candidates": []}

        return {"status": "all_complete", "track": None, "candidates": []}

    def init_track(self, track_id, track_type, description):
        """Initializes workspace, metadata.json, and appends to tracks registry with rollback."""
        track_workspace = self.tracks_dir / track_id
        self.tracks_dir.mkdir(parents=True, exist_ok=True)
        track_workspace.mkdir(parents=True, exist_ok=True)

        now_iso = datetime.now().astimezone().isoformat()
        metadata = {
            "track_id": track_id,
            "type": track_type.lower(),
            "status": "new",
            "created_at": now_iso,
            "updated_at": now_iso,
            "description": description,
        }

        metadata_path = track_workspace / "metadata.json"
        entry = f"\n---\n- [ ] **Track: {description}**\n  *Link: [./tracks/{track_id}/index.md](./tracks/{track_id}/index.md)*\n"

        prev_registry = self.registry_path.read_text(encoding="utf-8") if self.registry_path.exists() else None
        prev_meta = metadata_path.read_text(encoding="utf-8") if metadata_path.exists() else None

        try:
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
            if not self.registry_path.exists():
                self.registry_path.write_text(f"# Tracks Registry\n{entry}", encoding="utf-8")
            else:
                existing = self.registry_path.read_text(encoding="utf-8")
                if track_id not in existing:
                    self.registry_path.write_text(existing + entry, encoding="utf-8")
        except Exception as e:
            if prev_meta is not None:
                metadata_path.write_text(prev_meta, encoding="utf-8")
            elif metadata_path.exists():
                metadata_path.unlink()
            if prev_registry is not None:
                self.registry_path.write_text(prev_registry, encoding="utf-8")
            elif self.registry_path.exists():
                self.registry_path.unlink()
            raise EngineError(f"Failed to initialize track '{track_id}': {e}") from e

        return {
            "track_id": track_id,
            "workspace": str(track_workspace),
            "metadata_file": str(metadata_path),
            "registry_file": str(self.registry_path),
            "status": "new",
        }

    def _transition_track(self, track_id, new_status, marker):
        """Atomically transitions track status in tracks.md and metadata.json with rollback."""
        metadata_path = self.tracks_dir / track_id / "metadata.json"
        if not metadata_path.exists():
            raise EngineError(f"Track '{track_id}' not found: missing metadata.json at {metadata_path}")

        prev_meta_text = metadata_path.read_text(encoding="utf-8")
        prev_registry_text = self.registry_path.read_text(encoding="utf-8") if self.registry_path.exists() else None

        try:
            meta = json.loads(prev_meta_text)
            meta["status"] = new_status
            meta["updated_at"] = datetime.now().astimezone().isoformat()
            new_meta_text = json.dumps(meta, indent=2)

            new_registry_text = prev_registry_text
            if prev_registry_text:
                pattern = re.compile(rf"-\s*\[[ x~]\]\s*(\*\*Track:.*?\*\*\s*\n\s*\*Link:\s*\[\./tracks/{re.escape(track_id)}/index\.md\])")
                if not pattern.search(prev_registry_text):
                    raise EngineError(f"Track '{track_id}' not registered in tracks.md")
                new_registry_text = pattern.sub(rf"- [{marker}] \1", prev_registry_text)

            # Atomic dual-write
            if new_registry_text is not None:
                self.registry_path.write_text(new_registry_text, encoding="utf-8")
            metadata_path.write_text(new_meta_text, encoding="utf-8")

        except Exception as e:
            # Rollback both files on failure
            if prev_registry_text is not None and self.registry_path.exists():
                try:
                    self.registry_path.write_text(prev_registry_text, encoding="utf-8")
                except Exception:
                    pass
            if metadata_path.exists():
                try:
                    metadata_path.write_text(prev_meta_text, encoding="utf-8")
                except Exception:
                    pass
            if isinstance(e, EngineError):
                raise
            raise EngineError(f"Failed to transition track '{track_id}' to '{new_status}': {e}") from e

        return {
            "track_id": track_id,
            "status": new_status,
        }

    def start_track(self, track_id):
        return self._transition_track(track_id, "in_progress", "~")

    def complete_track(self, track_id):
        return self._transition_track(track_id, "complete", "x")

    def reset_track(self, track_id):
        return self._transition_track(track_id, "new", " ")


def init_track(track_id, track_type, description, root_dir="."):
    """Initializes a new track workspace, metadata.json, and updates tracks registry."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.init_track(track_id, track_type, description)


class PlanDocument:
    """Represents a track's plan.md as a parsed AST, supporting non-destructive mutations and metrics."""

    def __init__(self, content, file_path=None):
        self.raw_content = content
        self.file_path = Path(file_path) if file_path else None
        self.lines = content.splitlines()

    @classmethod
    def from_file(cls, path):
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Plan file not found: {p}")
        return cls(p.read_text(encoding="utf-8"), file_path=p)

    def summary(self):
        """Calculates plan progress metrics, phases, and current state."""
        phases = []
        tasks = []
        current_phase_name = None

        phase_regex = re.compile(r"^##\s+(?:Phase\s+\d+:?\s*)?(.*?)(?:\s*\[.*\])?$")
        task_regex = re.compile(r"^-\s*\[([ x~])\]\s*Task:\s*(.*?)(?:\s*\[[a-f0-9]+\])?$")

        for line in self.lines:
            line_str = line.strip()
            phase_m = phase_regex.match(line_str)
            if phase_m:
                current_phase_name = phase_m.group(1).strip()
                phases.append(current_phase_name)
                continue

            task_m = task_regex.match(line_str)
            if task_m:
                marker = task_m.group(1)
                task_desc = task_m.group(2).strip()
                status = "complete" if marker == "x" else ("in_progress" if marker == "~" else "pending")
                tasks.append({
                    "phase": current_phase_name,
                    "task": task_desc,
                    "status": status,
                })

        total = len(tasks)
        completed = sum(1 for t in tasks if t["status"] == "complete")
        in_progress = sum(1 for t in tasks if t["status"] == "in_progress")
        pending = sum(1 for t in tasks if t["status"] == "pending")

        current_task = next((t["task"] for t in tasks if t["status"] == "in_progress"), None)
        current_phase = next((t["phase"] for t in tasks if t["status"] == "in_progress"), None)
        next_pending = next((t["task"] for t in tasks if t["status"] == "pending"), None)

        percent = round((completed / total) * 100, 1) if total > 0 else 0.0

        return {
            "phases": phases,
            "tasks": tasks,
            "total_tasks": total,
            "completed_tasks": completed,
            "in_progress_tasks": in_progress,
            "pending_tasks": pending,
            "current_phase": current_phase,
            "current_task": current_task,
            "next_pending_task": next_pending,
            "progress_percent": percent,
        }

    def advance(self, task_name, status, sha=None):
        """Non-destructively updates a task's marker and SHA in self.lines."""
        marker_map = {
            "pending": "[ ]",
            "in_progress": "[~]",
            "done": "[x]",
            "complete": "[x]",
        }
        target_marker = marker_map.get(status, "[~]")

        task_regex = re.compile(rf"^(\s*-\s*)\[[ x~]\](\s*Task:\s*{re.escape(task_name)})(?:\s*\[[a-f0-9]+\])?(.*)$")
        updated = False
        new_lines = []

        for line in self.lines:
            m = task_regex.match(line)
            if m:
                indent_prefix = m.group(1)
                task_part = m.group(2)
                trailing = m.group(3) or ""
                sha_part = f" [{sha[:7]}]" if (target_marker == "[x]" and sha) else ""
                new_line = f"{indent_prefix}{target_marker}{task_part}{sha_part}{trailing}"
                new_lines.append(new_line)
                updated = True
            else:
                new_lines.append(line)

        if not updated:
            raise EngineError(f"Task '{task_name}' not found in plan")

        self.lines = new_lines
        self.raw_content = "\n".join(self.lines) + ("\n" if self.lines else "")
        return True

    def checkpoint(self, phase_name, sha):
        """Non-destructively records [checkpoint: <sha>] on the specified phase heading and completes any checkpoint task."""
        sha_short = sha[:7]
        clean_phase = phase_name.strip()
        # Normalizes matching whether caller passes "Phase 1: Foo" or just "Foo"
        header_regex = re.compile(rf"^(##\s+(?:Phase\s+\d+:?\s*)?{re.escape(clean_phase)})(?:\s*\[checkpoint:\s*[a-f0-9]+\])?(.*)$", re.IGNORECASE)

        # Fallback regex if clean_phase starts with "Phase N"
        simple_regex = None
        if re.match(r"^Phase\s+\d+", clean_phase, re.IGNORECASE):
            phase_num_prefix = re.match(r"^(Phase\s+\d+)", clean_phase, re.IGNORECASE).group(1)
            simple_regex = re.compile(rf"^(##\s+{phase_num_prefix}.*?)(?:\s*\[checkpoint:\s*[a-f0-9]+\])?(.*)$", re.IGNORECASE)

        updated_header = False
        new_lines = []
        in_target_phase = False

        checkpoint_task_regex = re.compile(r"^(\s*-\s*)\[[ x~]\](\s*Task:\s*Phase Verification & Checkpoint(?: \(.*?\))?)(?:\s*\[[a-f0-9]+\])?(.*)$", re.IGNORECASE)

        for line in self.lines:
            # Check if this line is a phase header
            m = header_regex.match(line)
            if not m and simple_regex and not updated_header:
                m = simple_regex.match(line)

            if m:
                base_header = m.group(1).rstrip()
                trailing = m.group(2) or ""
                new_line = f"{base_header} [checkpoint: {sha_short}]{trailing}"
                new_lines.append(new_line)
                updated_header = True
                in_target_phase = True
                continue

            # If we hit another phase header, we left target phase
            if line.startswith("## ") and in_target_phase:
                in_target_phase = False

            # If in target phase and this is the checkpoint task, advance it to [x] [sha]
            if in_target_phase:
                chk_m = checkpoint_task_regex.match(line)
                if chk_m:
                    indent = chk_m.group(1)
                    task_body = chk_m.group(2)
                    trail = chk_m.group(3) or ""
                    new_lines.append(f"{indent}[x]{task_body} [{sha_short}]{trail}")
                    continue

            new_lines.append(line)

        if not updated_header:
            raise EngineError(f"Phase '{phase_name}' not found in plan")

        self.lines = new_lines
        self.raw_content = "\n".join(self.lines) + ("\n" if self.lines else "")
        return True

    def save(self, file_path=None):
        """Saves lines back to disk."""
        target = Path(file_path) if file_path else self.file_path
        if not target:
            raise EngineError("Cannot save PlanDocument: no target path specified")
        target.write_text("\n".join(self.lines) + "\n", encoding="utf-8")


def advance_task(track_id, task_name, status, sha=None, root_dir="."):
    """Updates task status in track's plan.md."""
    plan_path = Path(root_dir) / "conductor" / "tracks" / track_id / "plan.md"
    if not plan_path.exists():
        raise FileNotFoundError(f"Plan file not found: {plan_path}")

    doc = PlanDocument.from_file(plan_path)
    updated = doc.advance(task_name, status=status, sha=sha)
    doc.save()

    return {
        "track_id": track_id,
        "task_name": task_name,
        "status": status,
        "updated": updated,
    }


def finish_task(track_id, task_name, sha, summary, files=None, root_dir="."):
    """Atomically attaches verification git note and advances plan.md task to done with sha."""
    note_ok = attach_git_note(sha, task_name, summary, files=files, root_dir=root_dir)
    adv_res = advance_task(track_id, task_name, status="done", sha=sha, root_dir=root_dir)

    return {
        "track_id": track_id,
        "task_name": task_name,
        "sha": sha,
        "status": "done",
        "note_attached": note_ok,
        "updated": adv_res["updated"],
    }


def checkpoint_phase(track_id, phase_name, sha, report_file=None, summary=None, root_dir="."):
    """Attaches phase verification git note and records [checkpoint: <sha>] in plan.md."""
    plan_path = Path(root_dir) / "conductor" / "tracks" / track_id / "plan.md"
    if not plan_path.exists():
        raise FileNotFoundError(f"Plan file not found: {plan_path}")

    note_body = f"Phase Checkpoint: {phase_name}"
    if report_file and Path(report_file).exists():
        note_body += f"\n\n{Path(report_file).read_text(encoding='utf-8')}"
    elif summary:
        note_body += f"\n\nVerification Summary:\n{summary}"

    cmd = ["git", "notes", "add", "-f", "-m", note_body, sha]
    note_res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
    note_ok = note_res.returncode == 0

    doc = PlanDocument.from_file(plan_path)
    updated = doc.checkpoint(phase_name, sha=sha)
    doc.save()

    return {
        "track_id": track_id,
        "phase": phase_name,
        "sha": sha,
        "status": "checkpointed",
        "note_attached": note_ok,
        "updated": updated,
    }


def complete_track(track_id, root_dir="."):
    """Marks track complete in tracks.md and metadata.json."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.complete_track(track_id)


def start_track(track_id, root_dir="."):
    """Marks track in_progress in tracks.md and metadata.json."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.start_track(track_id)


def reset_track(track_id, root_dir="."):
    """Resets track back to new/pending in tracks.md and metadata.json."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.reset_track(track_id)


def list_tracks(root_dir="."):
    """Returns structured list of registered tracks."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.list_tracks()


def resolve_track(query=None, root_dir="."):
    """Resolves track target deterministically by query or returns first incomplete track."""
    repo = TrackRepository(root_dir=root_dir)
    return repo.resolve_track(query=query)



def parse_plan(plan_path):
    """Parses a track's plan.md into structured tasks, phases, and status metrics."""
    path = Path(plan_path)
    if not path.exists():
        return {
            "phases": [],
            "tasks": [],
            "total_tasks": 0,
            "completed_tasks": 0,
            "in_progress_tasks": 0,
            "pending_tasks": 0,
            "current_phase": None,
            "current_task": None,
            "next_pending_task": None,
            "progress_percent": 0.0,
        }
    return PlanDocument.from_file(path).summary()



def get_project_status(root_dir=".", track_id=None):
    """Returns project-wide status summary and active track progress."""
    tracks = list_tracks(root_dir=root_dir)
    total_tracks = len(tracks)
    completed_tracks = sum(1 for t in tracks if t["status"] == "complete")
    in_progress_tracks = sum(1 for t in tracks if t["status"] == "in_progress")
    pending_tracks = sum(1 for t in tracks if t["status"] in ("new", "pending"))

    active_target = None
    if track_id:
        active_target = next((t for t in tracks if t["track_id"] == track_id), None)
    elif in_progress_tracks > 0:
        active_target = next((t for t in tracks if t["status"] == "in_progress"), None)
    elif pending_tracks > 0:
        active_target = next((t for t in tracks if t["status"] in ("new", "pending")), None)

    active_summary = None
    if active_target:
        tid = active_target["track_id"]
        plan_file = Path(root_dir) / "conductor" / "tracks" / tid / "plan.md"
        plan_data = parse_plan(plan_file)
        active_summary = {
            "track_id": tid,
            "title": active_target["title"],
            "status": active_target["status"],
            "current_phase": plan_data["current_phase"],
            "current_task": plan_data["current_task"],
            "next_pending_task": plan_data["next_pending_task"],
            "total_tasks": plan_data["total_tasks"],
            "completed_tasks": plan_data["completed_tasks"],
            "in_progress_tasks": plan_data["in_progress_tasks"],
            "pending_tasks": plan_data["pending_tasks"],
            "progress_percent": plan_data["progress_percent"],
        }

    return {
        "timestamp": datetime.now().astimezone().isoformat(),
        "tracks": {
            "total": total_tracks,
            "complete": completed_tracks,
            "in_progress": in_progress_tracks,
            "pending": pending_tracks,
        },
        "active_track": active_summary,
    }


def attach_git_note(commit_sha, task_name, summary, files=None, root_dir="."):
    """Attaches a formatted task verification note to a commit."""
    note_content = f"Task: {task_name}\nSummary: {summary}"
    if files:
        note_content += f"\nFiles: {files}"

    cmd = ["git", "notes", "add", "-f", "-m", note_content, commit_sha]
    res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
    return res.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Conductor Deterministic State Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Resume subcommand
    resume_parser = subparsers.add_parser("resume", help="Audit project setup progress")
    resume_parser.add_argument("--root-dir", default=".", help="Project root directory")

    # Verify subcommand
    verify_parser = subparsers.add_parser("verify", help="Verify handshake and context links")
    verify_parser.add_argument("--fast", action="store_true", help="Perform link-only check without deep git/workspace audit")
    verify_parser.add_argument("--root-dir", default=".", help="Project root directory")

    # Status subcommand
    status_parser = subparsers.add_parser("status", help="Get project and track progress overview")
    status_parser.add_argument("--track", default=None, help="Specific track ID")
    status_parser.add_argument("--verbose", action="store_true", help="Output expanded diagnostic overview")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")
    status_parser.add_argument("--root-dir", default=".", help="Project root directory")

    # List subcommand
    list_parser = subparsers.add_parser("list", help="List registered tracks")
    list_parser.add_argument("--json", action="store_true", help="Output as JSON")
    list_parser.add_argument("--root-dir", default=".", help="Project root directory")

    # Track subcommands
    track_parser = subparsers.add_parser("track", help="Manage tracks")
    track_subs = track_parser.add_subparsers(dest="track_command", required=True)

    init_track_p = track_subs.add_parser("init", help="Initialize a new track")
    init_track_p.add_argument("track_id", help="Unique track identifier")
    init_track_p.add_argument("--type", required=True, help="Track type (feature, bug, chore, mvp, refactor)")
    init_track_p.add_argument("--description", required=True, help="Track description")
    init_track_p.add_argument("--root-dir", default=".", help="Project root directory")

    start_track_p = track_subs.add_parser("start", help="Mark track in-progress")
    start_track_p.add_argument("track_id", help="Track identifier")
    start_track_p.add_argument("--root-dir", default=".", help="Project root directory")

    reset_track_p = track_subs.add_parser("reset", help="Reset track back to pending")
    reset_track_p.add_argument("track_id", help="Track identifier")
    reset_track_p.add_argument("--root-dir", default=".", help="Project root directory")

    advance_p = track_subs.add_parser("advance", help="Advance a task's status in plan.md")
    advance_p.add_argument("track_id", help="Track identifier")
    advance_p.add_argument("--task", required=True, help="Task name")
    advance_p.add_argument("--status", choices=["pending", "in_progress", "done", "complete"], required=True)
    advance_p.add_argument("--sha", default=None, help="Commit SHA if done")
    advance_p.add_argument("--root-dir", default=".", help="Project root directory")

    finish_p = track_subs.add_parser("finish", help="Atomically attach git note and advance task in plan.md to done")
    finish_p.add_argument("track_id", help="Track identifier")
    finish_p.add_argument("--task", required=True, help="Task name")
    finish_p.add_argument("--sha", required=True, help="Commit SHA")
    finish_p.add_argument("--summary", required=True, help="Task summary for git note")
    finish_p.add_argument("--files", default=None, help="Modified files")
    finish_p.add_argument("--root-dir", default=".", help="Project root directory")

    checkpoint_p = track_subs.add_parser("checkpoint", help="Record phase verification checkpoint in plan.md and attach git note")
    checkpoint_p.add_argument("track_id", help="Track identifier")
    checkpoint_p.add_argument("--phase", required=True, help="Phase name")
    checkpoint_p.add_argument("--sha", required=True, help="Commit SHA")
    checkpoint_p.add_argument("--report", default=None, help="Path to verification report markdown file")
    checkpoint_p.add_argument("--summary", default=None, help="Inline verification summary")
    checkpoint_p.add_argument("--root-dir", default=".", help="Project root directory")

    comp_track_p = track_subs.add_parser("complete", help="Mark track complete")
    comp_track_p.add_argument("track_id", help="Track identifier")
    comp_track_p.add_argument("--root-dir", default=".", help="Project root directory")

    resolve_p = track_subs.add_parser("resolve", help="Deterministically resolve track by query or get next incomplete track")
    resolve_p.add_argument("--query", default=None, help="Track name or query substring")
    resolve_p.add_argument("--json", action="store_true", help="Output as JSON")
    resolve_p.add_argument("--root-dir", default=".", help="Project root directory")

    # Note subcommand
    note_p = subparsers.add_parser("note", help="Manage git notes")
    note_p.add_argument("commit_sha", help="Commit SHA")
    note_p.add_argument("--task", required=True, help="Task name")
    note_p.add_argument("--summary", required=True, help="Task summary")
    note_p.add_argument("--files", default=None, help="Modified files")

    args = parser.parse_args()

    if args.command == "resume":
        result = determine_resumption(root_dir=args.root_dir)
        print(json.dumps(result, indent=2))
    elif args.command == "verify":
        result = verify_handshake(root_dir=args.root_dir, fast=args.fast)
        print(json.dumps(result, indent=2))

    elif args.command == "list":
        tracks = list_tracks(root_dir=args.root_dir)
        if args.json:
            print(json.dumps(tracks, indent=2))
        else:
            if not tracks:
                print("No registered tracks found.")
            else:
                print("Registered Tracks:")
                for t in tracks:
                    marker = "[x]" if t["status"] == "complete" else ("[~]" if t["status"] == "in_progress" else "[ ]")
                    print(f"- {marker} {t['track_id']}: {t['title']} ({t['status']})")
    elif args.command == "status":
        status = get_project_status(root_dir=args.root_dir, track_id=args.track)
        if args.json:
            print(json.dumps(status, indent=2))
        elif args.verbose:
            t = status["tracks"]
            print(f"Project Status Overview ({status['timestamp']})")
            print(f"Tracks: {t['total']} total ({t['complete']} complete, {t['in_progress']} in_progress, {t['pending']} pending)")
            at = status.get("active_track")
            if at:
                print(f"\nActive Track: {at['track_id']} - {at['title']} [{at['status']}]")
                if at.get("total_tasks"):
                    print(f"Progress: {at['completed_tasks']}/{at['total_tasks']} tasks complete ({at['progress_percent']}%)")
                if at.get("current_task"):
                    print(f"Current Task: {at['current_task']} (Phase: {at['current_phase']})")
                if at.get("next_pending_task"):
                    print(f"Next Pending: {at['next_pending_task']}")
            else:
                print("\nNo active track.")
        else:
            t = status["tracks"]
            at = status.get("active_track")
            if at:
                active_str = f"{at['track_id']} [{at['completed_tasks']}/{at['total_tasks']}]"
                if at.get("current_task"):
                    active_str += f" -> Task: {at['current_task']}"
            else:
                active_str = "none"
            print(f"conductor: {t['complete']}/{t['total']} tracks complete | active: {active_str}")
    elif args.command == "track":
        if args.track_command == "init":
            res = init_track(args.track_id, args.type, args.description, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "start":
            res = start_track(args.track_id, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "reset":
            res = reset_track(args.track_id, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "advance":
            res = advance_task(args.track_id, args.task, args.status, sha=args.sha, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "finish":
            res = finish_task(args.track_id, args.task, args.sha, args.summary, files=args.files, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "checkpoint":
            res = checkpoint_phase(args.track_id, args.phase, args.sha, report_file=args.report, summary=args.summary, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "complete":
            res = complete_track(args.track_id, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
        elif args.track_command == "resolve":
            res = resolve_track(query=args.query, root_dir=args.root_dir)
            if args.json:
                print(json.dumps(res, indent=2))
            else:
                if res["status"] == "matched":
                    t = res["track"]
                    print(f"Matched Track: {t['track_id']} - {t['title']} [{t['status']}]")
                elif res["status"] == "ambiguous":
                    print("Ambiguous matches found:")
                    for c in res["candidates"]:
                        print(f"- {c['track_id']}: {c['title']} [{c['status']}]")
                elif res["status"] == "not_found":
                    print(f"No track matching query '{args.query}' found.")
                elif res["status"] == "all_complete":
                    print("All registered tracks are complete.")
                elif res["status"] == "none":
                    print("No registered tracks available.")
    elif args.command == "note":
        ok = attach_git_note(args.commit_sha, args.task, args.summary, files=args.files)
        print(json.dumps({"success": ok}))


if __name__ == "__main__":
    main()
