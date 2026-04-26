import { brandedTitle } from "./constants.js";
import { dim, green, risk as paintRisk } from "./tui.js";

function scoreSeverity(score) {
  if (score === "F" || score === "D") return "high";
  if (score === "C" || score === "C+" || score === "B-" || score === "B") return "medium";
  return "low";
}

export function renderScore(entry) {
  const lines = [
    brandedTitle("Score"),
    "",
    entry.name,
    `Repository: ${entry.repository}`,
    `Score: ${paintRisk(scoreSeverity(entry.score), entry.score)}`,
    `Risk: ${paintRisk(entry.risk, entry.risk)}`,
    `Categories: ${(entry.categories || []).join(", ") || "none"}`,
    "",
    "Findings:"
  ];
  if (entry.findings.length === 0) lines.push(green("- none"));
  for (const finding of entry.findings) lines.push(`- [${paintRisk(finding.severity, finding.severity)}] ${finding.message}`);
  return `${lines.join("\n")}\n`;
}

export function renderSearch(results) {
  const lines = [brandedTitle("Search"), ""];
  if (results.length === 0) lines.push(dim("No MCP servers found."));
  for (const result of results) lines.push(`- ${result.repository} ${paintRisk(scoreSeverity(result.score), result.score)} ${paintRisk(result.risk, result.risk)}`);
  return `${lines.join("\n")}\n`;
}

export function renderCompare(entries) {
  const lines = [brandedTitle("Compare"), ""];
  for (const entry of entries) lines.push(`- ${entry.repository}: score=${paintRisk(scoreSeverity(entry.score), entry.score)} risk=${paintRisk(entry.risk, entry.risk)}`);
  return `${lines.join("\n")}\n`;
}

export function renderDoctorScores(result) {
  const lines = [
    brandedTitle("Doctor"),
    "",
    `Servers: ${result.summary.servers}`,
    `Matched: ${result.summary.matched}`,
    `Unmatched: ${result.summary.unmatched}`,
    ""
  ];
  for (const server of result.scoredServers) {
    const score = paintRisk(scoreSeverity(server.radar.score), server.radar.score);
    const risk = paintRisk(server.radar.risk, server.radar.risk);
    lines.push(`- ${server.server}: ${score} ${risk}${server.matched ? "" : ` ${dim("(unmatched)")}`}`);
  }
  return `${lines.join("\n")}\n`;
}

export function badge(entry) {
  const label = encodeURIComponent("mcp radar");
  const message = encodeURIComponent(`${entry.score} ${entry.risk}`);
  const color = entry.risk === "high" ? "red" : entry.risk === "medium" ? "yellow" : "green";
  return `https://img.shields.io/badge/${label}-${message}-${color}`;
}
