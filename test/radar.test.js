import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { main } from "../src/cli.js";
import { findEntry, searchRegistry } from "../src/registry.js";

function io() {
  let output = "";
  return {
    api: { stdout: (text) => { output += text; } },
    get output() { return output; }
  };
}

test("scores curated registry entries", async () => {
  const entry = await findEntry("modelcontextprotocol/server-github");
  assert.equal(entry.tool.by, "github.com/AgentOpsSec");
  assert.equal(entry.risk, "medium");
  assert.ok(entry.findings.length > 0);
});

test("search and CLI score are branded", async () => {
  const results = await searchRegistry("github");
  assert.ok(results.length >= 1);
  const session = io();
  await main(["score", "modelcontextprotocol/server-github"], session.api);
  assert.match(session.output, /MCP Radar Score by github\.com\/AgentOpsSec/);
});

test("submit scores a local profile", async () => {
  const cwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "mcp-radar-"));
  const profile = path.join(cwd, "profile.json");
  await fs.promises.writeFile(profile, JSON.stringify({
    id: "example/server",
    name: "Example Server",
    repository: "example/server",
    categories: ["database"],
    permissions: ["database.write"],
    install: { method: "curl | sh", pinned: false },
    maintenance: { activity: "low", releaseAgeDays: 400 },
    docs: { quality: "low", schema: "low" }
  }), "utf8");
  const session = io();
  await main(["submit", profile, "--cwd", cwd], session.api);
  assert.match(session.output, /Risk: high/);
});

test("scores MCP Doctor reports without requiring MCP Doctor code", async () => {
  const cwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "mcp-radar-doctor-"));
  const report = path.join(cwd, "doctor.json");
  await fs.promises.writeFile(report, JSON.stringify({
    tool: {
      name: "MCP Doctor",
      by: "github.com/AgentOpsSec",
      repository: "github.com/AgentOpsSec/mcp-doctor"
    },
    servers: [
      {
        name: "github",
        command: "npx",
        args: ["@modelcontextprotocol/server-github"],
        categories: ["github"],
        risk: "medium"
      },
      {
        name: "unknown-shell",
        command: "bash",
        args: ["./server.sh"],
        categories: ["shell"],
        risk: "high"
      }
    ]
  }), "utf8");
  const session = io();
  await main(["score-doctor", report, "--cwd", cwd], session.api);
  assert.match(session.output, /MCP Radar Doctor by github\.com\/AgentOpsSec/);
  assert.match(session.output, /Matched: 1/);
  assert.match(session.output, /Unmatched: 1/);
});

test("validates and updates a project registry", async () => {
  const cwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "mcp-radar-registry-"));
  const registryPath = path.join(cwd, "registry.json");
  await fs.promises.writeFile(registryPath, JSON.stringify([
    {
      id: "local/server",
      name: "Local Server",
      repository: "local/server",
      package: "local-server",
      license: "MIT",
      categories: ["filesystem"],
      permissions: ["filesystem.read"],
      install: { method: "npm", pinned: true },
      maintenance: { activity: "high", releaseAgeDays: 1 },
      docs: { quality: "high", schema: "high" }
    }
  ]), "utf8");
  let session = io();
  await main(["validate", registryPath, "--cwd", cwd], session.api);
  assert.match(session.output, /Valid: true/);

  session = io();
  await main(["registry", "update", "--from", registryPath, "--cwd", cwd], session.api);
  assert.match(session.output, /Updated: true/);

  session = io();
  await main(["score", "local/server", "--cwd", cwd], session.api);
  assert.match(session.output, /Local Server/);

  const reportPath = path.join(cwd, "doctor.json");
  await fs.promises.writeFile(reportPath, JSON.stringify({
    servers: [{ name: "local", command: "npx", args: ["local-server"], categories: ["filesystem"], risk: "low" }]
  }), "utf8");
  session = io();
  await main(["score-doctor", reportPath, "--cwd", cwd], session.api);
  assert.match(session.output, /Matched: 1/);
});
