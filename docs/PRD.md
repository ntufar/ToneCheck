# ToneCheck - Product Requirements Document

**Version:** 1.0  
**Date:** November 15, 2025  
**Status:** Draft  
**Author:** Product Team

---

## Executive Summary

ToneCheck is a Firefox browser extension that analyzes the emotional tone of text users write in web forms before they send it. It provides real-time feedback on potentially aggressive, harsh, or emotionally charged language, helping users communicate more thoughtfully online.

---

## Problem Statement

### User Pain Points
- Users often regret messages sent in emotional moments
- Aggressive tone in emails/comments damages professional relationships
- Difficult to self-assess emotional tone while writing
- No warning system before posting potentially inflammatory content
- Cancel culture and permanent digital records increase stakes of miscommunication

### Market Gap
- Spell-checkers and grammar tools exist (Grammarly, LanguageTool)
- No mainstream tool focuses specifically on emotional tone
- Existing sentiment analysis is academic/enterprise, not consumer-facing
- Users want to be better communicators but lack real-time guidance

---

## Goals & Success Metrics

### Primary Goals
1. Prevent users from sending regrettable messages
2. Increase user awareness of their communication tone
3. Improve online discourse quality

### Success Metrics
- **Engagement:** 40%+ of analyzed texts result in user edits
- **Retention:** 60%+ weekly active users after 1 month
- **Impact:** User-reported decrease in communication regrets
- **Performance:** Analysis completes in <500ms
- **Accuracy:** 85%+ agreement with human tone assessment

---

## Target Audience

### Primary Users
- **Professional communicators** (age 25-45)
  - Writing emails, Slack messages, LinkedIn comments
  - Risk: Career damage from poor tone
  
- **Online community participants** (age 18-35)
  - Reddit, Twitter, forum users
  - Risk: Getting banned, starting flame wars

### Secondary Users
- **Customer service representatives**
- **Students** writing to professors/peers
- **Anyone prone to emotional reactions online**

### Non-Target (v1)
- Casual texters (SMS/iMessage not accessible to extensions)
- Non-English speakers (v1 English-only)
- Enterprise users (no enterprise features yet)

---

## User Stories

### Core User Stories

**As a professional,**  
I want to check my email tone before sending,  
So that I maintain positive relationships with colleagues.

**As a Reddit user,**  
I want to know if my comment sounds aggressive,  
So that I can engage in productive discussions.

**As someone with anger issues,**  
I want a warning before posting angry replies,  
So that I don't say things I'll regret.

**As a non-native English speaker,**  
I want to understand how my message might be perceived,  
So that I avoid unintended offense.

### Edge Cases

**As a user writing satire,**  
I want to dismiss false positives,  
So that intentional tone isn't flagged as problematic.

**As a privacy-conscious user,**  
I want my text to stay on my device,  
So that sensitive information isn't sent to servers.

---

## Features & Requirements

### Phase 1: MVP (v1.0) - Core Functionality

#### 1.1 Text Detection & Analysis

**Requirements:**
- ✅ MUST detect text input in: `<textarea>`, `<input type="text">`, contenteditable divs
- ✅ MUST analyze text when user stops typing (500ms debounce)
- ✅ MUST use Perspective API for tone analysis
- ✅ MUST analyze for: toxicity, insult, threat, profanity
- ✅ SHOULD complete analysis in <500ms
- ✅ MUST handle API failures gracefully (show warning, don't block sending)

**Supported Platforms (v1):**
- Gmail
- Reddit comment boxes
- Twitter/X compose
- LinkedIn messages
- Facebook comments
- Generic text areas (best effort)

#### 1.2 Visual Feedback

**Requirements:**
- ✅ MUST show non-intrusive indicator near text field
- ✅ MUST use color coding:
  - 🟢 Green (0-30%): Neutral/positive tone
  - 🟡 Yellow (31-60%): Caution - slightly aggressive
  - 🔴 Red (61-100%): Warning - highly aggressive
- ✅ MUST show numerical score (e.g., "Aggression: 73%")
- ✅ MUST display category breakdown (toxicity, insult, threat)
- ✅ SHOULD animate when appearing (fade in, not jarring)
- ✅ MUST be dismissible (close button)

**UI Mockup Requirements:**
```
┌─────────────────────────────────┐
│ 🔴 ToneCheck Alert              │
│                                  │
│ This message reads as:           │
│ • 73% Aggressive                 │
│ • 45% Insulting                  │
│ • 12% Threatening                │
│                                  │
│ [Review Message] [Send Anyway] [X]│
└─────────────────────────────────┘
```

#### 1.3 Suggestion Engine

**Requirements:**
- ✅ MUST provide 2-3 alternative phrasings for flagged text
- ✅ SHOULD identify specific problematic words/phrases
- ✅ MUST allow one-click replacement of text
- ✅ SHOULD maintain original message intent
- ⚠️ NICE TO HAVE: Explain why alternatives are better

**Example:**
```
Original: "You're completely wrong about this."
Suggestion 1: "I see it differently. Here's my perspective..."
Suggestion 2: "I respectfully disagree because..."
```

#### 1.4 User Settings

**Requirements:**
- ✅ MUST allow users to set sensitivity threshold (low/medium/high)
- ✅ MUST allow users to disable on specific sites
- ✅ MUST allow users to disable entirely (pause)
- ✅ SHOULD remember user's API key securely
- ✅ SHOULD allow custom keyword additions (personal triggers)

#### 1.5 Privacy & Security

**Requirements:**
- ✅ MUST require user to provide their own API keys (Perspective API for tone analysis, Claude API or Gemini API for suggestions)
- ✅ MUST clearly state data is sent to external APIs (Perspective API, Claude API, or Gemini API)
- ✅ MUST NOT store analyzed text permanently
- ✅ MUST NOT send text to any server except user-configured APIs
- ✅ SHOULD provide option to use local analysis (future)
- ✅ MUST encrypt API keys in browser storage

---

### Phase 2: Enhanced Features (v2.0)

#### 2.1 Learning & Adaptation
- Track user's typical tone over time
- Personalized baseline ("This is more aggressive than your usual tone")
- Learn which suggestions user accepts/rejects

#### 2.2 Context Awareness
- Detect platform (professional vs. casual)
- Adjust thresholds based on context
- Different standards for LinkedIn vs. Reddit

#### 2.3 Offline Mode
- Integrate TensorFlow.js for local analysis
- Fallback when API is unavailable
- Privacy mode (no external API calls)

#### 2.4 Advanced Suggestions
- AI-powered rewriting (using Claude API or Gemini API - user choice)
- Tone transformation slider (aggressive → diplomatic)
- Style matching (match recipient's communication style)

#### 2.5 Analytics Dashboard
- Weekly tone report
- Track improvement over time
- Insights: "You've avoided 23 potentially regrettable messages this month"

---

### Phase 3: Social Features (v3.0)

#### 3.1 Team/Community Features
- Shared tone standards for teams
- Organization-wide tone guidelines
- Aggregate anonymized insights for communities

#### 3.2 Integration
- Slack native app
- Gmail add-on
- Microsoft Teams integration

---

## Technical Architecture

### Frontend (Extension)
```
ToneCheck Extension
├── Manifest.json (WebExtension config)
├── Content Scripts (inject into web pages)
│   ├── text-detector.js (find input fields)
│   ├── ui-overlay.js (show feedback)
│   └── suggestion-engine.js (generate alternatives)
├── Background Script
│   ├── api-client.js (Perspective API calls)
│   └── storage-manager.js (settings, cache)
└── Popup UI
    ├── settings.html
    └── dashboard.html
```

### API Integration
- **Tone Analysis:** Perspective API (Google)
- **Suggestions:** Claude API (paid, high quality) or Gemini API (free tier available) - user selectable
- **Fallback:** Local sentiment analysis (Sentiment.js) for offline mode

### Data Flow
```
User types → Debounce (500ms) → Extract text → 
API call → Parse response → Calculate scores → 
Display UI → User action (edit/dismiss/send)
```

---

## Design Specifications

### Visual Design Principles
1. **Non-judgmental:** Avoid shame-based language
2. **Helpful:** Frame as assistant, not critic
3. **Quick:** Don't slow down user workflow
4. **Subtle:** Don't dominate the page

### Color Palette
- Success Green: `#10B981`
- Warning Yellow: `#F59E0B`
- Alert Red: `#EF4444`
- Neutral Gray: `#6B7280`
- Background: `#FFFFFF` / `#1F2937` (dark mode)

### Typography
- Primary: System font stack
- Headings: 14px bold
- Body: 12px regular
- Scores: 16px semibold

### Accessibility
- ✅ MUST meet WCAG 2.1 AA standards
- ✅ MUST support keyboard navigation
- ✅ MUST provide screen reader descriptions
- ✅ MUST have sufficient color contrast (4.5:1)

---

## User Experience Flow

### Happy Path
1. User starts typing in text field
2. User pauses typing (500ms)
3. ToneCheck analyzes text
4. Green indicator appears: "Looking good! ✓"
5. User continues typing or sends message

### Alert Path
1. User starts typing aggressive message
2. User pauses typing
3. ToneCheck analyzes and detects aggression
4. Red warning appears with score
5. User clicks "Review Message"
6. Specific phrases highlighted
7. Alternative suggestions shown
8. User clicks suggestion to replace text
9. Warning clears, green indicator shows
10. User sends improved message

### Dismiss Path
1. User sees warning
2. User understands but wants to send anyway
3. User clicks "Send Anyway"
4. Warning disappears
5. No further alerts for this message

---

## Implementation Plan

### Milestone 1: Foundation (Week 1-2)
- [ ] Set up Firefox extension boilerplate
- [ ] Implement text field detection
- [ ] Create basic UI overlay
- [ ] Integrate Perspective API
- [ ] Build settings page

### Milestone 2: Core Features (Week 3-4)
- [ ] Implement debouncing logic
- [ ] Build scoring visualization
- [ ] Create suggestion engine
- [ ] Add site whitelist/blacklist
- [ ] Implement storage system

### Milestone 3: Polish (Week 5-6)
- [ ] Refine UI/UX based on testing
- [ ] Add keyboard shortcuts
- [ ] Implement dark mode
- [ ] Write documentation
- [ ] Performance optimization

### Milestone 4: Launch (Week 7-8)
- [ ] Beta testing with 20-50 users
- [ ] Fix critical bugs
- [ ] Submit to Firefox Add-ons store
- [ ] Create marketing materials
- [ ] Launch blog post

---

## Technical Constraints

### API Limitations
- **Perspective API:** 1 QPS (query per second) free tier
- **Claude API:** Rate limits vary by tier (paid service)
- **Gemini API:** 15 RPM (requests per minute) free tier, sufficient for individual use
- **Rate limiting:** Need to implement client-side throttling (1 QPS for Perspective API)
- **Language:** English only in v1
- **Text length:** 3000 character limit per request (chunked analysis for longer text)

### Browser Limitations
- Cannot access native app text fields (Slack desktop app)
- Cannot access password fields (security restriction)
- Cannot modify encrypted/secure fields
- Limited to Firefox APIs (not Chrome-specific features)

### Performance Targets
- Analysis: <500ms average
- UI render: <100ms
- Memory usage: <50MB
- Extension size: <5MB

---

## Privacy & Security Considerations

### Data Handling
- ✅ Text sent to Perspective API (Google's servers) for tone analysis
- ✅ Text sent to Claude API (Anthropic) or Gemini API (Google) for suggestions (user's choice)
- ✅ API calls logged by respective providers (per their TOS)
- ✅ No text stored by ToneCheck
- ✅ User API keys stored encrypted locally
- ✅ No telemetry/analytics in v1

### User Consent
- Must show clear privacy notice on first use
- Must link to privacy policies for all APIs used (Perspective API, Claude API, Gemini API)
- Must allow opt-out of external API calls
- Must provide local-only mode option (future)

### Security Measures
- Input sanitization before API calls
- API key encryption in storage
- No eval() or unsafe JavaScript
- Content Security Policy enforcement

---

## Risk Analysis

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limiting | High | Medium | Implement smart throttling, local fallback |
| API downtime | Medium | High | Local sentiment analysis fallback |
| Poor accuracy | Medium | High | Allow user feedback to improve |
| Performance issues | Low | Medium | Optimize with debouncing, caching |

### Product Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User ignores warnings | High | High | Make warnings compelling, not annoying |
| False positives annoy users | Medium | High | Adjustable sensitivity, easy dismiss |
| Privacy concerns | Medium | High | Local mode, transparent data handling |
| Low adoption | Medium | Medium | Good marketing, clear value prop |

---

## Success Criteria

### Launch Criteria (v1.0)
- ✅ Works on 5 major platforms (Gmail, Reddit, Twitter, LinkedIn, Facebook)
- ✅ <3 critical bugs reported in beta
- ✅ 90%+ uptime for core features
- ✅ Passes Firefox Add-ons store review
- ✅ Documentation complete

### Post-Launch (3 months)
- 🎯 1,000+ active users
- 🎯 4.0+ star rating on Firefox store
- 🎯 <5% uninstall rate
- 🎯 40%+ users edit messages after warnings
- 🎯 Mentioned in 3+ tech publications

---

## Open Questions

1. **Monetization:** Should v2.0 have a premium tier? What features?
2. **API costs:** ✅ RESOLVED - Users provide their own API keys (Perspective API, Claude API, or Gemini API)
3. **Enterprise:** Is there B2B potential for team features?
4. **Mobile:** Should we build for Firefox Mobile?
5. **Multi-language:** Which languages to support next?
6. **AI suggestions:** ✅ RESOLVED - Support both Claude API (paid, high quality) and Gemini API (free tier available) - users can choose their preferred provider

---

## Appendix

### Competitive Analysis
- **Grammarly:** Grammar/spelling, tone detection is basic
- **Hemingway Editor:** Readability, not tone-specific
- **Crystal:** Personality insights, not real-time
- **Textio:** Enterprise hiring, not general use

### Research References
- Perspective API Documentation
- Claude API Documentation (Anthropic)
- Gemini API Documentation (Google)
- Mozilla WebExtension Guidelines
- WCAG 2.1 Accessibility Standards
- "Reducing Online Toxicity" - Google Jigsaw research

### Glossary
- **Toxicity:** Rude, disrespectful, or unreasonable language
- **Sentiment:** Overall positive/negative emotional tone
- **Perspective API:** Google's machine learning API for toxicity detection
- **Claude API:** Anthropic's AI API for text generation and rewriting (paid service)
- **Gemini API:** Google's AI API for text generation and rewriting (free tier available)
- **Content Script:** JavaScript that runs in webpage context
- **Debouncing:** Delaying function execution until user stops typing

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | ___________ | ___________ | ___________ |
| Engineering Lead | ___________ | ___________ | ___________ |
| Design Lead | ___________ | ___________ | ___________ |

---

**Document History:**
- v1.0 (2025-11-15): Initial draft