/**
 * Hook for managing form field values, validation, and error states.
 *
 * @module useFormValidation
 */
import { useState, useCallback } from 'react';

export interface FieldConfig {
    validate?: (value: string) => string | null;
    initialValue?: string;
    required?: boolean;
    requiredMessage?: string;
}

export interface FormConfig {
    [fieldName: string]: FieldConfig;
}

export interface FormValues {
    [fieldName: string]: string;
}

export interface FormErrors {
    [fieldName: string]: string;
}

export interface ShowErrors {
    [fieldName: string]: boolean;
}

export interface UseFormValidationReturn {
    values: FormValues;
    errors: FormErrors;
    showErrors: ShowErrors;
    handleChange: (fieldName: string) => (value: string) => void;
    validateAll: () => boolean;
    resetErrors: () => void;
    setValue: (fieldName: string, value: string) => void;
    setError: (fieldName: string, error: string) => void;
}

export const useFormValidation = (config: FormConfig): UseFormValidationReturn => {
    // Initialize values from config
    const initialValues: FormValues = {};
    const initialErrors: FormErrors = {};
    const initialShowErrors: ShowErrors = {};

    Object.keys(config).forEach((fieldName) => {
        initialValues[fieldName] = config[fieldName].initialValue || '';
        initialErrors[fieldName] = '';
        initialShowErrors[fieldName] = false;
    });

    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>(initialErrors);
    const [showErrors, setShowErrors] = useState<ShowErrors>(initialShowErrors);

    const handleChange = useCallback(
        (fieldName: string) => {
            return (value: string) => {
                // Update value
                setValues((prev) => ({ ...prev, [fieldName]: value }));

                // Hide error indicator when user starts typing
                setShowErrors((prev) => ({ ...prev, [fieldName]: false }));

                // Validate field
                const fieldConfig = config[fieldName];
                if (fieldConfig.validate) {
                    const error = fieldConfig.validate(value);
                    setErrors((prev) => ({ ...prev, [fieldName]: error || '' }));
                }
            };
        },
        [config]
    );

    const validateAll = useCallback((): boolean => {
        let isValid = true;
        const newErrors: FormErrors = {};
        const newShowErrors: ShowErrors = {};

        Object.keys(config).forEach((fieldName) => {
            const fieldConfig = config[fieldName];
            const value = values[fieldName];
            let error: string | null = null;

            // Run custom validation if provided
            if (fieldConfig.validate) {
                error = fieldConfig.validate(value);
            }
            // Otherwise check if required field is empty (fallback for fields without custom validation)
            else if (fieldConfig.required !== false && !value.trim()) {
                error = fieldConfig.requiredMessage || 'register.errors.This field is required';
            }

            if (error) {
                newErrors[fieldName] = error;
                newShowErrors[fieldName] = true;
                isValid = false;
            } else {
                newErrors[fieldName] = '';
                newShowErrors[fieldName] = false;
            }
        });

        setErrors(newErrors);
        setShowErrors(newShowErrors);

        return isValid;
    }, [config, values]);

    /**
     * Resets all error states and visual indicators.
     */
    const resetErrors = useCallback(() => {
        const clearedErrors: FormErrors = {};
        const clearedShowErrors: ShowErrors = {};

        Object.keys(config).forEach((fieldName) => {
            clearedErrors[fieldName] = '';
            clearedShowErrors[fieldName] = false;
        });

        setErrors(clearedErrors);
        setShowErrors(clearedShowErrors);
    }, [config]);

    const setValue = useCallback((fieldName: string, value: string) => {
        setValues((prev) => ({ ...prev, [fieldName]: value }));
    }, []);

    const setError = useCallback((fieldName: string, error: string) => {
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
        setShowErrors((prev) => ({ ...prev, [fieldName]: true }));
    }, []);

    return {
        values,
        errors,
        showErrors,
        handleChange,
        validateAll,
        resetErrors,
        setValue,
        setError,
    };
};
