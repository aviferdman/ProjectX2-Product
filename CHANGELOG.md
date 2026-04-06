# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Semantic versioning configuration and CHANGELOG management
- Version validation utilities for monorepo consistency

## [0.1.0] - 2026-04-06

### Added
- Core agent orchestration framework (`@crewspace/core`)
- Agent, Crew, and Task primitives
- Execution engine with sequential and parallel strategies
- LLM provider abstraction with OpenAI, Anthropic, and Ollama support
- Retry, fallback, and circuit breaker patterns for LLM providers
- Token usage tracking
- Short-term memory with in-memory and SQLite backends
- Scoped memory with namespace isolation
- Memory import/export utilities
- Tool system with registry, executor, and permission management
- Built-in file and web tools
- Deprecation utilities for safe API evolution
- Structured logging with configurable transports
- Comprehensive error hierarchy
- Performance benchmarks with budget enforcement
- CI pipeline with lint, typecheck, test, and build stages

[Unreleased]: https://github.com/aviferdman/ProjectX2-Product/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aviferdman/ProjectX2-Product/releases/tag/v0.1.0
