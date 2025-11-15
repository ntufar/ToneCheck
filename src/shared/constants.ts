/**
 * Shared constants for ToneCheck extension
 */

// API Endpoints
export const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Timing Constants
export const DEBOUNCE_DELAY_MS = 500; // 500ms debounce after user stops typing
export const RATE_LIMIT_QPS = 1; // 1 query per second
export const RATE_LIMIT_QUEUE_WARNING_THRESHOLD = 3; // Warn when queue exceeds 3 requests
export const API_CACHE_TTL_MS = 5000; // 5 seconds cache for API responses

// Text Limits
export const MAX_TEXT_LENGTH = 20000; // Perspective API limit
export const CHUNK_SIZE = 3000; // Chunk text >3000 characters

// Sensitivity Thresholds
export const SENSITIVITY_THRESHOLDS = {
  low: 70,    // 70%+ aggression threshold
  medium: 50, // 50%+ aggression threshold (default)
  high: 30    // 30%+ aggression threshold
} as const;

// Default Settings
export const DEFAULT_SETTINGS: {
  suggestionProvider: 'claude' | 'gemini';
  sensitivityThreshold: 'low' | 'medium' | 'high';
  disabledWebsites: string[];
  extensionEnabled: boolean;
} = {
  suggestionProvider: 'gemini',
  sensitivityThreshold: 'medium',
  disabledWebsites: [],
  extensionEnabled: true
};

// Storage Keys
export const STORAGE_KEY_USER_SETTINGS = 'userSettings';

// Message Types
export const MESSAGE_TYPE_ANALYZE = 'analyze';
export const MESSAGE_TYPE_SUGGESTIONS = 'suggestions';
export const MESSAGE_TYPE_SETTINGS_GET = 'settings/get';
export const MESSAGE_TYPE_SETTINGS_UPDATE = 'settings/update';

// Platform-Specific Selectors
export const PLATFORM_SELECTORS = {
  gmail: [
    'div[contenteditable="true"][aria-label*="Message"]',
    'div[contenteditable="true"][aria-label*="Compose"]',
    'textarea[name="to"]',
    'div[contenteditable="true"][role="textbox"]'
  ],
  reddit: [
    'textarea[placeholder*="comment"]',
    'textarea[placeholder*="reply"]',
    'div[contenteditable="true"][data-testid*="comment"]'
  ],
  twitter: [
    'div[contenteditable="true"][data-testid*="tweetTextarea"]',
    'div[contenteditable="true"][role="textbox"]'
  ],
  linkedin: [
    'div[contenteditable="true"][aria-label*="message"]',
    'div[contenteditable="true"][role="textbox"]'
  ],
  facebook: [
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder*="Write"]'
  ]
} as const;

// Generic Text Field Selectors
export const GENERIC_SELECTORS = [
  'textarea',
  'input[type="text"]',
  'input[type="email"]',
  'div[contenteditable="true"]'
];

// Excluded Input Types (skip password fields, etc.)
export const EXCLUDED_INPUT_TYPES = [
  'password',
  'hidden',
  'submit',
  'button',
  'reset',
  'file',
  'image',
  'checkbox',
  'radio'
];

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Invalid request parameters',
  API_KEY_MISSING: 'API key not configured. Please set up your API keys in settings.',
  API_ERROR: 'API request failed',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait a moment before trying again.'
} as const;

// UI Constants
export const INDICATOR_COLORS = {
  safe: '#10b981',      // green
  warning: '#f59e0b',   // yellow
  danger: '#ef4444'     // red
} as const;

export const INDICATOR_THRESHOLDS = {
  safe: 0.3,    // <30% aggression = green
  warning: 0.5, // 30-50% aggression = yellow
  danger: 0.5   // >50% aggression = red
} as const;

