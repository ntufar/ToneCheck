/**
 * Background service worker entry point
 * Initializes message handlers and extension lifecycle
 */

import browser from 'webextension-polyfill';
import { initializeMessageHandler } from './message-handler';

// Initialize message handler on service worker startup
initializeMessageHandler();

// Handle extension installation
browser.runtime.onInstalled.addListener((details: browser.Runtime.OnInstalledDetailsType) => {
  if (details.reason === 'install') {
    console.log('ToneCheck extension installed');
    // TODO: Show welcome/onboarding in Phase 5
  } else if (details.reason === 'update') {
    console.log('ToneCheck extension updated');
  }
});

console.log('ToneCheck background service worker initialized');

