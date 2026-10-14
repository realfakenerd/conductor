import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EngineError } from "./types.ts";

export interface AdrEntry {
  number: number;
  title: string;
  status: string;
  date: string;
  file: string;
  linked_tracks: string[];
}

export interface AdrInitOptions {
  status?: string;
  context?: string;
  trackId?: string;
}

export class AdrRepository {
  private rootDir: string;
  private adrsDir: string;
  private indexPath: string;

  constructor(rootDir: string = ".") {
    this.rootDir = rootDir;
    this.adrsDir = join(rootDir, "conductor", "adrs");
    this.indexPath = join(this.adrsDir, "index.md");
  }

  listAdrs(): AdrEntry[] {
    if (!existsSync(this.adrsDir)) {
      return [];
    }

    const files = readdirSync(this.adrsDir)
      .filter((f) => f.endsWith(".md") && f !== "index.md")
      .sort();

    const entries: AdrEntry[] = [];
    const numRegex = /^(\d{4})-(.*)\.md$/;

    for (const f of files) {
      const m = numRegex.exec(f);
      if (!m) continue;
      const num = parseInt(m[1], 10);
      const fullPath = join(this.adrsDir, f);
      const content = readFileSync(fullPath, "utf-8");

      let title = m[2].replace(/-/g, " ");
      const titleMatch = /^#\s+ADR\s+\d{4}:\s*(.*?)$/m.exec(content);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      let status = "proposed";
      const statusMatch = /##\s+Status\s*\n+([a-zA-Z0-9_-]+)/i.exec(content);
      if (statusMatch) {
        status = statusMatch[1].trim();
      }

      let date = "";
      const dateMatch = /##\s+Date\s*\n+([^\n]+)/i.exec(content);
      if (dateMatch) {
        date = dateMatch[1].trim();
      }

      const linkedTracks: string[] = [];
      const tracksMatch = /##\s+Linked Tracks\s*\n+([\s\S]*?)(?=\n##|$)/i.exec(content);
      if (tracksMatch) {
        for (const line of tracksMatch[1].split("\n")) {
          const t = line.replace(/^[-*]\s*/, "").trim();
          if (t && t !== "None") {
            linkedTracks.push(t);
          }
        }
      }

      entries.push({
        number: num,
        title,
        status,
        date,
        file: `conductor/adrs/${f}`,
        linked_tracks: linkedTracks,
      });
    }

    return entries;
  }

  initAdr(title: string, options: AdrInitOptions = {}): AdrEntry {
    if (!existsSync(this.adrsDir)) {
      mkdirSync(this.adrsDir, { recursive: true });
    }

    const currentAdrs = this.listAdrs();
    const nextNumber = currentAdrs.length > 0 ? Math.max(...currentAdrs.map((a) => a.number)) + 1 : 1;
    const numPadded = String(nextNumber).padStart(4, "0");
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const fileName = `${numPadded}-${slug}.md`;
    const relFile = `conductor/adrs/${fileName}`;
    const fullPath = join(this.rootDir, relFile);

    const status = options.status || "proposed";
    const date = new Date().toISOString().split("T")[0];
    const context = options.context || "Explain context, decision drivers, and problem statement here.";
    const track = options.trackId ? `- ${options.trackId}` : "- None";

    const content = `# ADR ${numPadded}: ${title}

## Status
${status}

## Date
${date}

## Context and Problem Statement
${context}

## Decision Drivers
- High architectural cohesion and minimal drift
- Verifiable spec alignment across tracks

## Considered Options
1. Option 1: Standard design
2. Option 2: Alternative design

## Decision Outcome
Chosen option with rationale.

## Linked Tracks
${track}
`;

    writeFileSync(fullPath, content, "utf-8");
    this.updateIndex();

    return {
      number: nextNumber,
      title,
      status,
      date,
      file: relFile,
      linked_tracks: options.trackId ? [options.trackId] : [],
    };
  }

  linkAdr(adrNumber: number, trackId: string): boolean {
    const currentAdrs = this.listAdrs();
    const target = currentAdrs.find((a) => a.number === adrNumber);
    if (!target) {
      throw new EngineError(`ADR number ${adrNumber} not found.`);
    }

    const fullPath = join(this.rootDir, target.file);
    let content = readFileSync(fullPath, "utf-8");

    if (content.includes(`- ${trackId}`)) {
      return true; // Already linked
    }

    const tracksMatch = /(##\s+Linked Tracks\s*\n+)([\s\S]*?)(?=\n##|$)/i.exec(content);
    if (tracksMatch) {
      const header = tracksMatch[1];
      const existing = tracksMatch[2].trim();
      let updatedTracks = "";
      if (existing === "- None" || existing === "None" || existing === "") {
        updatedTracks = `- ${trackId}\n`;
      } else {
        updatedTracks = `${existing}\n- ${trackId}\n`;
      }
      content = content.replace(tracksMatch[0], `${header}${updatedTracks}`);
    } else {
      content += `\n## Linked Tracks\n- ${trackId}\n`;
    }

    writeFileSync(fullPath, content, "utf-8");
    this.updateIndex();
    return true;
  }

  private updateIndex(): void {
    const adrs = this.listAdrs();
    let indexContent = `# Architecture Decision Records (ADRs)\n\n| Number | Title | Status | Date | File |\n|---|---|---|---|---|\n`;

    for (const a of adrs) {
      const link = `[${a.file.split("/").pop()}](./${a.file.split("/").pop()})`;
      indexContent += `| ${String(a.number).padStart(4, "0")} | ${a.title} | ${a.status} | ${a.date} | ${link} |\n`;
    }

    writeFileSync(this.indexPath, indexContent, "utf-8");
  }
}
