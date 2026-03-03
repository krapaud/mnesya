/**
 * Validation functions for form fields.
 * Returns a translation key string if invalid, or null if valid.
 *
 * @module validation
 */

/** Removes extra spaces from a text input. */
export const cleanText = (text: string): string => {
    return text.replace(/\s{2,}/g, ' ');
};

/** Checks email format and length. Returns an error key or null. */
export const validateEmail = (email: string): string | null => {
    const trimmed = email.trim();

    // Check length constraints (5-255 characters)
    if (trimmed.length < 5 || trimmed.length > 255) {
        return 'register.errors.Email must be between 5 and 255 characters';
    }

    // Validate email format using regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) {
        return 'register.errors.Invalid email';
    }

    return null;
};

/** Checks password strength (length, digits, uppercase, lowercase, special char). Returns an error key or null. */
export const validatePassword = (password: string): string | null => {
    const trimmedPassword = password.trim();

    // Check length constraints (8-72 characters — matches bcrypt server limit)
    if (trimmedPassword.length < 8) {
        return 'register.errors.Password must be at least 8 characters';
    }
    if (trimmedPassword.length > 72) {
        return 'register.errors.Password must be at most 72 characters';
    }

    // Check for at least one digit
    if (!/\d/.test(trimmedPassword)) {
        return 'register.errors.Password must contain at least one digit';
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(trimmedPassword)) {
        return 'register.errors.Password must contain at least one uppercase letter';
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(trimmedPassword)) {
        return 'register.errors.Password must contain at least one lowercase letter';
    }

    // Check for at least one special character
    if (!/[$@#%*!~&^()\-_+=\[\]{}|;:,.<>?/\\]/.test(trimmedPassword)) {
        return 'register.errors.Password must contain at least one special character';
    }

    return null;
};

/** Checks that the name is not empty and not too long. Returns an error key or null. */
export const validateName = (name: string): string | null => {
    const trimmedName = name.trim();

    // Check if name is empty
    if (trimmedName.length === 0) {
        return 'register.errors.Name cannot be empty';
    }

    // Check maximum length (100 characters)
    if (trimmedName.length > 100) {
        return 'register.errors.Name must be at most 100 characters';
    }

    return null;
};

/** Checks that the two passwords match. Returns an error key or null. */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
        return 'register.errors.Passwords do not match';
    }
    return null;
};
