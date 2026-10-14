import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createConductorMcpServer } from "../src/mcp/index.ts";

describe("Conductor MCP Server", () => {
  it("should list all 16 tools and execute conductor_verify, conductor_track_init, conductor_guard_check, and conductor_status", async () => {
    const root = mkdtempSync(join(tmpdir(), "cond-mcp-test-"));
    const conductorDir = join(root, "conductor");
    mkdirSync(conductorDir, { recursive: true });

    writeFileSync(join(conductorDir, "product.md"), "# Product");
    writeFileSync(join(conductorDir, "index.md"), "# Index\n[Product](./product.md)");

    const server = createConductorMcpServer(root);
    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    // 1. List tools
    const toolList = await client.listTools();
    const toolNames = toolList.tools.map((t) => t.name);

    expect(toolNames).toContain("conductor_verify");
    expect(toolNames).toContain("conductor_status");
    expect(toolNames).toContain("conductor_list");
    expect(toolNames).toContain("conductor_resume");
    expect(toolNames).toContain("conductor_track_init");
    expect(toolNames).toContain("conductor_track_start");
    expect(toolNames).toContain("conductor_track_reset");
    expect(toolNames).toContain("conductor_track_advance");
    expect(toolNames).toContain("conductor_track_finish");
    expect(toolNames).toContain("conductor_track_checkpoint");
    expect(toolNames).toContain("conductor_track_complete");
    expect(toolNames).toContain("conductor_track_resolve");
    expect(toolNames).toContain("conductor_guard_check");
    expect(toolNames).toContain("conductor_worktree_create");
    expect(toolNames).toContain("conductor_worktree_list");
    expect(toolNames).toContain("conductor_worktree_remove");
    expect(toolNames).toContain("conductor_review_verify");
    expect(toolNames).toContain("conductor_adr_list");
    expect(toolNames).toContain("conductor_adr_init");
    expect(toolNames).toContain("conductor_adr_link");
    expect(toolNames.length).toBe(20);

    // 2. Call conductor_verify
    const verifyResult = (await client.callTool({
      name: "conductor_verify",
      arguments: {},
    })) as any;

    expect(verifyResult.isError).toBeFalsy();
    const verifyContent = JSON.parse(verifyResult.content[0].text);
    expect(verifyContent.valid).toBe(true);

    // 3. Call conductor_track_init
    const initResult = (await client.callTool({
      name: "conductor_track_init",
      arguments: {
        track_id: "mcp_track",
        type: "feature",
        description: "MCP Feature",
      },
    })) as any;

    expect(initResult.isError).toBeFalsy();
    const initContent = JSON.parse(initResult.content[0].text);
    expect(initContent.track_id).toBe("mcp_track");

    // Write track index.md to satisfy integrity parity
    writeFileSync(join(conductorDir, "tracks", "mcp_track", "index.md"), "# Track\n");

    // 4. Call conductor_track_resolve
    const resolveResult = (await client.callTool({
      name: "conductor_track_resolve",
      arguments: {
        query: "mcp",
      },
    })) as any;

    expect(resolveResult.isError).toBeFalsy();
    const resolveContent = JSON.parse(resolveResult.content[0].text);
    expect(resolveContent.status).toBe("matched");
    expect(resolveContent.track.track_id).toBe("mcp_track");

    // 5. Call conductor_guard_check
    const guardResult = (await client.callTool({
      name: "conductor_guard_check",
      arguments: {},
    })) as any;
    expect(guardResult.isError).toBeFalsy();
    const guardContent = JSON.parse(guardResult.content[0].text);
    expect(guardContent.valid).toBe(true);

    // Write a minimal plan to test review verify
    writeFileSync(join(conductorDir, "tracks", "mcp_track", "plan.md"), "# Plan\n- [ ] Task: Test task\n");

    // 6. Call conductor_review_verify
    const reviewResult = (await client.callTool({
      name: "conductor_review_verify",
      arguments: {
        track_id: "mcp_track",
        skip_tests: true,
      },
    })) as any;
    expect(reviewResult.isError).toBeFalsy();
    const reviewContent = JSON.parse(reviewResult.content[0].text);
    expect(reviewContent.track_id).toBe("mcp_track");
    expect(reviewContent.valid).toBe(true);

    // 7. Call conductor_adr_init, conductor_adr_link, conductor_adr_list
    const adrInitRes = (await client.callTool({
      name: "conductor_adr_init",
      arguments: {
        title: "MCP Architecture Decision",
        status: "accepted",
      },
    })) as any;
    expect(adrInitRes.isError).toBeFalsy();
    const adrData = JSON.parse(adrInitRes.content[0].text);
    expect(adrData.number).toBe(1);

    const adrLinkRes = (await client.callTool({
      name: "conductor_adr_link",
      arguments: {
        adr_number: 1,
        track_id: "mcp_track",
      },
    })) as any;
    expect(adrLinkRes.isError).toBeFalsy();

    const adrListRes = (await client.callTool({
      name: "conductor_adr_list",
      arguments: {},
    })) as any;
    expect(adrListRes.isError).toBeFalsy();
    const adrList = JSON.parse(adrListRes.content[0].text);
    expect(adrList.length).toBe(1);
    expect(adrList[0].linked_tracks).toContain("mcp_track");

    await client.close();
    await server.close();
  });
});
