import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createConductorMcpServer } from "../src/mcp/index.ts";

describe("Conductor MCP Skill Tools", () => {
  it("should discover, list, and install skills via MCP client", async () => {
    const root = mkdtempSync(join(tmpdir(), "cond-mcp-skills-test-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });
    writeFileSync(join(conductorDir, "index.md"), "# Index\n");

    const server = createConductorMcpServer(root);
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    // 1. List skills (initially empty)
    const listRes1 = (await client.callTool({
      name: "conductor_skill_list",
      arguments: { root_dir: root },
    })) as any;
    expect(listRes1.isError).toBeFalsy();
    const skills1 = JSON.parse(listRes1.content[0].text);
    expect(skills1).toEqual([]);

    // 2. Install a 1p skill
    const installRes = (await client.callTool({
      name: "conductor_skill_install",
      arguments: {
        name: "test-mcp-skill",
        party: "1p",
        description: "Test skill via MCP",
        triggers: ["*.ts"],
        root_dir: root,
      },
    })) as any;
    expect(installRes.isError).toBeFalsy();
    const installed = JSON.parse(installRes.content[0].text);
    expect(installed.name).toBe("test-mcp-skill");

    // 3. List skills again
    const listRes2 = (await client.callTool({
      name: "conductor_skill_list",
      arguments: { root_dir: root },
    })) as any;
    const skills2 = JSON.parse(listRes2.content[0].text);
    expect(skills2.length).toBe(1);
    expect(skills2[0].name).toBe("test-mcp-skill");

    // 4. Discover skills
    const discoverRes = (await client.callTool({
      name: "conductor_skill_discover",
      arguments: { root_dir: root },
    })) as any;
    expect(discoverRes.isError).toBeFalsy();
    const candidates = JSON.parse(discoverRes.content[0].text);
    expect(Array.isArray(candidates)).toBe(true);

    await client.close();
    await server.close();
  });
});
