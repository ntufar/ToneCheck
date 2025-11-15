// Jest setup file for WebExtension testing
import { browser } from '@webextension-polyfill/testing';

// Mock browser APIs globally
global.browser = browser;

