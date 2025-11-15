# Implementation Plan: ToneCheck Browser Extension MVP

**Branch**: `001-tonecheck-mvp` | **Date**: 2025-01-21 | **Spec**: `/specs/001-tonecheck-mvp/spec.md`
**Input**: Feature specification from `/specs/001-tonecheck-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ToneCheck is a Firefox browser extension that analyzes emotional tone of text in web forms and provides real-time feedback on potentially aggressive language before users send messages. The extension uses user-provided API credentials to analyze text via external services (Perspective API for tone analysis + Claude API or Gemini API for suggestions), displays visual indicators near text fields, and allows users to replace problematic text with AI-generated alternatives. Users can choose between Claude (paid, high quality) or Gemini (free tier available) for suggestion generation. Built as a WebExtension with content scripts for field detection, background worker for API management, and popup UI for settings.

## Technical Context

**Language/Version**: JavaScript/TypeScript (ES2020+), WebExtension Manifest V3  
**Primary Dependencies**: 
- WebExtension APIs (`browser.contentScripts`, `browser.storage`, `browser.runtime`)
- Perspective API for tone analysis
- Claude API or Gemini API for suggestion generation (user-selectable)
- webextension-polyfill for cross-browser compatibility  
**Storage**: `browser.storage.local` for user settings and encrypted API keys (no persistent text storage)  
**Testing**: Jest + @webextension-polyfill/testing or similar WebExtension testing framework - NEEDS CLARIFICATION: specific testing setup for content scripts and background workers  
**Target Platform**: Firefox (primary), architecture designed for cross-browser (Chrome, Edge, Safari)  
**Project Type**: browser extension  
**Performance Goals**: 
- Analysis response time: <500ms average (from API call to result display)
- UI feedback rendering: <100ms
- Memory usage: <50MB
- Extension size: <5MB  
**Constraints**: 
- Non-blocking operations (never prevent message sending)
- Debouncing: 500ms after user stops typing
- Rate limiting: 1 query per second (QPS) with queue management
- Chunked analysis for text >3000 characters
- No permanent text storage after analysis
- Content Security Policy compliance (no inline scripts, no eval)  
**Scale/Scope**: 
- Individual user installations
- Real-time analysis per text field
- Support for major platforms: Gmail, Reddit, Twitter/X, LinkedIn, Facebook
- Generic text area support (best effort)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Browser Extension Architecture ✓
- **Status**: PASS
- **Compliance**: Extension uses WebExtension APIs, Manifest V3 standards, clear separation of content scripts, background worker, and popup UI
- **Notes**: Architecture aligns with constitution requirements

### II. Privacy by Design (NON-NEGOTIABLE) ✓
- **Status**: PASS
- **Compliance**: User-provided API keys only, encrypted storage, clear disclosure of external data transmission, no permanent text storage, no telemetry without opt-in
- **Notes**: Spec explicitly requires user API credentials and privacy disclosures

### III. Performance First ✓
- **Status**: PASS
- **Compliance**: <500ms analysis response time, <100ms UI feedback, 500ms debouncing, non-blocking operations, <50MB memory, <5MB extension size
- **Notes**: All performance targets specified in requirements

### IV. Cross-Browser Compatibility ✓
- **Status**: PASS
- **Compliance**: Architecture designed for cross-browser, browser-specific APIs abstracted, feature detection approach
- **Notes**: Firefox primary target, but structure supports multiple browsers

### V. Test-First Development ✓
- **Status**: PASS
- **Compliance**: Automated tests required for critical functionality, content script injection testing, background worker unit tests, API contract tests, UI integration tests
- **Notes**: Testing framework selection needed (Phase 0 research)

### VI. Progressive Enhancement ✓
- **Status**: PASS
- **Compliance**: Graceful degradation when APIs unavailable, non-blocking warnings on failures, network timeout/rate limit handling, fallback behavior defined
- **Notes**: Spec requires graceful failure handling

**Overall Gate Status**: ✅ **PASS** - All constitution principles satisfied. Proceed to Phase 0 research.

### Post-Design Constitution Check (Phase 1 Complete)

*Re-evaluated after data model and API contracts design*

#### I. Browser Extension Architecture ✓
- **Status**: PASS
- **Compliance**: Data model confirms ephemeral in-memory storage for analysis data, persistent storage only for encrypted settings. Extension API contracts define clear message passing between components.
- **Notes**: Architecture remains compliant with WebExtension standards

#### II. Privacy by Design (NON-NEGOTIABLE) ✓
- **Status**: PASS
- **Compliance**: Data model explicitly defines no persistent text storage - all analysis requests/results are ephemeral. API keys encrypted before storage. Contracts confirm user-provided API keys only.
- **Notes**: Privacy requirements fully satisfied in design

#### III. Performance First ✓
- **Status**: PASS
- **Compliance**: API contracts define <500ms response time expectations. Rate limiting (1 QPS) and debouncing (500ms) confirmed in data model. Chunked analysis for long text defined.
- **Notes**: Performance constraints maintained in design

#### IV. Cross-Browser Compatibility ✓
- **Status**: PASS
- **Compliance**: Extension API uses standard `browser.runtime` message passing, compatible across browsers. webextension-polyfill confirmed in research.
- **Notes**: Cross-browser compatibility maintained

#### V. Test-First Development ✓
- **Status**: PASS
- **Compliance**: Research confirms Jest + @webextension-polyfill/testing setup. Contract tests defined for API integrations. Test structure documented in quickstart.
- **Notes**: Testing framework selected and documented

#### VI. Progressive Enhancement ✓
- **Status**: PASS
- **Compliance**: Extension API contracts define error responses for API failures. Data model confirms graceful degradation (non-blocking warnings). Rate limit handling defined.
- **Notes**: Fallback behavior fully specified

**Post-Design Gate Status**: ✅ **PASS** - All constitution principles remain satisfied after Phase 1 design. Proceed to Phase 2 task breakdown.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── content/              # Content scripts for text field detection and UI injection
│   ├── field-detector.ts
│   ├── ui-injector.ts
│   └── tone-indicator.ts
├── background/           # Background worker for API calls and storage
│   ├── api-client.ts
│   ├── rate-limiter.ts
│   ├── storage.ts
│   └── message-handler.ts
├── popup/                # Extension popup UI for settings
│   ├── popup.html
│   ├── popup.ts
│   └── settings-form.ts
├── options/              # Options page for extended configuration
│   ├── options.html
│   ├── options.ts
│   └── api-key-manager.ts
├── shared/               # Shared utilities and types
│   ├── types.ts
│   ├── constants.ts
│   └── encryption.ts
└── manifest.json         # WebExtension manifest

tests/
├── contract/             # API contract tests with mock responses
├── integration/         # End-to-end extension tests
└── unit/                 # Unit tests for background, content scripts, utilities
```

**Structure Decision**: Browser extension structure with clear separation of content scripts (field detection/UI), background worker (API/storage), popup (settings UI), and options page (extended config). Shared utilities for types, constants, and encryption. Test structure mirrors source organization.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
