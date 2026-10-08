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

    # Track subcommands
    track_parser = subparsers.add_parser("track", help="Manage tracks")
    track_subs = track_parser.add_subparsers(dest="track_command", required=True)

    init_track_p = track_subs.add_parser("init", help="Initialize a new track")
    init_track_p.add_argument("track_id", help="Unique track identifier")
    init_track_p.add_argument("--type", required=True, help="Track type (feature, bug, chore, mvp)")
    init_track_p.add_argument("--description", required=True, help="Track description")
    init_track_p.add_argument("--root-dir", default=".", help="Project root directory")

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
    elif args.command == "track":
        if args.track_command == "init":
            res = init_track(args.track_id, args.type, args.description, root_dir=args.root_dir)
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
