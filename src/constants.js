export const BRAND = "github.com/AgentOpsSec";
export const VERSION = "1.0.0";
export const TOOL = {
  name: "MCP Radar",
  by: BRAND,
  repository: "github.com/AgentOpsSec/mcp-radar"
};

export function brandedTitle(label = "") {
  return ["MCP Radar", label, `by ${BRAND}`].filter(Boolean).join(" ");
}
