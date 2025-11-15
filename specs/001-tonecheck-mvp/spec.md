# Feature Specification: ToneCheck Browser Extension MVP

**Feature Branch**: `001-tonecheck-mvp`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "ToneCheck browser extension MVP - Firefox extension that analyzes emotional tone of text in web forms and provides real-time feedback on potentially aggressive language before users send messages"

## Clarifications

### Session 2025-01-21

- Q: How should suggestion alternatives be generated? → A: Fully automated AI/LLM service (e.g., Claude API) to generate contextual rewrites
- Q: How should the extension handle multiple text fields on the same page? → A: Analyze each text field independently and display separate indicators near each active field
- Q: How should the extension handle text that exceeds API length limits? → A: Analyze text in chunks and combine results (multiple API calls)
- Q: What should users see while tone analysis is in progress? → A: Show a subtle loading indicator (spinner/progress) near the text field during analysis
- Q: How should the extension handle API rate limiting when users type rapidly? → A: Queue requests and throttle to 1 QPS - show brief "Rate limit reached" notification if queued requests exceed 3

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Tone Analysis (Priority: P1)

A user types a message in a web form (email, comment, post) and wants to know if the tone might be perceived as aggressive or inappropriate before sending. The extension automatically detects text input, analyzes the emotional tone after the user stops typing, and displays feedback near the text field indicating whether the message tone is neutral, cautionary, or problematic.

**Why this priority**: This is the core value proposition - without tone analysis, the extension provides no value. All other features depend on this working correctly.

**Independent Test**: Can be fully tested by typing text in any supported website's text field and verifying that tone analysis results appear after a brief pause. This delivers the primary user value independently of settings, suggestions, or other features.

**Acceptance Scenarios**:

1. **Given** a user is typing in a Gmail compose window, **When** they pause typing for 500ms, **Then** the extension shows a loading indicator and analyzes the text, then displays a tone indicator near the text field
2. **Given** a user types neutral, professional language, **When** analysis completes, **Then** a green indicator shows "Looking good!" with a neutral tone score
3. **Given** a user types aggressive or insulting language, **When** analysis completes, **Then** a red warning appears showing the aggression score and category breakdown (toxicity, insult, threat)
4. **Given** a user types moderately concerning language, **When** analysis completes, **Then** a yellow caution indicator appears with the tone score
5. **Given** the analysis API is unavailable or fails, **When** analysis is attempted, **Then** a non-blocking warning is shown and the user can continue typing/sending normally

---

### User Story 2 - Message Review and Suggestions (Priority: P2)

When tone analysis flags a message as potentially problematic, a user wants to review the flagged content and see alternative phrasings that maintain their intent but use a more appropriate tone. The user can either replace their text with a suggestion or dismiss the warning.

**Why this priority**: While tone detection alone provides value (P1), actionable suggestions significantly increase the likelihood users will edit their messages, which is a key success metric. This transforms the extension from passive feedback to active assistance.

**Independent Test**: Can be fully tested independently by manually triggering a warning on aggressive text and verifying that suggestions appear, can be reviewed, and can replace the original text. This delivers value without requiring other features.

**Acceptance Scenarios**:

1. **Given** a message is flagged as aggressive (red warning shown), **When** the user clicks "Review Message", **Then** specific problematic words/phrases are highlighted in the text
2. **Given** problematic text is identified, **When** suggestions are generated via AI/LLM service, **Then** 2-3 alternative phrasings are displayed that maintain the original message intent
3. **Given** alternative suggestions are shown, **When** the user clicks a suggestion, **Then** the original text is replaced with the suggested alternative
4. **Given** suggestions are provided, **When** the user clicks "Send Anyway", **Then** the warning is dismissed and no further alerts appear for this message
5. **Given** the user dismisses a warning, **When** they continue editing the text, **Then** new analysis is performed on the updated text

---

### User Story 3 - Extension Configuration and Privacy (Priority: P3)

A user wants to configure how the extension works, including setting sensitivity levels, managing which websites it operates on, and ensuring their privacy by controlling how their data is used. Users must explicitly provide their own API credentials to enable analysis.

**Why this priority**: Configuration enables personalization and addresses privacy concerns, but the extension can function with defaults. Users need to set up API access before analysis works, making this foundational but lower priority than core analysis functionality.

**Independent Test**: Can be fully tested by accessing the extension settings, configuring API key, adjusting sensitivity, and verifying settings persist. The extension must work with default settings if user hasn't configured it yet.

**Acceptance Scenarios**:

1. **Given** a user installs the extension for the first time, **When** they open the settings, **Then** they are prompted to provide their API key and shown a privacy notice explaining data flow
2. **Given** a user has provided a valid API key, **When** they adjust the sensitivity threshold (low/medium/high), **Then** the analysis uses different thresholds for flagging messages
3. **Given** a user wants to disable the extension on a specific website, **When** they add that website to a disable list, **Then** the extension does not analyze text on that website
4. **Given** a user wants to temporarily pause the extension, **When** they disable it entirely in settings, **Then** no analysis occurs until re-enabled
5. **Given** a user's API key is stored, **When** they view settings, **Then** the API key is encrypted and not displayed in plain text
6. **Given** analysis occurs, **When** results are returned, **Then** the analyzed text is not stored permanently on the device

---

### Edge Cases

- What happens when a user types in multiple text fields simultaneously (e.g., a form with multiple inputs)? → **RESOLVED**: Each field is analyzed independently with separate indicators
- How does the extension handle very long text (approaching or exceeding API limits)? → **RESOLVED**: Text is analyzed in chunks and results are combined (multiple API calls)
- What happens when a user rapidly types and deletes text (debouncing behavior)? → **PARTIALLY RESOLVED**: Debouncing (500ms) handles rapid typing, rate limiting queues requests when multiple analyses are triggered
- How does the extension behave on dynamically loaded content (single-page apps that inject text fields after page load)?
- What happens when a text field is inside an iframe from a different domain?
- How does the extension handle password fields or other sensitive input types?
- What happens when the extension is disabled while analysis is in progress?
- How does the system handle text in non-English languages in v1?
- What happens when a user has no internet connection but tries to use the extension?
- What happens when the AI/LLM suggestion service fails or times out (different from tone analysis API failure)?
- How does the extension handle text that contains special characters, emojis, or formatting?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST detect text input in standard web form elements including `<textarea>`, `<input type="text">`, and contenteditable `<div>` elements
- **FR-026**: When multiple text fields exist on the same page, the extension MUST analyze each text field independently and display separate tone indicators near each active field
- **FR-002**: The extension MUST automatically analyze text tone after a user stops typing for 500ms (debounce period)
- **FR-003**: The extension MUST analyze text for multiple tone categories: toxicity, insult, threat, and profanity
- **FR-004**: The extension MUST display a visual indicator near the text field showing tone analysis results within 500ms of user stopping typing
- **FR-028**: The extension MUST display a subtle loading indicator (spinner or progress indicator) near the text field while tone analysis is in progress
- **FR-005**: The extension MUST use a three-tier color coding system: green (0-30% aggression = neutral/positive), yellow (31-60% = caution), red (61-100% = warning)
- **FR-006**: The extension MUST display numerical scores for each tone category when a message is flagged
- **FR-007**: The extension MUST allow users to dismiss warnings without blocking their ability to send messages
- **FR-008**: The extension MUST handle API failures gracefully by showing a non-blocking warning and allowing normal text input/sending to continue
- **FR-027**: When text exceeds API length limits (3000 characters), the extension MUST analyze text in chunks, combine results from multiple API calls, and present a unified tone analysis result
- **FR-029**: The extension MUST queue analysis requests and throttle to 1 query per second (QPS) to respect API rate limits, and show a brief non-blocking "Rate limit reached" notification if queued requests exceed 3
- **FR-009**: The extension MUST provide 2-3 alternative phrasings for text flagged as problematic using an AI/LLM service (e.g., Claude API) to generate contextual rewrites
- **FR-010**: The extension MUST allow users to replace their original text with a suggested alternative in one action
- **FR-011**: Suggested alternatives MUST maintain the original message intent while improving tone, generated by AI service that understands context and nuance
- **FR-012**: The extension MUST allow users to configure sensitivity threshold settings (low/medium/high)
- **FR-013**: The extension MUST allow users to disable analysis on specific websites
- **FR-014**: The extension MUST allow users to completely disable/pause the extension
- **FR-015**: The extension MUST require users to provide their own API credentials for both tone analysis and suggestion generation services before performing analysis
- **FR-016**: The extension MUST clearly disclose to users when their text is sent to external services
- **FR-017**: The extension MUST NOT store analyzed text permanently on the device
- **FR-018**: The extension MUST encrypt user API keys when stored in browser storage
- **FR-019**: The extension MUST support analysis on major platforms: Gmail, Reddit, Twitter/X, LinkedIn, and Facebook comment boxes
- **FR-020**: The extension MUST work on generic text areas across websites (best effort approach)
- **FR-021**: Visual indicators MUST animate smoothly when appearing (fade in, not jarring transitions)
- **FR-022**: The extension MUST meet WCAG 2.1 AA accessibility standards
- **FR-023**: The extension MUST support keyboard navigation for all interactive elements
- **FR-024**: The extension MUST provide screen reader descriptions for tone indicators and warnings
- **FR-025**: All visual elements MUST have sufficient color contrast (4.5:1 minimum ratio)

### Key Entities *(include if feature involves data)*

- **Text Analysis Request**: Represents a request to analyze text tone, containing the text content, timestamp, and target text field identifier. Does not persist after analysis completes.

- **Tone Analysis Result**: Represents the output of tone analysis, containing scores for toxicity, insult, threat, and profanity categories, overall aggression percentage, and timestamp of analysis.

- **User Settings**: Represents user preferences including API key (encrypted), sensitivity threshold (low/medium/high), disabled website list, extension enabled/disabled state, and any custom keyword triggers.

- **Alternative Suggestion**: Represents a suggested text replacement generated by AI/LLM service, containing the alternative phrasing, confidence or quality indicator, and reference to the original flagged text segment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive tone analysis feedback within 500ms of stopping typing in 90% of interactions
- **SC-002**: At least 40% of users edit their messages after receiving a warning about aggressive tone
- **SC-003**: The extension successfully detects and analyzes text in 95% of supported websites' text input fields
- **SC-004**: Users can complete the initial setup (API key configuration) in under 2 minutes
- **SC-005**: False positive rate (neutral messages flagged as problematic) is below 15% as measured against human tone assessment
- **SC-006**: The extension does not interfere with normal text input - users can type and send messages without delay in 99% of cases
- **SC-007**: At least 60% of weekly active users continue using the extension after 1 month of installation
- **SC-008**: Users report a measurable decrease in communication regrets after using the extension for 2 weeks
- **SC-009**: The extension maintains functionality (no crashes or errors) on 5 major platforms (Gmail, Reddit, Twitter/X, LinkedIn, Facebook) with 90%+ uptime
- **SC-010**: Analysis accuracy achieves 85%+ agreement with human assessment of message tone when tested on standardized message sets
