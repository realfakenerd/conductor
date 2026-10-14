import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export interface BrokenTrack {
  track_id: string;
  title: string;
  reasons: string[];
}

export interface GhostCommit {
  track_id: string;
  sha: string;
  task: string;
}

export interface AuditResult {
  valid: boolean;
  total_links?: number;
  missing_links: string[];
  broken_tracks: BrokenTrack[];
  ghost_commits: GhostCommit[];
  error?: string;
}

export class IntegrityAuditor {
  private rootDir: string;
  private conductorDir: string;
  private indexFile: string;
  private tracksDir: string;
  private registryFile: string;

  constructor(rootDir: string = ".") {
    this.rootDir = rootDir;
    this.conductorDir = join(this.rootDir, "conductor");
    this.indexFile = join(this.conductorDir, "index.md");
    this.tracksDir = join(this.conductorDir, "tracks");
    this.registryFile = join(this.conductorDir, "tracks.md");
  }

  audit(fast: boolean = false): AuditResult {
    if (!existsSync(this.indexFile)) {
      return {
        valid: false,
        error: "Missing conductor/index.md handshake",
        missing_links: [],
        broken_tracks: [],
        ghost_commits: [],
      };
    }

    // 1. Handshake link validation
    const content = readFileSync(this.indexFile, "utf-8");
    const linkPattern = /\[.*?\]\((.*?)\)/g;
    const missingLinks: string[] = [];
    let totalLinks = 0;

    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(content)) !== null) {
      totalLinks++;
      const link = match[1];
      if (link.startsWith("http") || link.startsWith("#")) {
        continue;
      }
      const target = resolve(this.conductorDir, link);
      if (!existsSync(target)) {
        missingLinks.push(link);
      }
    }

    if (fast) {
      return {
        valid: missingLinks.length === 0,
        total_links: totalLinks,
        missing_links: missingLinks,
        broken_tracks: [],
        ghost_commits: [],
      };
    }

    // 2. ADR index link validation
    const adrsDir = join(this.conductorDir, "adrs");
    const adrIndex = join(adrsDir, "index.md");
    if (existsSync(adrsDir) && existsSync(adrIndex)) {
      const adrContent = readFileSync(adrIndex, "utf-8");
      const adrLinkPattern = /\[.*?\]\((.*?)\)/g;
      let am: RegExpExecArray | null;
      while ((am = adrLinkPattern.exec(adrContent)) !== null) {
        totalLinks++;
        const link = am[1];
        if (link.startsWith("http") || link.startsWith("#")) continue;
        const target = resolve(adrsDir, link);
        if (!existsSync(target)) {
          missingLinks.push(`conductor/adrs/${link}`);
        }
      }
    }

    // 2. Track parity validation
    const brokenTracks: BrokenTrack[] = [];
    if (existsSync(this.registryFile)) {
      const regContent = readFileSync(this.registryFile, "utf-8");
      const trackPattern = /-\s*\[([ x~])\]\s*\*\*Track:\s*(.*?)\*\*\s*\n\s*\*Link:\s*\[\.\/tracks\/(.*?)\/index\.md\]/g;
      while ((match = trackPattern.exec(regContent)) !== null) {
        const title = match[2].trim();
        const tid = match[3].trim();
        const trackDir = join(this.tracksDir, tid);
        const trackIdx = join(trackDir, "index.md");
        const trackMeta = join(trackDir, "metadata.json");

        const reasons: string[] = [];
        if (!existsSync(trackDir)) {
          reasons.push("Missing workspace directory");
        }
        if (!existsSync(trackIdx)) {
          reasons.push("Missing index.md");
        }
        if (!existsSync(trackMeta)) {
          reasons.push("Missing metadata.json");
        }

        if (reasons.length > 0) {
          brokenTracks.push({
            track_id: tid,
            title,
            reasons,
          });
        }
      }
    }

    // 3. Git commit reconciliation
    const ghostCommits: GhostCommit[] = [];
    const isGit = existsSync(join(this.rootDir, ".git"));
    if (isGit && existsSync(this.tracksDir)) {
      if (existsSync(this.registryFile)) {
        const regContent = readFileSync(this.registryFile, "utf-8");
        const trackPattern = /-\s*\[([ x~])\]\s*\*\*Track:\s*(.*?)\*\*\s*\n\s*\*Link:\s*\[\.\/tracks\/(.*?)\/index\.md\]/g;
        while ((match = trackPattern.exec(regContent)) !== null) {
          const tid = match[3].trim();
          const planFile = join(this.tracksDir, tid, "plan.md");
          if (existsSync(planFile)) {
            const planContent = readFileSync(planFile, "utf-8");
            const shaPattern = /-\s*\[x\]\s*Task:\s*(.*?)\s*\[([a-f0-9]+)\]/g;
            let sm: RegExpExecArray | null;
            while ((sm = shaPattern.exec(planContent)) !== null) {
              const taskDesc = sm[1].trim();
              const sha = sm[2].trim();
              const checkRes = spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
                cwd: this.rootDir,
                encoding: "utf-8",
              });
              if (checkRes.status !== 0) {
                ghostCommits.push({
                  track_id: tid,
                  sha,
                  task: taskDesc,
                });
              }
            }
          }
        }
      }
    }

    const isValid = missingLinks.length === 0 && brokenTracks.length === 0 && ghostCommits.length === 0;

    return {
      valid: isValid,
      total_links: totalLinks,
      missing_links: missingLinks,
      broken_tracks: brokenTracks,
      ghost_commits: ghostCommits,
    };
  }
}
