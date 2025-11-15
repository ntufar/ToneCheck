/**
 * Shared types for ToneCheck extension
 */

// Text Analysis Request (Ephemeral)
export interface TextAnalysisRequest {
  text: string;
  timestamp: number;
  fieldId: string;
  url: string;
  requestId: string;
}

// Tone Analysis Result (Ephemeral)
export interface ToneAnalysisResult {
  requestId: string;
  toxicity: number;
  severeToxicity: number;
  identityAttack: number;
  insult: number;
  profanity: number;
  threat: number;
  overallAggression: number;
  timestamp: number;
  fieldId: string;
}

// User Settings (Persistent)
export interface UserSettings {
  apiKeyToneAnalysis?: string; // Encrypted
  apiKeySuggestions?: string; // Encrypted
  suggestionProvider: 'claude' | 'gemini';
  sensitivityThreshold: 'low' | 'medium' | 'high';
  disabledWebsites: string[];
  extensionEnabled: boolean;
  lastUpdated: number;
}

// Alternative Suggestion (Ephemeral)
export interface AlternativeSuggestion {
  originalText: string;
  suggestion: string;
  confidence?: number;
  requestId: string;
  timestamp: number;
}

// Message Types for Extension API
export type MessageType = 
  | 'analyze'
  | 'suggestions'
  | 'settings/get'
  | 'settings/update';

export interface AnalysisRequest {
  text: string;
  fieldId: string;
  url: string;
}

export interface AnalysisResponse {
  requestId: string;
  toxicity: number;
  severeToxicity: number;
  identityAttack: number;
  insult: number;
  profanity: number;
  threat: number;
  overallAggression: number;
}

export interface SuggestionRequest {
  text: string;
  flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[];
  requestId: string;
  aggressionScore?: number;
}

export interface SuggestionResponse {
  suggestions: string[]; // 2-3 alternatives
}

export interface SettingsUpdateRequest {
  apiKeyToneAnalysis?: string | null;
  apiKeySuggestions?: string | null;
  suggestionProvider?: 'claude' | 'gemini';
  sensitivityThreshold?: 'low' | 'medium' | 'high';
  disabledWebsites?: string[];
  extensionEnabled?: boolean;
}

export interface SettingsResponse {
  apiKeyToneAnalysis?: string | null;
  apiKeySuggestions?: string | null;
  suggestionProvider: 'claude' | 'gemini';
  sensitivityThreshold: 'low' | 'medium' | 'high';
  disabledWebsites: string[];
  extensionEnabled: boolean;
  lastUpdated: number;
}

export interface ErrorResponse {
  error: 
    | 'INVALID_REQUEST'
    | 'API_KEY_MISSING'
    | 'API_ERROR'
    | 'NETWORK_ERROR'
    | 'RATE_LIMIT_EXCEEDED';
  message: string;
  details?: Record<string, unknown>;
}

export type ExtensionMessage = 
  | { type: 'analyze'; payload: AnalysisRequest }
  | { type: 'suggestions'; payload: SuggestionRequest }
  | { type: 'settings/get'; payload?: never }
  | { type: 'settings/update'; payload: SettingsUpdateRequest };

export type ExtensionResponse = 
  | AnalysisResponse
  | SuggestionResponse
  | SettingsResponse
  | ErrorResponse;

