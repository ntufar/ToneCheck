# ToneCheck Installation & Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle all extension files
- Copy manifest.json and HTML files to `dist/` directory

### 3. Load Extension in Firefox

1. Open Firefox
2. Navigate to `about:debugging`
3. Click **"This Firefox"** in the left sidebar
4. Click **"Load Temporary Add-on..."**
5. Navigate to the `dist/` folder in your project
6. Select `manifest.json`

The extension should now be loaded and active!

### 4. Configure API Keys

**Required API Keys:**

1. **Perspective API Key** (for tone analysis):
   - Visit https://developers.perspectiveapi.com/
   - Sign up for free API access
   - Create an API key in the dashboard

2. **Suggestion API Key** (choose one):
   - **Gemini API** (recommended - free tier available):
     - Visit https://ai.google.dev/
     - Sign up and enable Gemini API
     - Create an API key
   - **Claude API** (paid, high quality):
     - Visit https://console.anthropic.com/
     - Sign up and create an API key

**To configure:**

1. Click the ToneCheck extension icon in Firefox toolbar
2. Enter your API keys in the popup
3. Select your preferred suggestion provider (Gemini or Claude)
4. Choose sensitivity threshold (Low/Medium/High)
5. Click "Save Settings"

Alternatively, use the Options page:
1. Right-click the extension icon → "Manage Extension" → "Options"
2. Configure all settings including disabled websites list

## Development Mode

For development with auto-rebuild on file changes:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically. After rebuilding, reload the extension in Firefox:
- Go to `about:debugging`
- Find ToneCheck in the list
- Click "Reload"

## Testing the Extension

1. **Test on Gmail:**
   - Open Gmail compose window
   - Type a message with potentially aggressive language
   - Wait 500ms after stopping typing
   - Verify tone indicator appears

2. **Test Suggestions:**
   - Type aggressive text that triggers a warning
   - Review interface should appear automatically
   - Click a suggestion to replace text
   - Or click "Send Anyway" to dismiss

3. **Test Settings:**
   - Open extension popup
   - Update sensitivity threshold
   - Verify changes take effect immediately

## Troubleshooting

### Extension Not Loading
- Check `dist/manifest.json` exists
- Verify all files in `dist/` are present
- Check browser console for errors (F12 → Console)
- Check extension background page console (`about:debugging` → Inspect)

### API Calls Failing
- Verify API keys are correctly entered in settings
- Check network tab for API request/response
- Verify API keys have proper permissions/quotas
- Check browser console for error messages

### Content Script Not Injecting
- Check content script permissions in `manifest.json`
- Verify page URL matches content script matches
- Check browser console for content script errors
- Try reloading the extension

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version: `npx tsc --version`
- Clear `dist/` folder and rebuild: `rm -rf dist && npm run build`

## Project Structure

```
ToneCheck/
├── src/                    # Source code
│   ├── background/        # Background worker (API calls, storage)
│   ├── content/           # Content scripts (field detection, UI)
│   ├── popup/             # Extension popup UI
│   ├── options/           # Options page
│   └── shared/            # Shared utilities
├── dist/                   # Built extension (generated)
│   ├── manifest.json
│   ├── background/
│   ├── content/
│   ├── popup/
│   └── options/
└── tests/                  # Test files
```

## Next Steps

- Read the [README.md](README.md) for more details
- Review [specs/001-tonecheck-mvp/quickstart.md](specs/001-tonecheck-mvp/quickstart.md) for development workflow
- Check [specs/001-tonecheck-mvp/tasks.md](specs/001-tonecheck-mvp/tasks.md) for implementation status

