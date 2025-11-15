# ToneCheck Browser Extension

A Firefox browser extension that analyzes emotional tone of text in web forms and provides real-time feedback on potentially aggressive language before users send messages.

## Features

- **Real-Time Tone Analysis**: Automatically detects text input in web forms and analyzes tone via Perspective API
- **Visual Indicators**: Displays color-coded indicators (green/yellow/red) near text fields showing tone analysis results
- **AI-Powered Suggestions**: Provides 2-3 alternative phrasings when aggressive language is detected (via Claude API or Gemini API)
- **Privacy-First**: User-provided API keys only, encrypted storage, no permanent text storage
- **Configurable**: Adjustable sensitivity thresholds and website-specific controls

## Prerequisites

- **Node.js**: v18+ (for development)
- **Firefox**: Latest version
- **npm** or **yarn**: Package manager
- **API Keys**:
  - Perspective API key (for tone analysis) - [Get one here](https://developers.perspectiveapi.com/)
  - Claude API key or Gemini API key (for suggestions) - [Claude](https://console.anthropic.com/) | [Gemini](https://ai.google.dev/)

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ToneCheck
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Firefox:
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on..."
   - Select `manifest.json` from the `dist/` directory

## Configuration

1. Click the ToneCheck extension icon in Firefox toolbar
2. Enter your API keys:
   - Perspective API key (required for tone analysis)
   - Suggestion API key (Claude or Gemini - choose your preferred provider)
3. Configure settings:
   - **Sensitivity Threshold**: Low (70%+), Medium (50%+), or High (30%+)
   - **Suggestion Provider**: Claude (paid, high quality) or Gemini (free tier available)
   - **Disabled Websites**: Optionally disable extension on specific sites

## Development

### Build Commands

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
ToneCheck/
├── src/
│   ├── content/          # Content scripts (field detection, UI injection)
│   ├── background/       # Background worker (API calls, storage)
│   ├── popup/            # Extension popup UI
│   ├── options/         # Options page
│   └── shared/          # Shared utilities
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── contract/        # API contract tests
└── dist/                # Built extension (generated)
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- unit
npm test -- integration
npm test -- contract

# Coverage report
npm run test:coverage
```

## API Keys

This extension requires user-provided API keys for privacy. Users must:
1. Obtain a Perspective API key from [developers.perspectiveapi.com](https://developers.perspectiveapi.com/)
2. Choose either:
   - **Claude API key** from [console.anthropic.com](https://console.anthropic.com/) (paid, high quality)
   - **Gemini API key** from [ai.google.dev](https://ai.google.dev/) (free tier available)

API keys are encrypted before storage and never transmitted except to the respective API services.

## Privacy

- **No persistent text storage**: All text analysis requests and results are in-memory only
- **Encrypted API keys**: User API keys are encrypted before storage using Web Crypto API
- **No telemetry**: No user behavior tracking or analytics data stored
- **User-controlled**: Users provide their own API keys and control all data transmission

## License

MIT

## Support

For issues, questions, or contributions, please see the project repository.

