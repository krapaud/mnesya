/**
 * Unit tests for useFormValidation hook (src/hooks/useFormValidation.ts).
 */

import { renderHook, act } from '@testing-library/react-native';
import { useFormValidation } from '../../hooks/useFormValidation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const requiredValidator = (value: string): string | null =>
    value.trim().length === 0 ? 'Field is required' : null;

const minLengthValidator =
    (min: number) =>
    (value: string): string | null =>
        value.length < min ? `Min ${min} chars` : null;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useFormValidation — initial state', () => {
    it('initialises with empty values by default', () => {
        const { result } = renderHook(() => useFormValidation({ name: {} }));
        expect(result.current.values.name).toBe('');
    });

    it('initialises with a provided initialValue', () => {
        const { result } = renderHook(() => useFormValidation({ name: { initialValue: 'Alice' } }));
        expect(result.current.values.name).toBe('Alice');
    });

    it('starts with no errors', () => {
        const { result } = renderHook(() =>
            useFormValidation({ email: { validate: requiredValidator } })
        );
        expect(result.current.errors.email).toBe('');
    });

    it('starts with showErrors set to false', () => {
        const { result } = renderHook(() =>
            useFormValidation({ email: { validate: requiredValidator } })
        );
        expect(result.current.showErrors.email).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// handleChange
// ---------------------------------------------------------------------------

describe('useFormValidation — handleChange', () => {
    it('updates the value of the targeted field', () => {
        const { result } = renderHook(() => useFormValidation({ email: {} }));
        act(() => {
            result.current.handleChange('email')('test@example.com');
        });
        expect(result.current.values.email).toBe('test@example.com');
    });

    it('sets an error when the field value is invalid', () => {
        const { result } = renderHook(() =>
            useFormValidation({ name: { validate: requiredValidator } })
        );
        act(() => {
            result.current.handleChange('name')('');
        });
        expect(result.current.errors.name).toBe('Field is required');
    });

    it('clears the error when the field value becomes valid', () => {
        const { result } = renderHook(() =>
            useFormValidation({ name: { validate: requiredValidator } })
        );
        // Trigger error
        act(() => {
            result.current.handleChange('name')('');
        });
        // Fix it
        act(() => {
            result.current.handleChange('name')('Alice');
        });
        expect(result.current.errors.name).toBe('');
    });

    it('hides the error indicator when the user starts typing', () => {
        const { result } = renderHook(() =>
            useFormValidation({ name: { validate: requiredValidator } })
        );
        // First call validateAll to show errors
        act(() => {
            result.current.validateAll();
        });
        // Then simulate user typing
        act(() => {
            result.current.handleChange('name')('A');
        });
        expect(result.current.showErrors.name).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// validateAll
// ---------------------------------------------------------------------------

describe('useFormValidation — validateAll', () => {
    it('returns true when all fields are valid', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                email: { validate: requiredValidator, initialValue: 'test@a.com' },
            })
        );
        let valid: boolean;
        act(() => {
            valid = result.current.validateAll();
        });
        expect(valid!).toBe(true);
    });

    it('returns false when at least one field is invalid', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                email: { validate: requiredValidator }, // starts empty
            })
        );
        let valid: boolean;
        act(() => {
            valid = result.current.validateAll();
        });
        expect(valid!).toBe(false);
    });

    it('shows errors for each invalid field', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                name: { validate: requiredValidator },
                email: { validate: requiredValidator },
            })
        );
        act(() => {
            result.current.validateAll();
        });
        expect(result.current.showErrors.name).toBe(true);
        expect(result.current.showErrors.email).toBe(true);
    });

    it('applies fallback required check for fields without a validate function', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                city: { required: true }, // no custom validate
            })
        );
        let valid: boolean;
        act(() => {
            valid = result.current.validateAll();
        });
        expect(valid!).toBe(false);
        expect(result.current.errors.city).not.toBe('');
    });

    it('marks valid fields as (showErrors = false) after validateAll', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                name: { validate: requiredValidator, initialValue: 'Alice' },
            })
        );
        act(() => {
            result.current.validateAll();
        });
        expect(result.current.showErrors.name).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// resetErrors
// ---------------------------------------------------------------------------

describe('useFormValidation — resetErrors', () => {
    it('clears all errors and showErrors flags', () => {
        const { result } = renderHook(() =>
            useFormValidation({ name: { validate: requiredValidator } })
        );
        // Trigger errors
        act(() => {
            result.current.validateAll();
        });
        // Reset
        act(() => {
            result.current.resetErrors();
        });
        expect(result.current.errors.name).toBe('');
        expect(result.current.showErrors.name).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// setValue
// ---------------------------------------------------------------------------

describe('useFormValidation — setValue', () => {
    it('sets the field value directly', () => {
        const { result } = renderHook(() => useFormValidation({ email: {} }));
        act(() => {
            result.current.setValue('email', 'prefilled@example.com');
        });
        expect(result.current.values.email).toBe('prefilled@example.com');
    });
});

// ---------------------------------------------------------------------------
// setError
// ---------------------------------------------------------------------------

describe('useFormValidation — setError', () => {
    it('sets an error message and shows the error indicator', () => {
        const { result } = renderHook(() => useFormValidation({ email: {} }));
        act(() => {
            result.current.setError('email', 'Email already taken');
        });
        expect(result.current.errors.email).toBe('Email already taken');
        expect(result.current.showErrors.email).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Multi-field form integration
// ---------------------------------------------------------------------------

describe('useFormValidation — multi-field integration', () => {
    const useRegistrationForm = () =>
        useFormValidation({
            firstname: { validate: requiredValidator },
            lastname: { validate: requiredValidator },
            email: { validate: requiredValidator },
            password: { validate: minLengthValidator(8) },
        });

    it('validates all fields independently', () => {
        const { result } = renderHook(useRegistrationForm);

        // Fill only some fields
        act(() => {
            result.current.handleChange('firstname')('Alice');
            result.current.handleChange('lastname')('Doe');
        });

        let valid: boolean;
        act(() => {
            valid = result.current.validateAll();
        });

        expect(valid!).toBe(false);
        expect(result.current.errors.email).not.toBe('');
        expect(result.current.errors.password).not.toBe('');
        // Valid fields should have no error
        expect(result.current.errors.firstname).toBe('');
        expect(result.current.errors.lastname).toBe('');
    });

    it('returns true when all fields are filled correctly', () => {
        const { result } = renderHook(useRegistrationForm);

        act(() => {
            result.current.handleChange('firstname')('Alice');
            result.current.handleChange('lastname')('Doe');
            result.current.handleChange('email')('alice@example.com');
            result.current.handleChange('password')('SecurePass1');
        });

        let valid: boolean;
        act(() => {
            valid = result.current.validateAll();
        });

        expect(valid!).toBe(true);
    });
});
