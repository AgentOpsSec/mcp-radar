# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [1.0.0] - 2026-04-26

- Initial public release of MCP Radar.
- Commands: `search`, `score`, `compare`, `badge`, `submit`, `score-doctor`, `validate`, `registry update`, `update`.
- Transparent scoring across permissions, maintenance, install method, license, and documentation quality.
- Curated registry shipped with the package; projects can override with `.mcp-radar/registry.json`.
- Scores MCP Doctor reports without depending on Doctor code.
- Status words use plain language (`ok`, `failed (exit N)`, `skipped (reason)`); raw exit codes are preserved alongside for debugging.
