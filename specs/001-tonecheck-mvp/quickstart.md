# Quick Start Guide: ToneCheck Browser Extension MVP

**Date**: 2025-01-21  
**Phase**: 1 - Design & Contracts

## Prerequisites

- **Node.js**: v18+ (for development tooling)
- **Firefox**: Latest version (primary target)
- **npm** or **yarn**: Package manager
- **Git**: Version control

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository (when available)
git clone <repository-url>
cd ToneCheck

# Install dependencies
npm install
# or
yarn install
```

### 2. Get API Keys

**Perspective API Key** (for tone analysis):
1. Visit https://developers.perspectiveapi.com/
2. Sign up for free API access
3. Create an API key in the dashboard
4. Save the key securely (you'll need it for extension configuration)

**Suggestion API Key** (choose one):

**Option A: Gemini API Key** (recommended - free tier available):
1. Visit https://ai.google.dev/
2. Sign up for a Google Cloud account (if needed)
3. Enable Gemini API in Google Cloud Console
4. Create an API key
5. Save the key securely

**Option B: Claude API Key** (paid, high quality):
1. Visit https://console.anthropic.com/
2. Sign up for an account
3. Create an API key
4. Save the key securely

**Note**: 
- Perspective API key is required for tone analysis
- Either Gemini or Claude API key is required for suggestions (you can choose in settings)
- Gemini offers a free tier, making it accessible for users who prefer not to pay
- The extension will prompt you to enter API keys and select your preferred suggestion provider in the settings

### 3. Build the Extension

```bash
# Build TypeScript and bundle extension
npm run build
# or
yarn build
```

This will:
- Compile TypeScript to JavaScript
- Bundle extension files
- Generate `dist/` directory with extension-ready files

### 4. Load Extension in Firefox

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Select `manifest.json` from the `dist/` directory (or project root if manifest is there)

The extension should now be loaded and active.

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test
# or
yarn test

# Run tests in watch mode
npm test:watch

# Run specific test suite
npm test -- unit
npm test -- integration
npm test -- contract
```

### Development Build

```bash
# Watch mode - rebuilds on file changes
npm run dev
# or
yarn dev
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```
ToneCheck/
├── src/
│   ├── content/          # Content scripts (field detection, UI injection)
│   ├── background/       # Background worker (API calls, storage)
│   ├── popup/            # Extension popup UI
│   ├── options/          # Options page
│   └── shared/           # Shared utilities
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── contract/         # API contract tests
├── dist/                 # Built extension (generated)
└── manifest.json         # WebExtension manifest
```

## Configuration

### Extension Settings

1. Click the ToneCheck extension icon in Firefox toolbar
2. Click "Settings" or "Options"
3. Enter your API keys:
   - Perspective API key (for tone analysis)
   - Suggestion API key (Gemini or Claude - choose your preferred provider)
4. Select suggestion provider:
   - **Gemini** (default): Free tier available, cost-effective
   - **Claude**: Paid, high quality output
5. Configure sensitivity threshold:
   - **Low**: Only flags highly aggressive content (70%+)
   - **Medium**: Balanced detection (50%+) - **Recommended**
   - **High**: Flags even mildly concerning content (30%+)
6. Optionally disable extension on specific websites

### Environment Variables (Development)

Create `.env.local` for development (optional):

```bash
# API keys for testing (not used in production - users provide their own)
PERSPECTIVE_API_KEY=your_test_key_here
GEMINI_API_KEY=your_test_key_here  # or CLAUDE_API_KEY=your_test_key_here
```

**Note**: In production, users must provide their own API keys for privacy.

## Testing the Extension

### Manual Testing

1. **Test on Gmail**:
   - Open Gmail compose window
   - Type a message with potentially aggressive language
   - Wait 500ms after stopping typing
   - Verify tone indicator appears

2. **Test on Reddit**:
   - Navigate to a Reddit comment thread
   - Type a comment
   - Verify analysis works in Reddit's text area

3. **Test Suggestions**:
   - Type aggressive text that triggers a warning
   - Click "Review Message"
   - Verify suggestions appear
   - Click a suggestion to replace text

4. **Test Settings**:
   - Open extension popup
   - Update sensitivity threshold
   - Verify changes take effect immediately

### Automated Testing

```bash
# Run unit tests
npm test -- unit

# Run integration tests (requires Firefox)
npm test -- integration

# Run contract tests (mocks API responses)
npm test -- contract
```

## Common Issues

### Extension Not Loading

- **Issue**: Extension fails to load in Firefox
- **Solution**: Check `manifest.json` syntax, ensure all required files exist, check browser console for errors

### API Calls Failing

- **Issue**: Tone analysis not working
- **Solution**: 
  - Verify API keys are correctly entered in settings
  - Check network tab for API request/response
  - Verify API keys have proper permissions/quotas

### Content Script Not Injecting

- **Issue**: Tone indicators not appearing on pages
- **Solution**:
  - Check content script permissions in `manifest.json`
  - Verify page URL matches content script matches
  - Check browser console for content script errors

### Rate Limiting

- **Issue**: "Rate limit reached" notifications
- **Solution**: 
  - Extension throttles to 1 QPS automatically
  - Wait a few seconds between rapid typing
  - Consider upgrading API tier if needed

## Next Steps

1. **Read the Specification**: Review `/specs/001-tonecheck-mvp/spec.md` for detailed requirements
2. **Review Data Model**: See `/specs/001-tonecheck-mvp/data-model.md` for entity definitions
3. **Check API Contracts**: See `/specs/001-tonecheck-mvp/contracts/` for API integration details
4. **Review Research**: See `/specs/001-tonecheck-mvp/research.md` for technical decisions

## Development Resources

- **WebExtension Documentation**: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- **Perspective API Docs**: https://developers.perspectiveapi.com/s/docs
- **Claude API Docs**: https://docs.anthropic.com/claude/reference
- **Gemini API Docs**: https://ai.google.dev/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Jest Documentation**: https://jestjs.io/

## Getting Help

- Check browser console for errors (F12 → Console)
- Check extension background page console (`about:debugging` → Inspect)
- Review test output for failing tests
- Check API documentation for integration issues

## Building for Production

```bash
# Production build (minified, optimized)
npm run build:prod
# or
yarn build:prod
```

The `dist/` directory will contain the production-ready extension that can be packaged for Firefox Add-ons store submission.

