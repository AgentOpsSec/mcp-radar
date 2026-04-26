import path from "node:path";
import { TOOL } from "./constants.js";
import { ROOT, fileExists, readJson, writeJson } from "./utils.js";

export async function loadRegistry({ cwd = process.cwd(), registryPath = "" } = {}) {
  const projectRegistry = path.join(cwd, ".mcp-radar", "registry.json");
  const target = registryPath
    ? path.resolve(cwd, registryPath)
    : (await fileExists(projectRegistry)) ? projectRegistry : path.join(ROOT, "data", "registry.json");
  return readJson(target);
}

export async function searchRegistry(query = "", options = {}) {
  const registry = await loadRegistry(options);
  const normalized = query.toLowerCase();
  return registry.filter((entry) => {
    return !normalized || [
      entry.id,
      entry.name,
      entry.repository,
      entry.package,
      ...(entry.categories || []),
      ...(entry.permissions || [])
    ].join(" ").toLowerCase().includes(normalized);
  }).map(scoreEntry);
}

export async function findEntry(id, options = {}) {
  const registry = await loadRegistry(options);
  const entry = registry.find((item) => [item.id, item.repository, item.package, item.name].filter(Boolean).some((value) => value.toLowerCase() === id.toLowerCase()));
  if (!entry) throw new Error(`MCP server not found: ${id}`);
  return scoreEntry(entry);
}

export async function scoreDoctorReport(reportPath, cwd = process.cwd(), { registryPath = "" } = {}) {
  const report = await readJson(path.resolve(cwd, reportPath));
  const registry = await loadRegistry({ cwd, registryPath });
  const scoredServers = (report.servers || []).map((server) => {
    const match = findRegistryMatch(server, registry);
    if (match) {
      return {
        server: server.name,
        matched: true,
        source: "mcp-doctor",
        doctorRisk: server.risk,
        radar: scoreEntry(match)
      };
    }
    return {
      server: server.name,
      matched: false,
      source: "mcp-doctor",
      doctorRisk: server.risk,
      radar: scoreEntry(unknownEntry(server))
    };
  });
  return {
    schemaVersion: "1.0",
    tool: TOOL,
    source: {
      tool: report.tool,
      path: path.resolve(cwd, reportPath)
    },
    summary: {
      servers: scoredServers.length,
      matched: scoredServers.filter((server) => server.matched).length,
      unmatched: scoredServers.filter((server) => !server.matched).length
    },
    scoredServers
  };
}

function findRegistryMatch(server, registry) {
  const haystack = [server.name, server.command, ...(server.args || [])].filter(Boolean).join(" ").toLowerCase();
  return registry.find((entry) => {
    return [entry.id, entry.repository, entry.package, entry.name].filter(Boolean).some((value) => haystack.includes(String(value).toLowerCase()));
  });
}

function unknownEntry(server) {
  const categories = server.categories || [];
  const permissions = categories.flatMap((category) => {
    if (category === "filesystem") return ["filesystem.read", "filesystem.write"];
    if (category === "shell") return ["shell.exec"];
    if (category === "database") return ["database.read", "database.write"];
    if (category === "github") return ["github.read", "github.write"];
    return [`${category}.access`];
  });
  return {
    id: server.name,
    name: server.name,
    repository: "unknown",
    package: firstPackageArg(server.args || []) || server.command || "unknown",
    license: "unknown",
    categories,
    permissions,
    maintenance: { activity: "unknown", releaseAgeDays: 9999, stars: 0 },
    install: { method: server.command || "unknown", pinned: false },
    docs: { quality: "unknown", schema: "unknown" }
  };
}

function firstPackageArg(args) {
  return args.find((arg) => String(arg).startsWith("@") || /^[a-z0-9][a-z0-9._-]+/i.test(arg));
}

export function scoreEntry(entry) {
  const findings = [];
  let points = 100;
  const permissions = entry.permissions || [];
  const categories = entry.categories || [];

  if (permissions.some((permission) => /write|shell|database|filesystem/i.test(permission))) {
    points -= 15;
    findings.push({ type: "permission", severity: "medium", message: "Requires powerful write or system access." });
  }
  if (categories.includes("database") || categories.includes("payments")) {
    points -= 20;
    findings.push({ type: "permission", severity: "high", message: "Touches sensitive data or money movement domains." });
  }
  if (!entry.install?.pinned) {
    points -= 10;
    findings.push({ type: "install", severity: "medium", message: "Install method is not pinned." });
  }
  if (/curl|sh/i.test(entry.install?.method || "")) {
    points -= 20;
    findings.push({ type: "install", severity: "high", message: "Install method may execute remote scripts." });
  }
  if (entry.maintenance?.activity === "low" || entry.maintenance?.releaseAgeDays > 180) {
    points -= 20;
    findings.push({ type: "maintenance", severity: "medium", message: "Low maintenance or stale release history." });
  }
  if (!entry.license || entry.license === "unknown") {
    points -= 5;
    findings.push({ type: "metadata", severity: "low", message: "License is unknown." });
  }
  if (entry.docs?.quality === "low" || entry.docs?.schema === "low") {
    points -= 15;
    findings.push({ type: "documentation", severity: "medium", message: "Documentation or schema quality is weak." });
  }

  const score = grade(points);
  const risk = riskFromFindings(findings);
  return {
    schemaVersion: "1.0",
    tool: TOOL,
    ...entry,
    score,
    points,
    risk,
    findings
  };
}

export async function submitEntry(filePath, cwd = process.cwd()) {
  const entry = await readJson(path.resolve(cwd, filePath));
  const scored = scoreEntry(entry);
  const out = path.join(cwd, ".mcp-radar", "submissions.jsonl");
  await writeJson(path.join(cwd, ".mcp-radar", "latest-submission.json"), scored);
  await import("node:fs").then((fs) => fs.promises.appendFile(out, `${JSON.stringify(scored)}\n`, "utf8"));
  return scored;
}

export async function validateRegistry(filePath = "", cwd = process.cwd()) {
  const target = filePath ? path.resolve(cwd, filePath) : path.join(ROOT, "data", "registry.json");
  const registry = await readJson(target);
  const errors = [];
  if (!Array.isArray(registry)) {
    errors.push({ path: target, message: "Registry must be a JSON array." });
  } else {
    registry.forEach((entry, index) => {
      for (const field of ["id", "name", "repository", "categories", "permissions", "install", "maintenance", "docs"]) {
        if (entry[field] === undefined) errors.push({ index, id: entry.id, message: `Missing required field: ${field}` });
      }
      if (entry.categories && !Array.isArray(entry.categories)) errors.push({ index, id: entry.id, message: "categories must be an array." });
      if (entry.permissions && !Array.isArray(entry.permissions)) errors.push({ index, id: entry.id, message: "permissions must be an array." });
    });
  }
  return {
    schemaVersion: "1.0",
    tool: TOOL,
    path: target,
    valid: errors.length === 0,
    entries: Array.isArray(registry) ? registry.length : 0,
    errors
  };
}

export async function updateRegistry({ from, cwd = process.cwd() } = {}) {
  if (!from) throw new Error("registry update requires --from file.");
  const source = path.resolve(cwd, from);
  const validation = await validateRegistry(source, cwd);
  if (!validation.valid) return { ...validation, updated: false };
  const registry = await readJson(source);
  const outputPath = path.join(cwd, ".mcp-radar", "registry.json");
  await writeJson(outputPath, registry);
  return {
    schemaVersion: "1.0",
    tool: TOOL,
    updated: true,
    source,
    outputPath,
    entries: registry.length
  };
}

function grade(points) {
  if (points >= 90) return "A";
  if (points >= 80) return "A-";
  if (points >= 70) return "B";
  if (points >= 60) return "B-";
  if (points >= 50) return "C";
  if (points >= 40) return "D";
  return "F";
}

function riskFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "high")) return "high";
  if (findings.some((finding) => finding.severity === "medium")) return "medium";
  return "low";
}
