# MCP Radar

**Trust scores for MCP servers.**

MCP Radar is a public trust and discovery layer for MCP servers. It helps
developers evaluate MCP servers based on permissions, maintenance, install
method, package quality, documentation, and security risk before installing
them.

Think of it as:

```txt
The trust index for MCP servers
```

## Why This Exists

MCP servers are becoming a new supply chain for AI agents. Developers need to
know whether a server is maintained, documented, permissioned reasonably, and
safe enough to connect to a real agent workflow.

MCP Radar answers questions like:

- Who maintains this MCP server?
- What permissions does it require?
- Does it expose filesystem, shell, network, or database access?
- Is the package pinned and released responsibly?
- Is the repository active?
- Does the project have clear docs and schemas?
- Are there known vulnerabilities?
- Is the install method safe?
- How does it compare to alternatives?

MCP Radar turns those signals into transparent trust scores.

## Install

```bash
npm install -g @agentopssec/mcp-radar
```

Or run it without installing:

```bash
npx -y @agentopssec/mcp-radar search github
```

## Update

```bash
mcp-radar update          # check the registry, prompt before installing
mcp-radar update --yes    # update without prompting
```

## Primary Workflow

MCP Radar starts with searchable server profiles and CLI score lookup:

```bash
mcp-radar score owner/repo
```

The workflow should do three things well:

1. Show whether an MCP server is safe enough to install.
2. Explain the signals behind the score.
3. Make scores reusable through profiles, badges, and JSON.

## CLI

```bash
mcp-radar search github
mcp-radar score owner/repo
mcp-radar compare github-server filesystem-server
mcp-radar badge owner/repo
mcp-radar submit ./mcp-server.json
mcp-radar score-doctor ./mcp-doctor-scan.json
mcp-radar validate
mcp-radar registry update --from registry.json
mcp-radar update [--yes]
```

## Standalone and Stack Use

MCP Radar runs on its own using its curated local registry. Projects can also
provide `.mcp-radar/registry.json` for local/private server profiles:

```bash
mcp-radar search github
mcp-radar score modelcontextprotocol/server-github
mcp-radar registry update --from ./registry.json
```

When used with the full AgentOpsSec stack, it can score servers found by MCP
Doctor without importing MCP Doctor code:

```bash
mcp-doctor scan --json --output mcp-doctor-scan.json
mcp-radar score-doctor ./mcp-doctor-scan.json
```

## What MCP Radar Scores

MCP Radar scores MCP servers using signals such as:

- Repository activity
- Maintainer activity
- Stars and forks
- License
- Package age
- Release history
- Known vulnerabilities
- Install method
- Required permissions
- Tool categories
- Filesystem access
- Shell access
- Network access
- Token handling
- Environment variables
- Docker support
- Documentation quality
- Schema quality
- Prompt injection risk indicators

## Example Profile

```txt
MCP Radar Score by github.com/AgentOpsSec

Official GitHub MCP Server
Score: A-
Risk: Medium
Reason: Powerful repo access, but maintained and documented

Random Database MCP Server
Score: D
Risk: High
Reason: Broad database access, low maintainer activity, no version pinning, weak docs
```

## Score Shape

```json
{
  "tool": {
    "name": "MCP Radar",
    "by": "github.com/AgentOpsSec",
    "repository": "github.com/AgentOpsSec/mcp-radar"
  },
  "name": "example-mcp-server",
  "score": "B-",
  "risk": "medium",
  "categories": ["github", "filesystem"],
  "findings": [
    {
      "type": "permission",
      "severity": "medium",
      "message": "Requires repository write access"
    },
    {
      "type": "maintenance",
      "severity": "low",
      "message": "Last release was 22 days ago"
    }
  ]
}
```

## Public Outputs

MCP Radar is designed to produce reusable public artifacts:

- MCP server profile pages
- Searchable registry entries
- Transparent scoring breakdowns
- JSON API responses
- Score badges
- Community submissions
- Comparison views

## Design Principles

- Open scoring model
- Transparent findings
- Public by default
- Useful before installation
- Community-extensible registry
- Clear permission labels
- Security and maintenance signals together
- Easy integration with local scanners

## Initial Release Scope

The initial release includes a public registry, curated MCP server profiles,
transparent scoring, search, badges, JSON output, and community submissions.

### 1.0: Curated Registry

- Build a public MCP server registry
- Add an initial curated server list
- Create server profile pages
- Label tool categories and permissions
- Show install method and package metadata
- Include repository and license metadata

### 1.0: Scoring Model

- Define a transparent score model
- Score maintenance signals
- Score permission risk
- Score install safety
- Score documentation and schema quality
- Explain each finding behind the final score

### 1.0: Search, API, and Badges

- Add basic server search
- Add server comparison
- Generate score badges
- Expose public JSON score output
- Support community submissions
- Make scores consumable by local tools

### Registry Validation

```bash
mcp-radar validate
mcp-radar validate ./registry.json
mcp-radar registry update --from ./registry.json
```

Registry updates are local to the current project and write
`.mcp-radar/registry.json`.


## Output

Reports use plain-language status words rather than raw exit codes:

- `ok` — the step ran successfully (green).
- `failed (exit N)` — the step exited non-zero (red); the original code is preserved.
- `skipped (reason)` — the step was not applicable (dim).

Severity colors follow the AgentOpsSec palette (safe = green, warning = amber, risk = red). The palette honors `NO_COLOR` and `FORCE_COLOR`, and JSON / CSV output stays plain.


- Repo: https://github.com/AgentOpsSec/mcp-radar
- npm: https://www.npmjs.com/package/@agentopssec/mcp-radar
- AgentOpsSec stack: https://github.com/AgentOpsSec/stack
- Website: https://AgentOpsSec.com

## Author

Created and developed by **Aunt Gladys Nephew**.

- Website: https://auntgladysnephew.com
- GitHub: https://github.com/auntgladysnephew
- X: https://x.com/AGNonX
