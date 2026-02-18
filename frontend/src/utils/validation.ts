/**
 * Form validation utilities.
 * 
 * Provides validation functions for common form fields including email,
 * password, and name inputs. Returns error message keys for i18n translation.
 * 
 * @module validation
 */

/**
 * Cleans text input by removing consecutive spaces.
 * 
 * Replaces multiple consecutive spaces with a single space.
 * Useful for name fields and text inputs.
 * 
 * @param text - Text to clean
 * @returns Cleaned text with single spaces
 */
export const cleanText = (text: string): string => {
    return text.replace(/\s{2,}/g, ' ');
};

/**
 * Validates email address format and length.
 * 
 * Checks for valid email format and ensures length is between 5-255 characters.
 * 
 * @param email - Email address to validate
 * @returns Error message key or null if valid
 */
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

/**
 * Validates password strength and requirements.
 * 
 * Enforces password policy:
 * - Length: 8-20 characters
 * - Must contain at least one digit
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one special character ($@#%*!~&)
 * 
 * @param password - Password to validate
 * @returns Error message key or null if valid
 */
export const validatePassword = (password: string): string | null => {
    const trimmedPassword = password.trim();
    
    // Check length constraints (8-20 characters)
    if (trimmedPassword.length < 8) { 
        return 'register.errors.Password must be at least 8 characters'; 
    }
    if (trimmedPassword.length > 20) { 
        return 'register.errors.Password must be at most 20 characters'; 
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
    if (!/[$@#%*!~&]/.test(trimmedPassword)) {
        return 'register.errors.Password must contain at least one special character';
    }
    
    return null;
};

/**
 * Validates name field (first name or last name).
 * 
 * Ensures name is not empty and does not exceed maximum length.
 * 
 * @param name - Name to validate
 * @returns Error message key or null if valid
 */
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

/**
 * Validates password confirmation matches original password.
 * 
 * @param password - Original password
 * @param confirmPassword - Password confirmation
 * @returns Error message key or null if passwords match
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
        return 'register.errors.Passwords do not match';
    }
    return null;
};
