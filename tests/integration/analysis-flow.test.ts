/**
 * T103: Integration tests for end-to-end analysis flow
 */

import { fieldDetector } from '../../src/content/field-detector';
import { uiInjector } from '../../src/content/ui-injector';

describe('Analysis Flow Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    fieldDetector.cleanup();
    uiInjector.cleanup();
  });

  afterEach(() => {
    fieldDetector.cleanup();
    uiInjector.cleanup();
  });

  it('should detect field, analyze text, and display indicator', (done) => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    fieldDetector.initialize();

    fieldDetector.onFieldChange((field, text) => {
      expect(text).toBe('test text');
      expect(field.element).toBe(textarea);
      
      // Mock analysis result
      const mockResult = {
        requestId: 'req-1',
        fieldId: field.fieldId,
        timestamp: Date.now(),
        toxicity: 0.2,
        severeToxicity: 0.1,
        identityAttack: 0.1,
        insult: 0.3,
        profanity: 0.1,
        threat: 0.1,
        overallAggression: 30
      };

      // Inject indicator
      uiInjector.injectIndicator(field, mockResult);

      // Check that indicator was created
      const indicators = document.querySelectorAll('.tonecheck-indicator');
      expect(indicators.length).toBeGreaterThan(0);
      
      done();
    });

    // Simulate user input
    textarea.value = 'test text';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounce
    setTimeout(() => {
      // Callback should have been called
    }, 600);
  });

  it('should handle multiple fields independently', () => {
    const textarea1 = document.createElement('textarea');
    textarea1.id = 'field1';
    document.body.appendChild(textarea1);

    const textarea2 = document.createElement('textarea');
    textarea2.id = 'field2';
    document.body.appendChild(textarea2);

    fieldDetector.initialize();

    const fields = fieldDetector.getDetectedFields();
    expect(fields.length).toBe(2);
    expect(fields[0].element).toBe(textarea1);
    expect(fields[1].element).toBe(textarea2);
  });

  it('should cleanup on navigation', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    fieldDetector.initialize();
    expect(fieldDetector.getDetectedFields().length).toBe(1);

    // Simulate navigation cleanup
    fieldDetector.cleanup();
    expect(fieldDetector.getDetectedFields().length).toBe(0);
    expect(textarea.dataset.tonecheckDetected).toBeUndefined();
  });
});

