import { brandedTitle, TOOL, VERSION } from "./constants.js";
import { badge, renderCompare, renderDoctorScores, renderScore, renderSearch } from "./report.js";
import { findEntry, scoreDoctorReport, searchRegistry, submitEntry, updateRegistry, validateRegistry } from "./registry.js";
import { amber, green, paint, red, risk as paintRisk, setColor, shouldColor } from "./tui.js";
import { updateOne } from "./updater.js";
import { parseArgs, stringify } from "./utils.js";

const PACKAGE_NAME = "@agentopssec/mcp-radar";

async function runUpdate(args, io) {
  const flagSet = new Set(args);
  await updateOne({
    packageName: PACKAGE_NAME,
    currentVersion: VERSION,
    title: brandedTitle("Update"),
    color: { amber, green },
    io,
    yes: flagSet.has("--yes") || flagSet.has("-y")
  });
}

export async function main(argv = process.argv.slice(2), io = defaultIo()) {
  const command = argv[0] || "help";
  const args = argv.slice(1);
  if (["help", "--help", "-h"].includes(command)) return io.stdout(help());
  if (["version", "--version", "-v"].includes(command)) return io.stdout(`mcp-radar ${VERSION}\n`);
  if (command === "search") return runSearch(args, io);
  if (command === "score") return runScore(args, io);
  if (command === "compare") return runCompare(args, io);
  if (command === "badge") return runBadge(args, io);
  if (command === "submit") return runSubmit(args, io);
  if (command === "score-doctor") return runScoreDoctor(args, io);
  if (command === "validate") return runValidate(args, io);
  if (command === "registry") return runRegistry(args, io);
  if (command === "update" || command === "--update") return runUpdate(args, io);
  throw new Error(`Unknown command "${command}".`);
}

async function runSearch(args, io) {
  const { flags, positional } = parseArgs(args);
  const results = await searchRegistry(positional.join(" "), { cwd: flags.cwd || process.cwd(), registryPath: flags.registry });
  io.stdout(flags.json ? stringify({ tool: TOOL, results }) : renderSearch(results));
}

async function runScore(args, io) {
  const { flags, positional } = parseArgs(args);
  if (!positional[0]) throw new Error("score requires a server id or repository.");
  const entry = await findEntry(positional[0], { cwd: flags.cwd || process.cwd(), registryPath: flags.registry });
  io.stdout(flags.json ? stringify(entry) : renderScore(entry));
}

async function runCompare(args, io) {
  const { flags, positional } = parseArgs(args);
  if (positional.length < 2) throw new Error("compare requires at least two servers.");
  const entries = [];
  for (const id of positional) entries.push(await findEntry(id, { cwd: flags.cwd || process.cwd(), registryPath: flags.registry }));
  io.stdout(flags.json ? stringify({ tool: TOOL, entries }) : renderCompare(entries));
}

async function runBadge(args, io) {
  const { flags, positional } = parseArgs(args);
  if (!positional[0]) throw new Error("badge requires a server id or repository.");
  const entry = await findEntry(positional[0], { cwd: flags.cwd || process.cwd(), registryPath: flags.registry });
  const url = badge(entry);
  io.stdout(flags.json ? stringify({ tool: TOOL, badge: url }) : `${brandedTitle("Badge")}\n\n${url}\n`);
}

async function runValidate(args, io) {
  const { flags, positional } = parseArgs(args);
  const result = await validateRegistry(positional[0] || flags.registry, flags.cwd || process.cwd());
  const validText = result.valid ? green("true") : red("false");
  io.stdout(flags.json ? stringify(result) : `${brandedTitle("Validate")}\n\nRegistry: ${result.path}\nEntries: ${result.entries}\nValid: ${validText}\n${result.errors.map((error) => `- ${red(error.message)}`).join("\n")}\n`);
  if (!result.valid) io.setExitCode?.(1);
}

async function runRegistry(args, io) {
  const subcommand = args[0] || "validate";
  const rest = args.slice(1);
  const { flags } = parseArgs(rest);
  if (subcommand === "validate") return runValidate(rest, io);
  if (subcommand === "update") {
    const result = await updateRegistry({ from: flags.from, cwd: flags.cwd || process.cwd() });
    io.stdout(flags.json ? stringify(result) : `${brandedTitle("Registry")}\n\nUpdated: ${result.updated}\nEntries: ${result.entries}\n${result.outputPath ? `Registry: ${result.outputPath}\n` : result.errors.map((error) => `- ${error.message}`).join("\n") + "\n"}`);
    if (!result.updated) io.setExitCode?.(1);
    return;
  }
  throw new Error(`Unknown registry command "${subcommand}".`);
}

async function runSubmit(args, io) {
  const { flags, positional } = parseArgs(args);
  if (!positional[0]) throw new Error("submit requires a JSON profile path.");
  const entry = await submitEntry(positional[0], flags.cwd || process.cwd());
  io.stdout(flags.json ? stringify(entry) : `${brandedTitle("Submit")}\n\nSubmitted ${entry.repository}\nScore: ${entry.score}\nRisk: ${paintRisk(entry.risk, entry.risk)}\n`);
}

async function runScoreDoctor(args, io) {
  const { flags, positional } = parseArgs(args);
  if (!positional[0]) throw new Error("score-doctor requires an MCP Doctor scan JSON file.");
  const result = await scoreDoctorReport(positional[0], flags.cwd || process.cwd(), { registryPath: flags.registry });
  io.stdout(flags.json ? stringify(result) : renderDoctorScores(result));
}

function help() {
  return [
    brandedTitle(),
    "",
    "Usage:",
    "  mcp-radar search github",
    "  mcp-radar score owner/repo",
    "  mcp-radar compare owner/a owner/b",
    "  mcp-radar badge owner/repo",
    "  mcp-radar submit ./mcp-server.json",
    "  mcp-radar score-doctor ./mcp-doctor-scan.json",
    "  mcp-radar validate [registry.json]",
    "  mcp-radar registry update --from registry.json",
    "  mcp-radar update [--yes]"
  ].join("\n") + "\n";
}

function defaultIo() {
  setColor(shouldColor(process.stdout));
  return {
    stdout: (text) => process.stdout.write(paint(text)),
    stderr: (text) => process.stderr.write(paint(text)),
    setExitCode: (code) => { process.exitCode = code; }
  };
}
