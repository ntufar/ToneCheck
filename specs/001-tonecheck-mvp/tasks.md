# Implementation Tasks: ToneCheck Browser Extension MVP

**Feature Branch**: `001-tonecheck-mvp`  
**Date**: 2025-01-21  
**Spec**: `/specs/001-tonecheck-mvp/spec.md`  
**Plan**: `/specs/001-tonecheck-mvp/plan.md`

## Summary

ToneCheck is a Firefox browser extension that analyzes emotional tone of text in web forms and provides real-time feedback on potentially aggressive language before users send messages. The extension uses user-provided API credentials to analyze text via external services (Perspective API for tone analysis + Claude API or Gemini API for suggestions), displays visual indicators near text fields, and allows users to replace problematic text with AI-generated alternatives.

**Total Tasks**: 104  
**MVP Scope**: User Story 1 (Real-Time Tone Analysis) - 41 tasks (Phases 1-3)  
**Full Scope**: All 3 user stories - 104 tasks (Phases 1-6)

## Implementation Strategy

**MVP First**: Start with User Story 1 (Real-Time Tone Analysis) to deliver core value. This provides the foundation for all other features.

**Incremental Delivery**:
1. **Phase 1-2**: Setup and foundational infrastructure
2. **Phase 3**: User Story 1 - Core tone analysis (MVP)
3. **Phase 4**: User Story 2 - Suggestions (enhances MVP)
4. **Phase 5**: User Story 3 - Configuration (enables personalization)
5. **Phase 6**: Polish and cross-cutting concerns

**Parallel Execution**: Tasks marked with `[P]` can be executed in parallel within the same phase, as they work on different files with no dependencies on incomplete tasks.

## Dependencies

### User Story Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: Real-Time Tone Analysis) ← MVP SCOPE
    ↓
Phase 4 (US2: Message Review and Suggestions)
    ↓
Phase 5 (US3: Extension Configuration and Privacy)
    ↓
Phase 6 (Polish & Cross-Cutting)
```

**Story Dependencies**:
- **US1** (P1): No story dependencies - can be implemented independently
- **US2** (P2): Depends on US1 (needs tone analysis to trigger suggestions)
- **US3** (P3): Can be implemented in parallel with US1/US2, but enhances both

## Phase 1: Setup

**Goal**: Initialize project structure, dependencies, and build configuration.

**Independent Test**: Project builds successfully, dependencies install, TypeScript compiles without errors.

### Setup Tasks

- [ ] T001 Create project structure per implementation plan in `/Users/ntufar/projects/ToneCheck/src/`
- [ ] T002 Initialize package.json with TypeScript, WebExtension dependencies in `/Users/ntufar/projects/ToneCheck/package.json`
- [ ] T003 Create TypeScript configuration (tsconfig.json) in `/Users/ntufar/projects/ToneCheck/tsconfig.json`
- [ ] T004 Create WebExtension manifest.json (Manifest V3) in `/Users/ntufar/projects/ToneCheck/src/manifest.json`
- [ ] T005 [P] Create build configuration (webpack/vite) in `/Users/ntufar/projects/ToneCheck/`
- [ ] T006 [P] Setup Jest testing framework with @webextension-polyfill/testing in `/Users/ntufar/projects/ToneCheck/`
- [ ] T007 [P] Create .gitignore and .npmignore files in `/Users/ntufar/projects/ToneCheck/`
- [ ] T008 [P] Create README.md with setup instructions in `/Users/ntufar/projects/ToneCheck/README.md`

## Phase 2: Foundational

**Goal**: Implement core infrastructure that all user stories depend on - shared types, constants, encryption utilities, storage layer, and message passing foundation.

**Independent Test**: Shared utilities can be imported and used, encryption/decryption works, storage operations succeed, message passing structure is in place.

### Foundational Tasks

- [ ] T009 [P] Create shared types (TextAnalysisRequest, ToneAnalysisResult, UserSettings, AlternativeSuggestion) in `/Users/ntufar/projects/ToneCheck/src/shared/types.ts`
- [ ] T010 [P] Create shared constants (sensitivity thresholds, API endpoints, debounce timing) in `/Users/ntufar/projects/ToneCheck/src/shared/constants.ts`
- [ ] T011 [P] Implement encryption utilities using Web Crypto API in `/Users/ntufar/projects/ToneCheck/src/shared/encryption.ts`
- [ ] T012 [P] Implement storage layer for UserSettings in `/Users/ntufar/projects/ToneCheck/src/background/storage.ts`
- [ ] T013 [P] Create message handler foundation (message types, routing structure) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T014 [P] Implement rate limiter (1 QPS queue management) in `/Users/ntufar/projects/ToneCheck/src/background/rate-limiter.ts`

## Phase 3: User Story 1 - Real-Time Tone Analysis (P1)

**Goal**: Detect text input in web forms, analyze tone via Perspective API after 500ms debounce, and display visual indicators (green/yellow/red) near text fields showing tone analysis results.

**Why Priority 1**: This is the core value proposition - without tone analysis, the extension provides no value. All other features depend on this working correctly.

**Independent Test**: Can be fully tested by typing text in any supported website's text field and verifying that tone analysis results appear after a brief pause. This delivers the primary user value independently of settings, suggestions, or other features.

**Test Criteria**:
- Text field detection works on Gmail, Reddit, Twitter/X, LinkedIn, Facebook
- Debouncing triggers analysis after 500ms pause
- Perspective API integration returns tone scores
- Visual indicators appear near text fields with correct colors (green/yellow/red)
- Loading indicator shows during analysis
- Non-blocking error handling when API fails

### US1: Content Script - Field Detection

- [ ] T015 [US1] Implement field detector to identify textarea, input[type="text"], and contenteditable elements in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T016 [US1] Add support for major platforms (Gmail, Reddit, Twitter/X, LinkedIn, Facebook) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T017 [US1] Implement generic text area detection (best effort) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T018 [US1] Add debouncing logic (500ms after user stops typing) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`

### US1: Background Worker - API Client

- [ ] T019 [US1] Implement Perspective API client with authentication in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T020 [US1] Add request formatting (comment text, requestedAttributes) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T021 [US1] Implement response parsing (extract toxicity, insult, threat, profanity scores) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T022 [US1] Calculate overallAggression percentage (max of toxicity, insult, threat) * 100 in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T023 [US1] Add error handling (400, 401, 429, 500 responses) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T024 [US1] Implement chunked analysis for text >3000 characters in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T025 [US1] Integrate rate limiter with API client (1 QPS throttling) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`

### US1: Background Worker - Message Handling

- [ ] T026 [US1] Implement /analyze message handler in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T027 [US1] Add validation for analysis requests (text, fieldId, url) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T028 [US1] Integrate API client with message handler in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T029 [US1] Return AnalysisResponse with all tone scores in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T030 [US1] Handle API errors gracefully (return ErrorResponse, don't block) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`

### US1: Content Script - UI Injection

- [ ] T031 [US1] Implement UI injector to create tone indicator elements in `/Users/ntufar/projects/ToneCheck/src/content/ui-injector.ts`
- [ ] T032 [US1] Position indicators near text fields (non-intrusive placement) in `/Users/ntufar/projects/ToneCheck/src/content/ui-injector.ts`
- [ ] T033 [US1] Implement tone indicator component with color coding (green/yellow/red) in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T034 [US1] Display loading indicator (spinner) during analysis in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T035 [US1] Show tone scores and category breakdown when flagged in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T036 [US1] Add smooth animations (fade in) for indicator appearance in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T037 [US1] Support multiple text fields on same page (independent indicators) in `/Users/ntufar/projects/ToneCheck/src/content/ui-injector.ts`
- [ ] T038 [US1] Handle non-blocking error display (warning message, allow normal typing) in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T039 [US1] Add rate limit notification when queue exceeds 3 requests in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`

### US1: Integration

- [ ] T040 [US1] Connect field detector → debounce → message to background → API call → response → UI update flow in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T041 [US1] Test end-to-end: type text → pause → analysis → indicator appears in `/Users/ntufar/projects/ToneCheck/`

## Phase 4: User Story 2 - Message Review and Suggestions (P2)

**Goal**: When tone analysis flags a message as problematic, show review interface with highlighted problematic phrases and 2-3 AI-generated alternative phrasings. User can replace text with suggestion or dismiss warning.

**Why Priority 2**: While tone detection alone provides value (P1), actionable suggestions significantly increase the likelihood users will edit their messages, which is a key success metric. This transforms the extension from passive feedback to active assistance.

**Independent Test**: Can be fully tested independently by manually triggering a warning on aggressive text and verifying that suggestions appear, can be reviewed, and can replace the original text. This delivers value without requiring other features.

**Test Criteria**:
- Review interface appears when message is flagged
- Problematic words/phrases are highlighted
- Suggestions are generated via Claude API or Gemini API
- 2-3 alternative phrasings are displayed
- User can click suggestion to replace original text
- User can dismiss warning with "Send Anyway"
- New analysis triggers after text replacement

### US2: Background Worker - Suggestion API Clients

- [ ] T042 [US2] Implement Claude API client for suggestion generation in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T043 [US2] Implement Gemini API client for suggestion generation in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T044 [US2] Create suggestion prompt builder (system prompt + user message with context) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T045 [US2] Parse suggestion responses (extract 2-3 alternatives from API response) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T046 [US2] Add provider selection logic (Claude vs Gemini based on user settings) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T047 [US2] Handle suggestion API errors gracefully (timeout, rate limits) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`

### US2: Background Worker - Suggestion Message Handling

- [ ] T048 [US2] Implement /suggestions message handler in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T049 [US2] Validate suggestion requests (text, flaggedAttributes, requestId) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T050 [US2] Route to appropriate suggestion provider (Claude or Gemini) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T051 [US2] Return SuggestionResponse with 2-3 alternatives in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`

### US2: Content Script - Review Interface

- [ ] T052 [US2] Create review interface component (modal/panel) in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T053 [US2] Implement problematic phrase highlighting in original text in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T054 [US2] Display suggestion list (2-3 alternatives) in review interface in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T055 [US2] Implement "Replace with suggestion" action (update text field) in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T056 [US2] Implement "Send Anyway" dismiss action in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T057 [US2] Trigger new analysis after text replacement in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`

### US2: Integration

- [ ] T058 [US2] Connect flagged message → review interface → suggestion request → display → replace flow in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T059 [US2] Test end-to-end: aggressive text → flag → review → suggestions → replace in `/Users/ntufar/projects/ToneCheck/`

## Phase 5: User Story 3 - Extension Configuration and Privacy (P3)

**Goal**: Provide extension settings UI (popup and options page) for configuring API keys, sensitivity threshold, disabled websites, and extension enable/disable. Ensure API keys are encrypted and privacy disclosures are clear.

**Why Priority 3**: Configuration enables personalization and addresses privacy concerns, but the extension can function with defaults. Users need to set up API access before analysis works, making this foundational but lower priority than core analysis functionality.

**Independent Test**: Can be fully tested by accessing the extension settings, configuring API key, adjusting sensitivity, and verifying settings persist. The extension must work with default settings if user hasn't configured it yet.

**Test Criteria**:
- Settings UI accessible from extension popup
- API key input and encryption works
- Sensitivity threshold selection (low/medium/high) works
- Disabled websites list management works
- Extension enable/disable toggle works
- Settings persist across browser sessions
- Privacy notice displays on first setup
- Default settings allow extension to function

### US3: Popup UI

- [ ] T060 [US3] Create popup HTML structure in `/Users/ntufar/projects/ToneCheck/src/popup/popup.html`
- [ ] T061 [US3] Implement popup TypeScript entry point in `/Users/ntufar/projects/ToneCheck/src/popup/popup.ts`
- [ ] T062 [US3] Create settings form component (API key inputs, threshold selector) in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts`
- [ ] T063 [US3] Add privacy notice display (first-time setup) in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts`
- [ ] T064 [US3] Implement settings load from storage in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts`
- [ ] T065 [US3] Implement settings save (encrypt API keys before storage) in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts`
- [ ] T066 [US3] Add validation (API key format, threshold selection) in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts`

### US3: Options Page

- [ ] T067 [US3] Create options HTML structure in `/Users/ntufar/projects/ToneCheck/src/options/options.html`
- [ ] T068 [US3] Implement options TypeScript entry point in `/Users/ntufar/projects/ToneCheck/src/options/options.ts`
- [ ] T069 [US3] Create API key manager component (add/update/remove keys) in `/Users/ntufar/projects/ToneCheck/src/options/api-key-manager.ts`
- [ ] T070 [US3] Implement disabled websites list management (add/remove domains) in `/Users/ntufar/projects/ToneCheck/src/options/options.ts`
- [ ] T071 [US3] Add extension enable/disable toggle in `/Users/ntufar/projects/ToneCheck/src/options/options.ts`
- [ ] T072 [US3] Implement suggestion provider selection (Claude vs Gemini) in `/Users/ntufar/projects/ToneCheck/src/options/options.ts`

### US3: Background Worker - Settings Management

- [ ] T073 [US3] Implement /settings/get message handler in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T074 [US3] Implement /settings/update message handler in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T075 [US3] Add settings validation (threshold, provider, website domains) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T076 [US3] Integrate encryption for API keys in settings update in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`

### US3: Content Script - Settings Integration

- [ ] T077 [US3] Check extension enabled state before analysis in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T078 [US3] Check disabled websites list before analysis in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T079 [US3] Apply sensitivity threshold to aggression flagging logic in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`

### US3: Integration

- [ ] T080 [US3] Test end-to-end: configure settings → verify persistence → verify settings affect analysis behavior in `/Users/ntufar/projects/ToneCheck/`

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Accessibility, error handling improvements, edge case handling, performance optimization, and final polish.

**Independent Test**: Extension meets WCAG 2.1 AA standards, handles all edge cases gracefully, performs within target metrics (<500ms analysis, <100ms UI feedback, <50MB memory, <5MB size).

### Accessibility

- [ ] T081 [P] Add keyboard navigation support for all interactive elements in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T082 [P] Add screen reader descriptions (ARIA labels) for tone indicators in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T083 [P] Ensure color contrast meets 4.5:1 minimum ratio in `/Users/ntufar/projects/ToneCheck/src/content/tone-indicator.ts`
- [ ] T084 [P] Add keyboard navigation for popup and options pages in `/Users/ntufar/projects/ToneCheck/src/popup/settings-form.ts` and `/Users/ntufar/projects/ToneCheck/src/options/options.ts`

### Error Handling & Edge Cases

- [ ] T085 [P] Handle dynamically loaded content (SPA text field injection) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T086 [P] Handle iframe text fields (cross-origin detection) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T087 [P] Skip password fields and sensitive input types in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T088 [P] Handle extension disabled during analysis (graceful cancellation) in `/Users/ntufar/projects/ToneCheck/src/background/message-handler.ts`
- [ ] T089 [P] Handle network failures and timeouts gracefully in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T090 [P] Handle special characters, emojis, and formatting in text analysis in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`

### Performance & Optimization

- [ ] T091 [P] Optimize content script injection (minimize DOM queries) in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T092 [P] Implement in-memory caching for API responses (<5 seconds) in `/Users/ntufar/projects/ToneCheck/src/background/api-client.ts`
- [ ] T093 [P] Clear ephemeral data on page navigation in `/Users/ntufar/projects/ToneCheck/src/content/field-detector.ts`
- [ ] T094 [P] Optimize bundle size (tree shaking, minification) in `/Users/ntufar/projects/ToneCheck/`

### Testing & Quality

- [ ] T095 [P] Write unit tests for field detector in `/Users/ntufar/projects/ToneCheck/tests/unit/content/field-detector.test.ts`
- [ ] T096 [P] Write unit tests for API client in `/Users/ntufar/projects/ToneCheck/tests/unit/background/api-client.test.ts`
- [ ] T097 [P] Write unit tests for rate limiter in `/Users/ntufar/projects/ToneCheck/tests/unit/background/rate-limiter.test.ts`
- [ ] T098 [P] Write unit tests for storage layer in `/Users/ntufar/projects/ToneCheck/tests/unit/background/storage.test.ts`
- [ ] T099 [P] Write unit tests for encryption utilities in `/Users/ntufar/projects/ToneCheck/tests/unit/shared/encryption.test.ts`
- [ ] T100 [P] Write contract tests for Perspective API integration in `/Users/ntufar/projects/ToneCheck/tests/contract/perspective-api.test.ts`
- [ ] T101 [P] Write contract tests for Claude API integration in `/Users/ntufar/projects/ToneCheck/tests/contract/claude-api.test.ts`
- [ ] T102 [P] Write contract tests for Gemini API integration in `/Users/ntufar/projects/ToneCheck/tests/contract/gemini-api.test.ts`
- [ ] T103 [P] Write integration tests for end-to-end analysis flow in `/Users/ntufar/projects/ToneCheck/tests/integration/analysis-flow.test.ts`
- [ ] T104 [P] Write integration tests for suggestion flow in `/Users/ntufar/projects/ToneCheck/tests/integration/suggestion-flow.test.ts`

## Parallel Execution Examples

### Phase 3 (US1) - Parallel Opportunities

**Group 1** (Can run in parallel - different files, no dependencies):
- T015, T016, T017, T018 (field-detector.ts - all field detection features)
- T019, T020, T021, T022, T023, T024, T025 (api-client.ts - all API client features)
- T031, T032, T033, T034, T035, T036, T037, T038, T039 (ui-injector.ts and tone-indicator.ts - all UI features)

**Group 2** (Sequential - depends on Group 1):
- T026, T027, T028, T029, T030 (message-handler.ts - depends on API client)
- T040, T041 (Integration - depends on all components)

### Phase 4 (US2) - Parallel Opportunities

**Group 1** (Can run in parallel):
- T042, T043, T044, T045, T046, T047 (api-client.ts - suggestion API clients)
- T052, T053, T054, T055, T056, T057 (tone-indicator.ts - review interface)

**Group 2** (Sequential - depends on Group 1):
- T048, T049, T050, T051 (message-handler.ts - depends on API clients)
- T058, T059 (Integration - depends on all components)

### Phase 5 (US3) - Parallel Opportunities

**Group 1** (Can run in parallel):
- T060, T061, T062, T063, T064, T065, T066 (popup/ - all popup features)
- T067, T068, T069, T070, T071, T072 (options/ - all options page features)

**Group 2** (Sequential - depends on Group 1):
- T073, T074, T075, T076 (message-handler.ts - depends on UI components)
- T077, T078, T079 (content script integration - depends on settings)
- T080 (Integration - depends on all components)

## Task Summary

| Phase | Tasks | Story | Description |
|-------|-------|-------|-------------|
| 1 | T001-T008 | - | Setup (project structure, dependencies, build config) |
| 2 | T009-T014 | - | Foundational (types, constants, encryption, storage, messaging) |
| 3 | T015-T041 | US1 | Real-Time Tone Analysis (MVP scope) |
| 4 | T042-T059 | US2 | Message Review and Suggestions |
| 5 | T060-T080 | US3 | Extension Configuration and Privacy |
| 6 | T081-T104 | - | Polish & Cross-Cutting Concerns |

**Total**: 104 tasks  
**MVP Tasks (Phases 1-3)**: 41 tasks  
**Full Scope Tasks**: 104 tasks

## Notes

- All file paths are absolute from project root
- Tasks marked with `[P]` can be executed in parallel within the same phase
- Tasks marked with `[US1]`, `[US2]`, `[US3]` belong to specific user stories
- Each task includes exact file path for implementation
- MVP scope focuses on User Story 1 (Real-Time Tone Analysis) - Phases 1-3
- Full implementation includes all 3 user stories - Phases 1-6

