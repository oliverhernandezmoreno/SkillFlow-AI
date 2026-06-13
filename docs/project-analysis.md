# Project Analysis

## Executive Summary

This repository is a portable SpecBoot template for adding augmented spec-driven development practices to other projects. Its main purpose is to distribute development standards, AI agent instructions, reusable skills, OpenSpec workflow helpers, and a small npm CLI that installs those assets into a target repository.

The project is not a conventional application with backend and frontend runtime services. Instead, it is a tooling and documentation package centered on multi-agent portability, OpenSpec workflows, and reusable AI-assisted engineering standards.

## Main Components

### Documentation Standards

The `docs/` directory is the primary source of project guidance. It contains:

- `base-standards.md`: canonical rules shared by agent-specific entry files.
- `backend-standards.md`: backend development expectations and patterns.
- `frontend-standards.md`: frontend development expectations and patterns.
- `documentation-standards.md`: documentation maintenance rules.
- `openspec-tasks-mandatory-steps.md`: mandatory task rules for OpenSpec artifacts.
- `api-spec.yml`, `data-model.md`, and `development_guide.md`: reference technical context intended to be customized for downstream projects.

The root agent files `AGENTS.md`, `CLAUDE.md`, `codex.md`, and `GEMINI.md` are symlinks to `docs/base-standards.md`, which keeps general agent behavior centralized.

### AI Specifications

The `ai-specs/` directory contains the reusable AI operating model:

- `agents/`: role definitions for backend, frontend, and product strategy work.
- `skills/`: reusable workflows such as documentation updates, code auditing, commits, OpenSpec sync, and worktree usage.
- `scripts/code_review.sh`: a helper script for review workflows.
- `specboot-instructions.md`: a symlink back to the main `README.md`.

This directory acts as the canonical location for reusable agent artifacts. Agent-specific folders are expected to expose these assets through symlinks when needed.

### Npm Package

The `packages/specboot/` package publishes the CLI `lidr-specboot`.

Key package traits:

- Package name: `@lidr/lidr-specboot`
- Runtime: Node.js `>=18`
- Entry point: `packages/specboot/bin/init.js`
- Published files: `bin/` and `template/`

The CLI copies `packages/specboot/template/` into a target directory without overwriting existing files. It then creates symlinks for:

- Root agent files: `CLAUDE.md`, `AGENTS.md`, `codex.md`, and `GEMINI.md`
- `.claude/agents/*` and `.claude/skills/*`
- `.cursor/agents/*` and `.cursor/skills/*`

This makes the package a project bootstrapper rather than an application runtime.

### OpenSpec Integration

The repository includes an `openspec/config.yaml` file using the `spec-driven` schema. It also includes OpenSpec-related skills and workflow files under `.agent/`, `.codex/`, `.github/`, and `ai-specs/`.

The intended workflow, described in the README, is:

1. Refine or enrich the user story.
2. Create or propose an OpenSpec change.
3. Generate artifacts.
4. Apply tasks.
5. Verify implementation.
6. Run adversarial review.
7. Archive the change.
8. Commit the result.

The repository therefore supports both documentation-driven planning and task-by-task implementation through OpenSpec.

## Repository Shape

The current codebase is small and documentation-heavy:

- One npm package under `packages/specboot/`.
- A reusable template under `packages/specboot/template/`.
- Shared standards and reference documentation under `docs/`.
- Agent and skill definitions under `ai-specs/`.
- Experimental or tool-specific workflow integrations under `.agent/`, `.codex/`, and `.github/`.

There are no application source directories such as `backend/`, `frontend/`, or `src/` in the root project. Some documentation still references a sample LTI ATS application, which appears to be reference content rather than this repository's actual runtime.

## Technical Observations

- The CLI implementation is intentionally simple and relies only on Node.js built-in modules: `fs` and `path`.
- File copying is non-destructive: existing target files are skipped.
- Symlink creation is explicit and currently hard-coded for known agent tools.
- The template duplicates many root-level assets so the package can install a full baseline into another repository.
- The project has strong rules around English-only technical artifacts, TDD, incremental changes, and symlink integrity.
- The current `openspec/config.yaml` is mostly scaffolded and does not yet include the richer context described in the README example.

## Risks and Gaps

- Some reference documentation, especially `docs/development_guide.md`, appears tailored to a different sample application. This can confuse downstream users unless clearly marked or customized.
- There is no test script or automated verification configured in `packages/specboot/package.json`.
- The CLI has no visible automated tests for copy behavior, skip behavior, or symlink creation.
- Symlink portability depends on filesystem support and target tooling expectations.
- The package metadata has a minor typo in the description: `version ofOpenSpec's`.
- The root repository and package template must stay synchronized manually unless a verification workflow is added.

## Suggested Maintenance Focus

- Add tests for `packages/specboot/bin/init.js`, especially idempotent installs and symlink creation.
- Add a package-level test command once tests exist.
- Clarify which documentation files are generic examples and which are authoritative for SpecBoot itself.
- Add a sync or validation script to compare root `docs/` and `ai-specs/` assets against `packages/specboot/template/`.
- Expand `openspec/config.yaml` with the project-specific context already described in the README.
- Keep symlink integrity checks as a release gate for future changes.
