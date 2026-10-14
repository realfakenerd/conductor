import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createConductorMcpServer } from "../src/mcp/index.ts";
import { resolveMcpResource, listMcpResources, listMcpPrompts, getMcpPrompt } from "../src/core/mcp_resources.ts";

describe("MCP Resources & Prompts", () => {
  it("should resolve core conductor resources directly via resolver", () => {
    const root = mkdtempSync(join(tmpdir(), "cond-res-test-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });

    writeFileSync(join(conductorDir, "product.md"), "# Test Product");
    writeFileSync(join(conductorDir, "index.md"), "# Test Index\n[Product](./product.md)");
    writeFileSync(join(root, "CONTEXT.md"), "# Domain Context\nTest glossary");

    // 1. List
    const resources = listMcpResources();
    expect(resources.length).toBeGreaterThanOrEqual(4);
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("conductor://tracks");
    expect(uris).toContain("conductor://active-track");
    expect(uris).toContain("conductor://handshake");
    expect(uris).toContain("conductor://context");

    // 2. Read handshake
    const handshake = resolveMcpResource("conductor://handshake", root);
    expect(handshake.text).toContain("Test Index");

    // 3. Read context
    const ctx = resolveMcpResource("conductor://context", root);
    expect(ctx.text).toContain("Domain Context");

    // 4. Read tracks
    const tracks = resolveMcpResource("conductor://tracks", root);
    expect(tracks.mimeType).toBe("application/json");

    // 5. Read adrs
    const adrs = resolveMcpResource("conductor://adrs", root);
    expect(adrs.text).toContain("Architecture Decision Records");

    // 6. Read agents
    const agentsRes = resolveMcpResource("conductor://agents", root);
    expect(agentsRes.mimeType).toBe("application/json");

    // 7. Prompts
    const prompts = listMcpPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(2);
    const promptNames = prompts.map((p) => p.name);
    expect(promptNames).toContain("conductor_track_start");
    expect(promptNames).toContain("conductor_task_implement");

    const promptObj = getMcpPrompt("conductor_track_start", { track_id: "demo", title: "Demo Feature" });
    expect(promptObj.messages.length).toBeGreaterThan(0);
    expect(promptObj.messages[0].content.text).toContain("Demo Feature");
  });

  it("should serve resources and prompts over MCP stdio protocol client", async () => {
    const root = mkdtempSync(join(tmpdir(), "cond-mcp-res-client-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });

    writeFileSync(join(conductorDir, "product.md"), "# Client Product");
    writeFileSync(join(conductorDir, "index.md"), "# Client Index\n[Product](./product.md)");

    const server = createConductorMcpServer(root);
    const client = new Client({ name: "res-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    // 1. List Resources via MCP Client
    const resList = await client.listResources();
    const uris = resList.resources.map((r) => r.uri);
    expect(uris).toContain("conductor://handshake");
    expect(uris).toContain("conductor://tracks");

    // 2. Read Resource via MCP Client
    const readRes = await client.readResource({ uri: "conductor://handshake" });
    expect(readRes.contents.length).toBe(1);
    expect((readRes.contents[0] as any).text).toContain("Client Index");

    // 3. List Prompts via MCP Client
    const promptList = await client.listPrompts();
    const promptNames = promptList.prompts.map((p) => p.name);
    expect(promptNames).toContain("conductor_task_implement");

    // 4. Get Prompt via MCP Client
    const promptMsg = await client.getPrompt({
      name: "conductor_task_implement",
      arguments: { task: "Build feature", track_id: "feat_1" },
    });
    expect(promptMsg.messages.length).toBeGreaterThan(0);
    expect((promptMsg.messages[0].content as any).text).toContain("Build feature");

    await client.close();
    await server.close();
  });
});
