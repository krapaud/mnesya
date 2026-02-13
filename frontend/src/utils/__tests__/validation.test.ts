import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '../validation';

describe('validateEmail', () => {
  
  test('should return null for valid email', () => {
    const result = validateEmail('test@example.com');
    expect(result).toBe(null);
  });
  
  test('should return error for email too short', () => {
    const result = validateEmail('abc');
    expect(result).toBe('register.errors.Email must be between 5 and 255 characters');
  });
  
  test('should return error for email without @', () => {
    const result = validateEmail('testexample.com');
    expect(result).toBe('register.errors.Invalid email');
  });

  test('should return error for email without domain', () => {
    const result = validateEmail('test@');
    expect(result).toBe('register.errors.Invalid email');
  });

  test('should return error for email too long', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = validateEmail(longEmail);
    expect(result).toBe('register.errors.Email must be between 5 and 255 characters');
  });
});

describe('validatePassword', () => {
  
  test('should return null for valid password', () => {
    const result = validatePassword('Password1!');
    expect(result).toBe(null);
  });
  
  test('should return error for password too short', () => {
    const result = validatePassword('Pass1!');
    expect(result).toBe('register.errors.Password must be at least 8 characters');
  });
  
  test('should return error for password without digit', () => {
    const result = validatePassword('Password!');
    expect(result).toBe('register.errors.Password must contain at least one digit');
  });
  
  test('should return error for password without uppercase', () => {
    const result = validatePassword('password1!');
    expect(result).toBe('register.errors.Password must contain at least one uppercase letter');
  });
  
  test('should return error for password without lowercase', () => {
    const result = validatePassword('PASSWORD1!');
    expect(result).toBe('register.errors.Password must contain at least one lowercase letter');
  });
  
  test('should return error for password without special character', () => {
    const result = validatePassword('Password1');
    expect(result).toBe('register.errors.Password must contain at least one special character');
  });
  
  test('should return error for password too long', () => {
    const longPassword = 'a'.repeat(21) + 'Password!';
    const result = validatePassword(longPassword);
    expect(result).toBe('register.errors.Password must be at most 20 characters');
  });
});

describe('validateName', () => {
  
  test('should return null for valid name', () => {
    const result = validateName('John');
    expect(result).toBe(null);
  });
  
  test('should return error for empty name', () => {
    const result = validateName('');
    expect(result).toBe('register.errors.Name cannot be empty');
  });
  
  test('should return error for name too long', () => {
    const result = validateName('a'.repeat(101));
    expect(result).toBe('register.errors.Name must be at most 100 characters');
  });
  
});

describe('validatePasswordMatch', () => {
  
  test('should return null when passwords match', () => {
    const result = validatePasswordMatch('Password1!', 'Password1!');
    expect(result).toBe(null);
  });
  
  test('should return error when passwords do not match', () => {
    const result = validatePasswordMatch('Password1!', 'Password2!');
    expect(result).toBe('register.errors.Passwords do not match');
  });
  
});
