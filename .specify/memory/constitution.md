<!--
Sync Impact Report:
Version change: N/A → 1.0.0
Modified principles: N/A (initial creation)
Added sections: Core Principles, Browser Extension Architecture, Privacy & Security, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ Updated: N/A (new constitution)
  ⚠ Pending manual review: plan-template.md (Constitution Check section), spec-template.md, tasks-template.md
Follow-up TODOs: None
-->
# ToneCheck Constitution

## Core Principles

### I. Browser Extension Architecture
ToneCheck MUST be built as a browser extension using WebExtension APIs. The Firefox implementation is the primary target for v1.0, with architecture designed for cross-browser compatibility. All extension code MUST follow WebExtension Manifest V3 standards where applicable. Extension components (content scripts, background workers, popup UI) MUST be clearly separated and independently testable. Extension functionality MUST work without requiring page modifications that could break website functionality.

### II. Privacy by Design (NON-NEGOTIABLE)
User privacy is paramount. Text analysis MUST use user-provided API keys only - the extension MUST NOT send data to any third-party service without explicit user configuration. All user data MUST remain on-device when possible. API keys MUST be encrypted in browser storage. The extension MUST clearly disclose when data is sent externally and to which service. Local-first alternatives MUST be prioritized for future features. No telemetry or user behavior tracking without explicit opt-in.

### III. Performance First
Analysis MUST complete in <500ms average response time. UI feedback MUST render in <100ms. The extension MUST use debouncing (500ms default) to minimize API calls. All operations MUST be non-blocking - the extension MUST never prevent users from sending messages. Background processing MUST not impact page performance. Memory usage MUST stay under 50MB. Extension size MUST remain under 5MB for fast installation.

### IV. Cross-Browser Compatibility
Code structure MUST support multiple browsers (Firefox, Chrome, Edge, Safari) even if initial release targets Firefox only. Browser-specific APIs MUST be abstracted behind a compatibility layer. Feature detection MUST be used instead of browser detection where possible. Testing MUST cover multiple browser environments. Documentation MUST specify browser requirements and known limitations.

### V. Test-First Development
All critical extension functionality MUST have automated tests. Content script injection MUST be tested with realistic page contexts. Background worker logic MUST have unit tests. API integration MUST have contract tests with mock responses. UI components MUST have integration tests. Test failures MUST block merges. Tests MUST run in CI/CD for all supported browsers.

### VI. Progressive Enhancement
The extension MUST gracefully degrade when external APIs are unavailable. Analysis failures MUST show warnings, not errors, and MUST not block user workflow. The extension MUST handle network timeouts, rate limits, and API errors without crashing. Fallback behavior MUST be defined for all external dependencies. Users MUST be able to continue using websites normally even if extension features fail.

## Browser Extension Architecture

### Extension Structure
The extension MUST use a clear separation of concerns:
- Content Scripts: Detect text fields, inject UI overlays, handle user interactions
- Background Worker: Manage API calls, storage, cross-tab communication
- Popup UI: Settings, dashboard, user preferences
- Options Page: Extended configuration and API key management

### WebExtension APIs
The extension MUST use standard WebExtension APIs:
- `browser.contentScripts` for dynamic script injection
- `browser.storage` for settings and encrypted API keys
- `browser.tabs` for tab communication when needed
- `browser.runtime` for message passing between components

### Content Security Policy
All extension code MUST comply with Content Security Policy (CSP). No inline scripts or `eval()`. External resources MUST be explicitly allowed in manifest.json. All user content MUST be sanitized before processing.

## Privacy & Security

### Data Handling
Text submitted for analysis MUST be sent only to user-configured services (initially Perspective API). Text MUST NOT be stored permanently after analysis completes. API responses MUST NOT be logged with full content. User API keys MUST be encrypted using browser storage encryption features. Extension updates MUST not expose user data.

### Security Requirements
Input sanitization MUST occur before any API calls. API keys MUST never appear in console logs or error messages. Content scripts MUST run in isolated contexts to prevent XSS attacks. Extension permissions MUST follow the principle of least privilege - request only permissions actually needed.

### User Consent
Users MUST explicitly configure their API key before analysis begins. A privacy notice MUST be shown on first installation explaining data flow. Users MUST be able to disable the extension entirely without data loss. Settings changes MUST require user confirmation for destructive actions.

## Development Workflow

### Code Review
All pull requests MUST be reviewed before merge. Reviews MUST verify:
- Constitution compliance
- Performance targets met
- Privacy requirements satisfied
- Tests added for new functionality
- Browser compatibility maintained

### Testing Requirements
Before any feature merges:
- Unit tests MUST pass
- Integration tests MUST pass
- Manual testing MUST be done in Firefox
- Cross-browser testing required for major features
- Performance benchmarks MUST not regress

### Documentation
All public APIs MUST have JSDoc comments. User-facing features MUST have documentation in the extension popup or options page. Technical decisions MUST be documented in architecture notes. Privacy policy MUST be kept up to date with actual data handling practices.

## Governance

This constitution supersedes all other development practices and guides. Amendments to principles require:
1. Documentation of the rationale
2. Review and approval process
3. Update of affected templates and documentation
4. Version increment according to semantic versioning:
   - MAJOR: Backward-incompatible principle changes or removals
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording improvements, typo fixes

All PRs and reviews MUST verify constitution compliance. Violations of non-negotiable principles MUST be flagged and addressed before merge. Complexity additions MUST be justified in code review. Use the implementation plan templates for feature development guidance that aligns with these principles.

**Version**: 1.0.0 | **Ratified**: 2025-01-21 | **Last Amended**: 2025-01-21
