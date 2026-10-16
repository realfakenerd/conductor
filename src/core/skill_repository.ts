import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface RegisteredSkill {
  name: string;
  description: string;
  source: "local" | "remote";
  party: "1p" | "3p";
  version?: string;
  commitSha?: string;
  path: string;
  triggers?: string[];
  dateAdded: string;
}

export interface SkillManifest {
  version: "1.0";
  skills: RegisteredSkill[];
}

export class SkillRepository {
  private rootDir: string;
  private conductorDir: string;
  private jsonPath: string;
  private skillsDir: string;
  private mdPath: string;
  private indexMdPath: string;

  constructor(rootDir: string = ".") {
    this.rootDir = rootDir;
    this.conductorDir = join(rootDir, "conductor");
    this.jsonPath = join(this.conductorDir, "skills.json");
    this.skillsDir = join(this.conductorDir, "skills");
    this.mdPath = join(this.skillsDir, "index.md");
    this.indexMdPath = join(this.conductorDir, "index.md");
  }

  /**
   * Returns list of currently registered project skills.
   */
  list(): RegisteredSkill[] {
    if (!existsSync(this.jsonPath)) {
      return [];
    }
    try {
      const data: SkillManifest = JSON.parse(readFileSync(this.jsonPath, "utf-8"));
      return data.skills || [];
    } catch {
      return [];
    }
  }

  /**
   * Retrieves a single registered skill by name.
   */
  get(name: string): RegisteredSkill | undefined {
    return this.list().find((s) => s.name === name);
  }

  /**
   * Registers a skill into conductor/skills.json and synchronizes markdown catalog.
   */
  register(skillData: Omit<RegisteredSkill, "dateAdded">): RegisteredSkill {
    if (skillData.party === "3p" && !skillData.commitSha) {
      throw new Error("Third-party skills must include an immutable commit SHA for security verification.");
    }

    const currentSkills = this.list();
    const dateAdded = new Date().toISOString().split("T")[0];
    const registered: RegisteredSkill = {
      ...skillData,
      dateAdded,
    };

    const existingIndex = currentSkills.findIndex((s) => s.name === registered.name);
    if (existingIndex >= 0) {
      currentSkills[existingIndex] = registered;
    } else {
      currentSkills.push(registered);
    }

    // Atomic write to skills.json
    mkdirSync(this.conductorDir, { recursive: true });
    const manifest: SkillManifest = {
      version: "1.0",
      skills: currentSkills,
    };
    writeFileSync(this.jsonPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

    // Sync markdown catalog and root handshake
    this.syncCatalogMarkdown(currentSkills);

    return registered;
  }

  /**
   * Removes a skill from the project catalog.
   */
  remove(name: string): boolean {
    const currentSkills = this.list();
    const filtered = currentSkills.filter((s) => s.name !== name);
    if (filtered.length === currentSkills.length) {
      return false;
    }

    const manifest: SkillManifest = {
      version: "1.0",
      skills: filtered,
    };
    writeFileSync(this.jsonPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
    this.syncCatalogMarkdown(filtered);
    return true;
  }

  /**
   * Reads raw markdown content of a registered skill.
   */
  getSkillContent(name: string): string | null {
    const skill = this.get(name);
    if (!skill) return null;

    let targetPath = skill.path;
    if (!existsSync(targetPath)) {
      targetPath = join(this.rootDir, skill.path);
    }
    if (!existsSync(targetPath)) {
      const fallbackAgentSkill = join(this.rootDir, ".agents", "skills", name, "SKILL.md");
      if (existsSync(fallbackAgentSkill)) {
        targetPath = fallbackAgentSkill;
      }
    }

    if (existsSync(targetPath)) {
      try {
        return readFileSync(targetPath, "utf-8");
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Synchronizes conductor/skills/index.md and root conductor/index.md handshake.
   */
  syncCatalogMarkdown(skills?: RegisteredSkill[]): void {
    const skillList = skills ?? this.list();
    mkdirSync(this.skillsDir, { recursive: true });

    let md = "# Project Skills Catalog\n\n";
    md += "Curated agent capabilities active for this project.\n\n";

    if (skillList.length === 0) {
      md += "_No skills registered in this project._\n";
    } else {
      md += "| Name | Party | Source | Triggers | Description | Path |\n";
      md += "|---|---|---|---|---|---|\n";
      for (const s of skillList) {
        const triggers = (s.triggers || []).join(", ") || "-";
        const desc = s.description.replace(/\|/g, "\\|");
        md += `| **${s.name}** | \`${s.party}\` | ${s.source} | \`${triggers}\` | ${desc} | \`${s.path}\` |\n`;
      }
    }

    writeFileSync(this.mdPath, md, "utf-8");

    // Handshake check in conductor/index.md
    if (existsSync(this.indexMdPath)) {
      try {
        const indexContent = readFileSync(this.indexMdPath, "utf-8");
        const skillLink = "[Project Skills](./skills/index.md)";
        if (!indexContent.includes(skillLink)) {
          let updated = indexContent;
          if (updated.includes("## Capabilities")) {
            updated = updated.replace(
              /## Capabilities\s*\n/,
              `## Capabilities\n\n-   ${skillLink}\n`
            );
          } else {
            updated = updated.trimEnd() + `\n\n## Capabilities\n\n-   ${skillLink}\n`;
          }
          writeFileSync(this.indexMdPath, updated, "utf-8");
        }
      } catch {
        // ignore
      }
    }
  }
}
