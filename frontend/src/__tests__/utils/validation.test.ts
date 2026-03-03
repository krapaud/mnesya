/**
 * Unit tests for validation utility functions (src/utils/validation.ts).
 */

import {
    cleanText,
    validateEmail,
    validatePassword,
    validateName,
    validatePasswordMatch,
} from '../../utils/validation';

// ---------------------------------------------------------------------------
// cleanText
// ---------------------------------------------------------------------------

describe('cleanText', () => {
    it('collapses multiple spaces into a single space', () => {
        expect(cleanText('hello   world')).toBe('hello world');
    });

    it('leaves single-spaced strings unchanged', () => {
        expect(cleanText('hello world')).toBe('hello world');
    });

    it('leaves strings with no spaces unchanged', () => {
        expect(cleanText('helloworld')).toBe('helloworld');
    });

    it('handles empty string', () => {
        expect(cleanText('')).toBe('');
    });

    it('handles mixed spacing', () => {
        expect(cleanText('a  b   c    d')).toBe('a b c d');
    });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
    it('returns null for a valid email', () => {
        expect(validateEmail('user@example.com')).toBeNull();
    });

    it('returns null for a valid email with subdomains', () => {
        expect(validateEmail('user@mail.example.co.uk')).toBeNull();
    });

    it('returns null for an email with uppercase letters', () => {
        expect(validateEmail('User@Example.COM')).toBeNull();
    });

    it('returns an error key for an email that is too short (< 5 chars)', () => {
        expect(validateEmail('a@b')).toBe(
            'register.errors.Email must be between 5 and 255 characters'
        );
    });

    it('returns an error key for an email that exceeds 255 characters', () => {
        const longEmail = 'a'.repeat(252) + '@b.c'; // 252 + 4 = 256 > 255
        expect(validateEmail(longEmail)).toBe(
            'register.errors.Email must be between 5 and 255 characters'
        );
    });

    it('returns an error key when @ is missing', () => {
        expect(validateEmail('notanemail')).toBe('register.errors.Invalid email');
    });

    it('returns an error key for missing domain', () => {
        expect(validateEmail('user@')).toBe('register.errors.Invalid email');
    });

    it('returns an error key for missing TLD', () => {
        expect(validateEmail('user@domain')).toBe('register.errors.Invalid email');
    });

    it('strips surrounding whitespace before validating', () => {
        expect(validateEmail('  user@example.com  ')).toBeNull();
    });

    it('returns an error for whitespace-only string', () => {
        expect(validateEmail('   ')).toBe(
            'register.errors.Email must be between 5 and 255 characters'
        );
    });
});

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
    it('returns null for a fully valid password', () => {
        expect(validatePassword('Secure@123')).toBeNull();
    });

    it('returns null for a password at the minimum length (8 chars)', () => {
        expect(validatePassword('Abcd@1!X')).toBeNull();
    });

    it('returns null for a long password up to 72 chars', () => {
        const longPw = 'A1@' + 'b'.repeat(69);
        expect(longPw.length).toBe(72);
        expect(validatePassword(longPw)).toBeNull();
    });

    it('returns an error for a password shorter than 8 characters', () => {
        expect(validatePassword('Ab1@')).toBe(
            'register.errors.Password must be at least 8 characters'
        );
    });

    it('rejects a password longer than 72 characters', () => {
        const tooLong = 'A1@' + 'b'.repeat(70);
        expect(tooLong.length).toBe(73);
        expect(validatePassword(tooLong)).toBe(
            'register.errors.Password must be at most 72 characters'
        );
    });

    it('returns an error when no digit is present', () => {
        expect(validatePassword('SecurePass@X')).toBe(
            'register.errors.Password must contain at least one digit'
        );
    });

    it('returns an error when no uppercase letter is present', () => {
        expect(validatePassword('secure@123')).toBe(
            'register.errors.Password must contain at least one uppercase letter'
        );
    });

    it('returns an error when no lowercase letter is present', () => {
        expect(validatePassword('SECURE@123')).toBe(
            'register.errors.Password must contain at least one lowercase letter'
        );
    });

    it('returns an error when no special character is present', () => {
        expect(validatePassword('Secure1234')).toBe(
            'register.errors.Password must contain at least one special character'
        );
    });

    it('accepts various valid special characters', () => {
        const specials = ['$', '@', '#', '%', '*', '!', '~', '&', '^', '-', '_', '+'];
        for (const sp of specials) {
            expect(validatePassword(`Secure${sp}1`)).toBeNull();
        }
    });

    it('strips leading/trailing whitespace before validation', () => {
        // Padded valid password
        expect(validatePassword('  Secure@123  ')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// validateName
// ---------------------------------------------------------------------------

describe('validateName', () => {
    it('returns null for a valid name', () => {
        expect(validateName('Alice')).toBeNull();
    });

    it('returns null for a name with exactly 100 chars', () => {
        expect(validateName('a'.repeat(100))).toBeNull();
    });

    it('returns an error for an empty string', () => {
        expect(validateName('')).toBe('register.errors.Name cannot be empty');
    });

    it('returns an error for whitespace-only input', () => {
        expect(validateName('   ')).toBe('register.errors.Name cannot be empty');
    });

    it('returns an error for a name exceeding 100 chars', () => {
        expect(validateName('a'.repeat(101))).toBe(
            'register.errors.Name must be at most 100 characters'
        );
    });

    it('accepts names with spaces (first + last name style)', () => {
        expect(validateName('John Doe')).toBeNull();
    });

    it('accepts names with accented characters', () => {
        expect(validateName('Ségolène')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// validatePasswordMatch
// ---------------------------------------------------------------------------

describe('validatePasswordMatch', () => {
    it('returns null when both passwords are identical', () => {
        expect(validatePasswordMatch('MyPass@1', 'MyPass@1')).toBeNull();
    });

    it('returns an error key when passwords differ', () => {
        expect(validatePasswordMatch('MyPass@1', 'WrongPass@1')).toBe(
            'register.errors.Passwords do not match'
        );
    });

    it('is case-sensitive', () => {
        expect(validatePasswordMatch('mypass@1', 'MYPASS@1')).toBe(
            'register.errors.Passwords do not match'
        );
    });

    it('returns an error when confirm password is empty', () => {
        expect(validatePasswordMatch('MyPass@1', '')).toBe(
            'register.errors.Passwords do not match'
        );
    });

    it('returns an error when the original password is empty', () => {
        expect(validatePasswordMatch('', 'MyPass@1')).toBe(
            'register.errors.Passwords do not match'
        );
    });

    it('returns null when both are empty strings', () => {
        // Two identical empty strings technically match
        expect(validatePasswordMatch('', '')).toBeNull();
    });
});
