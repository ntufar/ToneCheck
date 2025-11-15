/**
 * T095: Unit tests for field detector
 */

import { fieldDetector, type DetectedField } from '../../../src/content/field-detector';
import { PLATFORM_SELECTORS, GENERIC_SELECTORS, EXCLUDED_INPUT_TYPES } from '../../../src/shared/constants';

describe('FieldDetector', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    fieldDetector.cleanup();
  });

  afterEach(() => {
    fieldDetector.cleanup();
  });

  describe('initialize', () => {
    it('should detect textarea fields', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields[0].element).toBe(textarea);
    });

    it('should detect input[type="text"] fields', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields[0].element).toBe(input);
    });

    it('should detect contenteditable divs', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields[0].element).toBe(div);
    });

    it('should skip password fields', () => {
      const passwordInput = document.createElement('input');
      passwordInput.type = 'password';
      document.body.appendChild(passwordInput);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.find(f => f.element === passwordInput)).toBeUndefined();
    });

    it('should skip excluded input types', () => {
      EXCLUDED_INPUT_TYPES.forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        document.body.appendChild(input);
      });

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      EXCLUDED_INPUT_TYPES.forEach(type => {
        const found = fields.find(f => f.element instanceof HTMLInputElement && f.element.type === type);
        expect(found).toBeUndefined();
      });
    });

    it('should skip hidden fields', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.style.display = 'none';
      document.body.appendChild(input);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.find(f => f.element === input)).toBeUndefined();
    });

    it('should skip disabled fields', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.disabled = true;
      document.body.appendChild(input);

      fieldDetector.initialize();

      const fields = fieldDetector.getDetectedFields();
      expect(fields.find(f => f.element === input)).toBeUndefined();
    });
  });

  describe('onFieldChange', () => {
    it('should call callback when field text changes', (done) => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();

      fieldDetector.onFieldChange((field: DetectedField, text: string) => {
        expect(text).toBe('test');
        expect(field.element).toBe(textarea);
        done();
      });

      // Simulate input
      textarea.value = 'test';
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      // Wait for debounce
      setTimeout(() => {
        // Callback should be called
      }, 600);
    });

    it('should debounce field changes', (done) => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();

      let callCount = 0;
      fieldDetector.onFieldChange(() => {
        callCount++;
      });

      // Rapidly change text
      textarea.value = 'a';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.value = 'ab';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.value = 'abc';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // After debounce, should only be called once with final value
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 600);
    });

    it('should skip empty text', (done) => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();

      let called = false;
      fieldDetector.onFieldChange(() => {
        called = true;
      });

      textarea.value = '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        expect(called).toBe(false);
        done();
      }, 600);
    });
  });

  describe('cleanup', () => {
    it('should clear all detected fields', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();
      expect(fieldDetector.getDetectedFields().length).toBeGreaterThan(0);

      fieldDetector.cleanup();
      expect(fieldDetector.getDetectedFields().length).toBe(0);
    });

    it('should remove detection markers', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      fieldDetector.initialize();
      expect(textarea.dataset.tonecheckDetected).toBe('true');

      fieldDetector.cleanup();
      expect(textarea.dataset.tonecheckDetected).toBeUndefined();
    });
  });

  describe('dynamic fields', () => {
    it('should detect dynamically added fields', (done) => {
      fieldDetector.initialize();

      // Add field after initialization
      setTimeout(() => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        // MutationObserver should detect it
        setTimeout(() => {
          const fields = fieldDetector.getDetectedFields();
          expect(fields.find(f => f.element === textarea)).toBeDefined();
          done();
        }, 200);
      }, 100);
    });
  });
});

