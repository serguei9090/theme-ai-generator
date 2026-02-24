# Copilot Agent Instructions for Theme AI Generator

This file defines the agent skills, context, and behaviors for the "Creative Theme & Project Generator" monorepo. It instructs Copilot Agent Mode how to scaffold, maintain, and operate the project components.

## Purpose
Act as the workspace brain for Copilot: provide skills, routing rules, and conventions so Copilot can safely and consistently contribute to this monorepo.

---

## Required Skills

- Skill: MCP Server Architecture
  - Description: Understand how to implement a local Model Context Protocol (MCP) server inside `packages/mcp-server`.
  - Responsibilities: expose tools such as `generate_theme_palette(mood: string)` and `tweak_color(index: number, hex: string)` via the MCP SDK; validate inputs and enforce strict JSON output (5-color array with keys: `primary`, `secondary`, `accent`, `background`, `text`).

- Skill: Multi-LLM Routing
  - Description: Implement an `llmService.ts` router that selects an LLM provider based on user choice.
  - Providers: `@google/genai` (Gemini), `ollama` (local), `openai` (Copilot/OpenAI). Fall back to a deterministic provider when unavailable.
  - Output Contract: All LLM responses used for palettes must be parsed and normalized into strict JSON with five hex color codes and associated tags.

- Skill: Dynamic CSS Theming
  - Description: Know React Context, Tailwind CSS, and runtime CSS variable injection.
  - Responsibilities: expose a simple API to set root CSS variables `--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-text` to update the preview in real-time without page reloads.

- Skill: Copilot CLI Integration
  - Description: Use the Copilot CLI SDK in `packages/cli` to read and modify local files (e.g., `tailwind.config.ts`) and apply generated palettes to a developer's workspace.

---

## Conventions & Contracts

- Palette JSON contract (strict):

  {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB",
    "background": "#RRGGBB",
    "text": "#RRGGBB"
  }

- All hex codes must be lowercase and in 7-character format (leading `#`).
- When generating palettes, include a brief `explain` string describing the mood-to-color mapping (for UI). The `generate_theme_palette` tool must still only return the palette JSON when used by other tools; the `explain` field is optional in human-facing responses.

---

## Project Layout Expectations

- apps/web — Next.js (App Router) + Tailwind CSS UI, consumes MCP server.
- packages/mcp-server — local MCP server exposing `generate_theme_palette` and `tweak_color` tools; contains `llmService.ts` router.
- packages/cli — Copilot CLI integrations to fetch palettes and patch `tailwind.config.ts`.

---

## Safety & Developer Interaction

- Ask before installing heavy dependencies or performing network requests that require API keys.
- Keep generated code minimal and idiomatic; prefer small, testable modules.
- Provide clear next steps after each major scaffold step.

---

## Useful Links

- Copilot SDK Node README: https://github.com/github/awesome-copilot/blob/main/cookbook/copilot-sdk/nodejs/README.md
- Copilot SDK repo: https://github.com/github/copilot-sdk

---

If additional context is needed, request it before making large changes (e.g., selecting concrete LLM provider credentials or creating long-running servers).
