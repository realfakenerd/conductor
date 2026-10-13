import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { EngineError, type TrackInfo, type TrackMetadata, type TrackStatus, type ResolveTrackResult } from "./types.ts";

export class TrackRepository {
  private rootDir: string;
  private conductorDir: string;
  private tracksDir: string;
  private registryPath: string;

  constructor(rootDir: string = ".") {
    this.rootDir = rootDir;
    this.conductorDir = join(this.rootDir, "conductor");
    this.tracksDir = join(this.conductorDir, "tracks");
    this.registryPath = join(this.conductorDir, "tracks.md");
  }

  listTracks(): TrackInfo[] {
    if (!existsSync(this.registryPath)) {
      return [];
    }

    const content = readFileSync(this.registryPath, "utf-8");
    const pattern = /-\s*\[([ x~])\]\s*\*\*Track:\s*(.*?)\*\*\s*\n\s*\*Link:\s*\[\.\/tracks\/(.*?)\/index\.md\]/g;
    const tracks: TrackInfo[] = [];

    const statusMap: Record<string, TrackStatus> = {
      " ": "new",
      "~": "in_progress",
      "x": "complete",
    };

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const marker = match[1];
      const title = match[2].trim();
      const trackId = match[3].trim();

      const trackInfo: TrackInfo = {
        track_id: trackId,
        title,
        status: statusMap[marker] || "new",
        path: `tracks/${trackId}`,
      };

      const metaFile = join(this.tracksDir, trackId, "metadata.json");
      if (existsSync(metaFile)) {
        try {
          const meta = JSON.parse(readFileSync(metaFile, "utf-8")) as TrackMetadata;
          trackInfo.type = meta.type;
          trackInfo.created_at = meta.created_at;
          trackInfo.updated_at = meta.updated_at;
        } catch {
          // Ignore invalid JSON
        }
      }

      tracks.push(trackInfo);
    }

    return tracks;
  }

  getTrack(trackId: string): TrackInfo | null {
    const tracks = this.listTracks();
    return tracks.find((t) => t.track_id === trackId) || null;
  }

  resolveTrack(query?: string | null): ResolveTrackResult {
    const allTracks = this.listTracks();
    if (allTracks.length === 0) {
      return { status: "none", track: null, candidates: [] };
    }

    if (query && query.trim()) {
      const qClean = query.trim().toLowerCase();

      // 1. Exact ID match
      const exact = allTracks.find((t) => t.track_id.toLowerCase() === qClean);
      if (exact) {
        return { status: "matched", track: exact, candidates: [] };
      }

      // 2. Substring match across ID and Title
      const matches = allTracks.filter(
        (t) => t.track_id.toLowerCase().includes(qClean) || t.title.toLowerCase().includes(qClean)
      );

      if (matches.length === 1) {
        return { status: "matched", track: matches[0], candidates: [] };
      } else if (matches.length > 1) {
        return { status: "ambiguous", track: null, candidates: matches };
      } else {
        return { status: "not_found", track: null, candidates: [] };
      }
    }

    // No query: return first in_progress or new track
    const inProgress = allTracks.find((t) => t.status === "in_progress");
    if (inProgress) {
      return { status: "matched", track: inProgress, candidates: [] };
    }

    const pending = allTracks.find((t) => t.status === "new" || t.status === "pending");
    if (pending) {
      return { status: "matched", track: pending, candidates: [] };
    }

    return { status: "all_complete", track: null, candidates: [] };
  }

  initTrack(trackId: string, trackType: string, description: string) {
    const trackWorkspace = join(this.tracksDir, trackId);
    mkdirSync(this.tracksDir, { recursive: true });
    mkdirSync(trackWorkspace, { recursive: true });

    const nowIso = new Date().toISOString();
    const metadata: TrackMetadata = {
      track_id: trackId,
      type: trackType.toLowerCase(),
      status: "new",
      created_at: nowIso,
      updated_at: nowIso,
      description,
    };

    const metadataPath = join(trackWorkspace, "metadata.json");
    const entry = `\n---\n- [ ] **Track: ${description}**\n  *Link: [./tracks/${trackId}/index.md](./tracks/${trackId}/index.md)*\n`;

    const prevRegistry = existsSync(this.registryPath) ? readFileSync(this.registryPath, "utf-8") : null;
    const prevMeta = existsSync(metadataPath) ? readFileSync(metadataPath, "utf-8") : null;

    try {
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
      if (!existsSync(this.registryPath)) {
        writeFileSync(this.registryPath, `# Tracks Registry\n${entry}`, "utf-8");
      } else {
        const existing = readFileSync(this.registryPath, "utf-8");
        if (!existing.includes(trackId)) {
          writeFileSync(this.registryPath, existing + entry, "utf-8");
        }
      }
    } catch (err) {
      if (prevMeta !== null) {
        writeFileSync(metadataPath, prevMeta, "utf-8");
      } else if (existsSync(metadataPath)) {
        unlinkSync(metadataPath);
      }
      if (prevRegistry !== null) {
        writeFileSync(this.registryPath, prevRegistry, "utf-8");
      } else if (existsSync(this.registryPath)) {
        unlinkSync(this.registryPath);
      }
      throw new EngineError(`Failed to initialize track '${trackId}': ${err}`);
    }

    return {
      track_id: trackId,
      workspace: trackWorkspace,
      metadata_file: metadataPath,
      registry_file: this.registryPath,
      status: "new",
    };
  }

  private transitionTrack(trackId: string, newStatus: TrackStatus, marker: string) {
    const metadataPath = join(this.tracksDir, trackId, "metadata.json");
    if (!existsSync(metadataPath)) {
      throw new EngineError(`Track '${trackId}' not found: missing metadata.json at ${metadataPath}`);
    }

    const prevMetaText = readFileSync(metadataPath, "utf-8");
    const prevRegistryText = existsSync(this.registryPath) ? readFileSync(this.registryPath, "utf-8") : null;

    try {
      const meta = JSON.parse(prevMetaText) as TrackMetadata;
      meta.status = newStatus;
      meta.updated_at = new Date().toISOString();
      const newMetaText = JSON.stringify(meta, null, 2);

      let newRegistryText = prevRegistryText;
      if (prevRegistryText) {
        const pattern = new RegExp(
          `-\\s*\\[[ x~]\\]\\s*(\\*\\*Track:.*?\\*\\*\\s*\\n\\s*\\*Link:\\s*\\[\\./tracks/${trackId.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\/index\\.md\\])`
        );

        if (!pattern.test(prevRegistryText)) {
          throw new EngineError(`Track '${trackId}' not registered in tracks.md`);
        }
        newRegistryText = prevRegistryText.replace(pattern, `- [${marker}] $1`);
      }

      // Atomic dual-write
      if (newRegistryText !== null) {
        writeFileSync(this.registryPath, newRegistryText, "utf-8");
      }
      writeFileSync(metadataPath, newMetaText, "utf-8");
    } catch (err) {
      if (prevRegistryText !== null && existsSync(this.registryPath)) {
        writeFileSync(this.registryPath, prevRegistryText, "utf-8");
      }
      if (existsSync(metadataPath)) {
        writeFileSync(metadataPath, prevMetaText, "utf-8");
      }
      if (err instanceof EngineError) throw err;
      throw new EngineError(`Failed to transition track '${trackId}' to '${newStatus}': ${err}`);
    }

    return {
      track_id: trackId,
      status: newStatus,
    };
  }

  startTrack(trackId: string) {
    return this.transitionTrack(trackId, "in_progress", "~");
  }

  completeTrack(trackId: string) {
    return this.transitionTrack(trackId, "complete", "x");
  }

  resetTrack(trackId: string) {
    return this.transitionTrack(trackId, "new", " ");
  }
}
