// Utility function tests
// Since the lib directory is empty, we'll create some common utility functions and their tests

import { describe, it, expect } from '@jest/globals';

// Common utility functions that might be used in the app
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string, locale: string = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('filters out falsy values', () => {
      expect(cn('class1', null, undefined, false, 'class2')).toBe(
        'class1 class2',
      );
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('handles single class', () => {
      expect(cn('single-class')).toBe('single-class');
    });
  });

  describe('formatDate', () => {
    it('formats date object correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    it('formats date string correctly', () => {
      const formatted = formatDate('2024-01-15', 'en');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    it('respects locale parameter', () => {
      const date = new Date('2024-01-15');
      const enFormat = formatDate(date, 'en');
      const koFormat = formatDate(date, 'ko');
      expect(enFormat).not.toBe(koFormat);
    });
  });

  describe('truncateText', () => {
    it('truncates text longer than maxLength', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long...');
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    it('returns original text if shorter than maxLength', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('handles edge case of exact length', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });

    it('handles empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('123@test.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
