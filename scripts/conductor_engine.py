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


def verify_handshake(root_dir="."):
    """Verifies that conductor/index.md exists and all linked files exist on disk."""
    conductor_dir = Path(root_dir) / "conductor"
    index_file = conductor_dir / "index.md"

    if not index_file.exists():
        return {
            "valid": False,
            "error": "Missing conductor/index.md handshake",
            "missing_links": [],
        }

    content = index_file.read_text(encoding="utf-8")
    link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
    links = link_pattern.findall(content)

    missing = []
    for link in links:
        # Ignore external or anchor links
        if link.startswith("http") or link.startswith("#"):
            continue
        target = (conductor_dir / link).resolve()
        if not target.exists():
            missing.append(link)

    return {
        "valid": len(missing) == 0,
        "total_links": len(links),
        "missing_links": missing,
    }


def init_track(track_id, track_type, description, root_dir="."):
    """Initializes a new track workspace, metadata.json, and updates tracks registry."""
    conductor_dir = Path(root_dir) / "conductor"
    tracks_dir = conductor_dir / "tracks"
    track_workspace = tracks_dir / track_id

    tracks_dir.mkdir(parents=True, exist_ok=True)
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
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # Update tracks registry (conductor/tracks.md)
    registry_path = conductor_dir / "tracks.md"
    entry = f"\n---\n- [ ] **Track: {description}**\n  *Link: [./tracks/{track_id}/index.md](./tracks/{track_id}/index.md)*\n"

    if not registry_path.exists():
        registry_path.write_text(f"# Tracks Registry\n{entry}", encoding="utf-8")
    else:
        existing = registry_path.read_text(encoding="utf-8")
        if track_id not in existing:
            registry_path.write_text(existing + entry, encoding="utf-8")

    return {
        "track_id": track_id,
        "workspace": str(track_workspace),
        "metadata_file": str(metadata_path),
        "registry_file": str(registry_path),
    }


def advance_task(track_id, task_name, status, sha=None, root_dir="."):
    """Updates task status in track's plan.md."""
    plan_path = Path(root_dir) / "conductor" / "tracks" / track_id / "plan.md"
    if not plan_path.exists():
        raise FileNotFoundError(f"Plan file not found: {plan_path}")

    content = plan_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    updated = False

    marker_map = {
        "pending": "[ ]",
        "in_progress": "[~]",
        "done": "[x]",
        "complete": "[x]",
    }
    target_marker = marker_map.get(status, "[~]")

    new_lines = []
    task_regex = re.compile(rf"^(-\s*\[[ x~]\]\s*Task:\s*{re.escape(task_name)}.*)$")

    for line in lines:
        if task_regex.match(line):
            # Replace marker
            prefix = f"- {target_marker} Task: {task_name}"
            if target_marker == "[x]" and sha:
                new_line = f"{prefix} [{sha[:7]}]"
            else:
                new_line = prefix
            new_lines.append(new_line)
            updated = True
        else:
            new_lines.append(line)

    if updated:
        plan_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

    return {
        "track_id": track_id,
        "task_name": task_name,
        "status": status,
        "updated": updated,
    }


def complete_track(track_id, root_dir="."):
    """Marks track complete in tracks.md and metadata.json."""
    conductor_dir = Path(root_dir) / "conductor"
    metadata_path = conductor_dir / "tracks" / track_id / "metadata.json"
    registry_path = conductor_dir / "tracks.md"

    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        meta["status"] = "complete"
        meta["updated_at"] = datetime.now().astimezone().isoformat()
        metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    if registry_path.exists():
        content = registry_path.read_text(encoding="utf-8")
        # Match track entry linking to track_id
        pattern = re.compile(rf"-\s*\[[ ~]\]\s*(\*\*Track:.*?\*\*\s*\n\s*\*Link:\s*\[\./tracks/{re.escape(track_id)}/index\.md\])")
        content = pattern.sub(r"- [x] \1", content)
        registry_path.write_text(content, encoding="utf-8")

    return {
        "track_id": track_id,
        "status": "complete",
    }


def start_track(track_id, root_dir="."):
    """Marks track in_progress in tracks.md and metadata.json."""
    conductor_dir = Path(root_dir) / "conductor"
    metadata_path = conductor_dir / "tracks" / track_id / "metadata.json"
    registry_path = conductor_dir / "tracks.md"

    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        meta["status"] = "in_progress"
        meta["updated_at"] = datetime.now().astimezone().isoformat()
        metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    if registry_path.exists():
        content = registry_path.read_text(encoding="utf-8")
        pattern = re.compile(rf"-\s*\[[ x~]\]\s*(\*\*Track:.*?\*\*\s*\n\s*\*Link:\s*\[\./tracks/{re.escape(track_id)}/index\.md\])")
        content = pattern.sub(r"- [~] \1", content)
        registry_path.write_text(content, encoding="utf-8")

    return {
        "track_id": track_id,
        "status": "in_progress",
    }


def reset_track(track_id, root_dir="."):
    """Resets track back to new/pending in tracks.md and metadata.json."""
    conductor_dir = Path(root_dir) / "conductor"
    metadata_path = conductor_dir / "tracks" / track_id / "metadata.json"
    registry_path = conductor_dir / "tracks.md"

    if metadata_path.exists():
        meta = json.loads(metadata_path.read_text(encoding="utf-8"))
        meta["status"] = "new"
        meta["updated_at"] = datetime.now().astimezone().isoformat()
        metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    if registry_path.exists():
        content = registry_path.read_text(encoding="utf-8")
        pattern = re.compile(rf"-\s*\[[ x~]\]\s*(\*\*Track:.*?\*\*\s*\n\s*\*Link:\s*\[\./tracks/{re.escape(track_id)}/index\.md\])")
        content = pattern.sub(r"- [ ] \1", content)
        registry_path.write_text(content, encoding="utf-8")

    return {
        "track_id": track_id,
        "status": "new",
    }


def list_tracks(root_dir="."):
    """Returns structured list of registered tracks."""
    conductor_dir = Path(root_dir) / "conductor"
    registry_path = conductor_dir / "tracks.md"
    if not registry_path.exists():
        return []

    content = registry_path.read_text(encoding="utf-8")
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
        meta_file = conductor_dir / "tracks" / track_id / "metadata.json"
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

    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()

    phases = []
    tasks = []
    current_phase_name = None

    phase_regex = re.compile(r"^##\s+(?:Phase\s+\d+:?\s*)?(.*?)(?:\s*\[.*\])?$")
    task_regex = re.compile(r"^-\s*\[([ x~])\]\s*Task:\s*(.*?)(?:\s*\[[a-f0-9]+\])?$")

    for line in lines:
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


def attach_git_note(commit_sha, task_name, summary, files=None):
    """Attaches a formatted task verification note to a commit."""
    note_content = f"Task: {task_name}\nSummary: {summary}"
    if files:
        note_content += f"\nFiles: {files}"

    cmd = ["git", "notes", "add", "-f", "-m", note_content, commit_sha]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Conductor Deterministic State Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Resume subcommand
    resume_parser = subparsers.add_parser("resume", help="Audit project setup progress")
    resume_parser.add_argument("--root-dir", default=".", help="Project root directory")

    # Verify subcommand
    verify_parser = subparsers.add_parser("verify", help="Verify handshake and context links")
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

    comp_track_p = track_subs.add_parser("complete", help="Mark track complete")
    comp_track_p.add_argument("track_id", help="Track identifier")
    comp_track_p.add_argument("--root-dir", default=".", help="Project root directory")

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
        result = verify_handshake(root_dir=args.root_dir)
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
        elif args.track_command == "complete":
            res = complete_track(args.track_id, root_dir=args.root_dir)
            print(json.dumps(res, indent=2))
    elif args.command == "note":
        ok = attach_git_note(args.commit_sha, args.task, args.summary, files=args.files)
        print(json.dumps({"success": ok}))


if __name__ == "__main__":
    main()
