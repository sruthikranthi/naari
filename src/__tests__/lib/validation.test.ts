/**
 * Unit tests for validation utilities
 */

import { sanitizeText, validationSchemas } from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe('Hello');
    });

    it('should preserve plain text', () => {
      const input = 'This is plain text';
      const result = sanitizeText(input);
      expect(result).toBe('This is plain text');
    });

    it('should handle empty strings', () => {
      const result = sanitizeText('');
      expect(result).toBe('');
    });

    it('should remove dangerous HTML attributes', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeText(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('validationSchemas', () => {
    describe('email', () => {
      it('should validate correct email addresses', () => {
        const result = validationSchemas.email.validate('test@example.com');
        expect(result).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        const result = validationSchemas.email.validate('invalid-email');
        expect(result).toBe(false);
      });
    });

    describe('password', () => {
      it('should validate passwords with minimum length', () => {
        const result = validationSchemas.password.validate('password123');
        expect(result).toBe(true);
      });

      it('should reject short passwords', () => {
        const result = validationSchemas.password.validate('short');
        expect(result).toBe(false);
      });
    });

    describe('postContent', () => {
      it('should validate post content', () => {
        const result = validationSchemas.postContent.validate('This is a valid post');
        expect(result).toBe(true);
      });

      it('should reject empty content', () => {
        const result = validationSchemas.postContent.validate('');
        expect(result).toBe(false);
      });

      it('should reject content that is too long', () => {
        const longContent = 'a'.repeat(10001);
        const result = validationSchemas.postContent.validate(longContent);
        expect(result).toBe(false);
      });
    });

    describe('chatMessage', () => {
      it('should validate chat messages', () => {
        const result = validationSchemas.chatMessage.validate('Hello!');
        expect(result).toBe(true);
      });

      it('should reject empty messages', () => {
        const result = validationSchemas.chatMessage.validate('');
        expect(result).toBe(false);
      });
    });
  });
});

