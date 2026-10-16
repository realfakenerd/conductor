import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export interface DetectionSignals {
  dependencies?: string[];
  keywords?: string[];
  globs?: string[];
}

export interface SkillCandidate {
  name: string;
  description: string;
  source: "local" | "remote";
  party: "1p" | "3p";
  url?: string;
  path?: string;
  commitSha?: string;
  signals: DetectionSignals;
  score: number;
  matchedSignals: string[];
}

export interface ProjectProfile {
  ecosystems: string[];
  dependencies: string[];
  files: string[];
  techStackKeywords: string[];
}

export interface ScanOptions {
  localRoots?: string[];
  catalogPath?: string;
  minScore?: number;
}

export class SkillScanner {
  /**
   * Inspects repository manifests, tech-stack documentation, and file structure.
   */
  inspectProject(rootDir: string): ProjectProfile {
    const ecosystems: string[] = [];
    const dependencies = new Set<string>();
    const techStackKeywords = new Set<string>();

    // 1. Inspect package.json (npm / bun / node)
    const pkgPath = join(rootDir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        ecosystems.push("npm");
        if (pkg.dependencies && typeof pkg.dependencies === "object") {
          for (const dep of Object.keys(pkg.dependencies)) {
            dependencies.add(dep.toLowerCase());
          }
        }
        if (pkg.devDependencies && typeof pkg.devDependencies === "object") {
          for (const dep of Object.keys(pkg.devDependencies)) {
            dependencies.add(dep.toLowerCase());
          }
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Inspect Cargo.toml (Rust)
    const cargoPath = join(rootDir, "Cargo.toml");
    if (existsSync(cargoPath)) {
      ecosystems.push("cargo");
      try {
        const content = readFileSync(cargoPath, "utf-8");
        const lines = content.split("\n");
        let inDeps = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("[dependencies") || trimmed.startsWith("[dev-dependencies")) {
            inDeps = true;
            continue;
          }
          if (trimmed.startsWith("[") && !trimmed.startsWith("[dependencies") && !trimmed.startsWith("[dev-dependencies")) {
            inDeps = false;
          }
          if (inDeps && trimmed && !trimmed.startsWith("#")) {
            const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=/);
            if (match) {
              dependencies.add(match[1].toLowerCase());
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Inspect pyproject.toml / requirements.txt (Python)
    const pyprojectPath = join(rootDir, "pyproject.toml");
    if (existsSync(pyprojectPath)) {
      ecosystems.push("python");
      try {
        const content = readFileSync(pyprojectPath, "utf-8");
        const match = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
        if (match) {
          const items = match[1].split(",");
          for (const item of items) {
            const clean = item.replace(/["'\\s]/g, "").split(/[><=~]/)[0];
            if (clean) dependencies.add(clean.toLowerCase());
          }
        }
      } catch {
        // ignore
      }
    }

    // 4. Inspect go.mod (Go)
    const goModPath = join(rootDir, "go.mod");
    if (existsSync(goModPath)) {
      ecosystems.push("go");
      try {
        const content = readFileSync(goModPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("require") || trimmed.startsWith("\t")) {
            const parts = trimmed.split(/\s+/);
            const mod = parts[0] === "require" ? parts[1] : parts[0];
            if (mod && mod !== "(" && mod !== ")") {
              const basename = mod.split("/").pop();
              if (basename) dependencies.add(basename.toLowerCase());
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 5. Inspect conductor/tech-stack.md
    const techStackPath = join(rootDir, "conductor", "tech-stack.md");
    if (existsSync(techStackPath)) {
      try {
        const content = readFileSync(techStackPath, "utf-8");
        const words = content.toLowerCase().split(/[^a-z0-9_\-\.]+/);
        for (const w of words) {
          if (w.length > 2) techStackKeywords.add(w);
        }
      } catch {
        // ignore
      }
    }

    // 6. Shallow file discovery (up to 3 levels deep, skipping heavy dirs)
    const files = this.collectFiles(rootDir, 3);

    return {
      ecosystems,
      dependencies: Array.from(dependencies),
      files,
      techStackKeywords: Array.from(techStackKeywords),
    };
  }

  /**
   * Scans local and catalog sources to match against project profile.
   */
  scan(rootDir: string, options: ScanOptions = {}): SkillCandidate[] {
    const profile = this.inspectProject(rootDir);
    const minScore = options.minScore ?? 1;
    const candidates: SkillCandidate[] = [];

    // Resolve local search directories
    const searchDirs: string[] = [];
    if (options.localRoots && options.localRoots.length > 0) {
      searchDirs.push(...options.localRoots);
    } else {
      searchDirs.push(join(rootDir, ".agents", "skills"));
      searchDirs.push(join(rootDir, "skills"));
      searchDirs.push(join(homedir(), ".gemini", "config", "skills"));
      searchDirs.push(join(homedir(), ".claude", "skills"));
    }

    // 1. Scan Local Directories for SKILL.md
    for (const baseDir of searchDirs) {
      if (!existsSync(baseDir)) continue;
      try {
        const entries = readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const skillDir = join(baseDir, entry.name);
          const skillFile = join(skillDir, "SKILL.md");
          if (!existsSync(skillFile)) continue;

          try {
            const content = readFileSync(skillFile, "utf-8");
            const parsed = this.parseSkillMarkdown(content, entry.name);
            const { score, matchedSignals } = this.calculateRelevance(parsed.signals, profile);

            if (score >= minScore) {
              candidates.push({
                name: parsed.name,
                description: parsed.description,
                source: "local",
                party: parsed.party,
                path: skillFile,
                signals: parsed.signals,
                score,
                matchedSignals,
              });
            }
          } catch {
            // ignore individual skill parsing failures
          }
        }
      } catch {
        // ignore unreadable directory
      }
    }

    // 2. Scan Catalog Markdown if provided or exists in repo
    const catalogPath = options.catalogPath || join(rootDir, "skills", "conductor-setup", "assets", "catalog.md");
    if (existsSync(catalogPath)) {
      try {
        const content = readFileSync(catalogPath, "utf-8");
        const catalogSkills = this.parseCatalogMarkdown(content);
        for (const skill of catalogSkills) {
          // Avoid duplicate candidate if local skill with same name exists
          if (candidates.some((c) => c.name === skill.name)) continue;

          const { score, matchedSignals } = this.calculateRelevance(skill.signals, profile);
          if (score >= minScore) {
            candidates.push({
              ...skill,
              score,
              matchedSignals,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    // Sort descending by score
    return candidates.sort((a, b) => b.score - a.score);
  }

  private calculateRelevance(
    signals: DetectionSignals,
    profile: ProjectProfile
  ): { score: number; matchedSignals: string[] } {
    let score = 0;
    const matchedSignals: string[] = [];

    // Dependencies match (+3 points)
    if (signals.dependencies && signals.dependencies.length > 0) {
      for (const dep of signals.dependencies) {
        const depLower = dep.toLowerCase();
        if (profile.dependencies.some((d) => d === depLower || d.includes(depLower))) {
          score += 3;
          matchedSignals.push(`dep:${dep}`);
        }
      }
    }

    // Glob / file extension match (+2 points)
    if (signals.globs && signals.globs.length > 0) {
      for (const glob of signals.globs) {
        const ext = glob.startsWith("*.") ? glob.slice(1) : glob.includes(".") ? "." + glob.split(".").pop() : "";
        if (ext) {
          if (profile.files.some((f) => f.endsWith(ext))) {
            score += 2;
            matchedSignals.push(`glob:${glob}`);
          }
        }
      }
    }

    // Keyword match (+1 point)
    if (signals.keywords && signals.keywords.length > 0) {
      for (const kw of signals.keywords) {
        const kwLower = kw.toLowerCase();
        if (
          profile.techStackKeywords.includes(kwLower) ||
          profile.dependencies.some((d) => d.includes(kwLower))
        ) {
          score += 1;
          matchedSignals.push(`kw:${kw}`);
        }
      }
    }

    return { score, matchedSignals };
  }

  private parseSkillMarkdown(content: string, fallbackName: string): {
    name: string;
    description: string;
    party: "1p" | "3p";
    signals: DetectionSignals;
  } {
    let name = fallbackName;
    let description = "";
    let party: "1p" | "3p" = "1p";
    const signals: DetectionSignals = { dependencies: [], keywords: [], globs: [] };

    if (content.startsWith("---")) {
      const parts = content.split("---");
      if (parts.length >= 3) {
        const frontmatter = parts[1];
        const lines = frontmatter.split("\n");
        let currentArrayKey: keyof DetectionSignals | null = null;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("name:")) {
            name = trimmed.replace("name:", "").trim();
            currentArrayKey = null;
          } else if (trimmed.startsWith("description:")) {
            description = trimmed.replace("description:", "").trim();
            currentArrayKey = null;
          } else if (trimmed.startsWith("party:")) {
            const p = trimmed.replace("party:", "").trim().toLowerCase();
            if (p === "3p") party = "3p";
            currentArrayKey = null;
          } else if (trimmed.startsWith("dependencies:")) {
            currentArrayKey = "dependencies";
            const val = trimmed.replace("dependencies:", "").trim();
            if (val.startsWith("[") && val.endsWith("]")) {
              signals.dependencies = JSON.parse(val);
              currentArrayKey = null;
            }
          } else if (trimmed.startsWith("globs:")) {
            currentArrayKey = "globs";
            const val = trimmed.replace("globs:", "").trim();
            if (val.startsWith("[") && val.endsWith("]")) {
              signals.globs = JSON.parse(val);
              currentArrayKey = null;
            }
          } else if (trimmed.startsWith("keywords:")) {
            currentArrayKey = "keywords";
            const val = trimmed.replace("keywords:", "").trim();
            if (val.startsWith("[") && val.endsWith("]")) {
              signals.keywords = JSON.parse(val);
              currentArrayKey = null;
            }
          } else if (trimmed.startsWith("- ") && currentArrayKey) {
            signals[currentArrayKey]?.push(trimmed.slice(2).replace(/["']/g, "").trim());
          }
        }
      }
    }

    return { name, description, party, signals };
  }

  private parseCatalogMarkdown(content: string): SkillCandidate[] {
    const skills: SkillCandidate[] = [];
    const sections = content.split(/^###\s+/m);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const lines = section.split("\n");
      const name = lines[0].trim();
      let description = "";
      let url = "";
      let party: "1p" | "3p" = "1p";
      const signals: DetectionSignals = { dependencies: [], keywords: [], globs: [] };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("-   **Description**:") || trimmed.startsWith("- **Description**:")) {
          description = trimmed.replace(/^-+\s+\*\*Description\*\*:\s*/, "").trim();
        } else if (trimmed.startsWith("-   **URL**:") || trimmed.startsWith("- **URL**:")) {
          url = trimmed.replace(/^-+\s+\*\*URL\*\*:\s*/, "").trim();
        } else if (trimmed.startsWith("-   **Party**:") || trimmed.startsWith("- **Party**:")) {
          const p = trimmed.replace(/^-+\s+\*\*Party\*\*:\s*/, "").trim().toLowerCase();
          if (p === "3p") party = "3p";
        } else if (trimmed.includes("**Dependencies**:")) {
          const raw = trimmed.replace(/.*?\*\*Dependencies\*\*:\s*/, "");
          const items = raw.split(",").map((s) => s.replace(/[`"'\s]/g, "")).filter(Boolean);
          signals.dependencies?.push(...items);
        } else if (trimmed.includes("**Keywords**:")) {
          const raw = trimmed.replace(/.*?\*\*Keywords\*\*:\s*/, "");
          const items = raw.split(",").map((s) => s.replace(/[`"'\s]/g, "")).filter(Boolean);
          signals.keywords?.push(...items);
        }
      }

      if (name) {
        skills.push({
          name,
          description,
          source: "remote",
          party,
          url,
          signals,
          score: 0,
          matchedSignals: [],
        });
      }
    }

    return skills;
  }

  private collectFiles(dir: string, maxDepth: number, currentDepth: number = 0): string[] {
    if (currentDepth >= maxDepth || !existsSync(dir)) return [];
    const results: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === ".venv" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "target"
        ) {
          continue;
        }

        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.collectFiles(fullPath, maxDepth, currentDepth + 1));
        } else {
          results.push(entry.name);
        }
      }
    } catch {
      // ignore
    }

    return results;
  }
}
