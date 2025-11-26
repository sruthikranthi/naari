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
        const result = validationSchemas.email.safeParse('test@example.com');
        expect(result.success).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        const result = validationSchemas.email.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });
    });

    describe('password', () => {
      it('should validate passwords with minimum length', () => {
        const result = validationSchemas.password.safeParse('password123');
        expect(result.success).toBe(true);
      });

      it('should reject short passwords', () => {
        const result = validationSchemas.password.safeParse('short');
        expect(result.success).toBe(false);
      });
    });

    describe('postContent', () => {
      it('should validate post content', () => {
        const result = validationSchemas.postContent.safeParse('This is a valid post');
        expect(result.success).toBe(true);
      });

      it('should reject empty content', () => {
        const result = validationSchemas.postContent.safeParse('');
        expect(result.success).toBe(false);
      });

      it('should reject content that is too long', () => {
        const longContent = 'a'.repeat(10001);
        const result = validationSchemas.postContent.safeParse(longContent);
        expect(result.success).toBe(false);
      });
    });

    describe('chatMessage', () => {
      it('should validate chat messages', () => {
        const result = validationSchemas.chatMessage.safeParse('Hello!');
        expect(result.success).toBe(true);
      });

      it('should reject empty messages', () => {
        const result = validationSchemas.chatMessage.safeParse('');
        expect(result.success).toBe(false);
      });
    });
  });
});

