# AgentOps v4.0

[![npm version](https://img.shields.io/npm/v/agentops.svg)](https://www.npmjs.com/package/agentops)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/calabamatex/AgenticManagement/actions/workflows/ci.yml/badge.svg)](https://github.com/calabamatex/AgenticManagement/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-1003%20passing-brightgreen.svg)](#)

Persistent memory, safety guardrails, and operational oversight for AI coding agents. Every decision, violation, and handoff is captured to a vector-indexed store that survives across sessions -- so each session builds on the last.

## Install

```bash
npm install agentops
```

## Wire as MCP Server

```bash
claude mcp add agentops -- node agentops/dist/src/mcp/server.js
```

## Documentation

- For full documentation, see [agentops/README.md](agentops/README.md)
- For architecture docs, see [docs/](docs/)
- For planning history, see [docs/planning/](docs/planning/)

## Links

- [Product Specification](docs/planning/AgentOps-Product-Spec.md)
- [Architecture Evolution](docs/planning/AgentOps-Architecture-Evolution.md)
- [Implementation Guide](docs/planning/Agent-Management-Implementation-Guide.md)
- [Synopsis](docs/planning/AgentOps-Synopsis.md)

## License

MIT -- see [LICENSE](LICENSE) for details.
