/**
 * Unit tests for UpdateCaregiverProfileModal component
 *
 * Tests modal rendering, form validation, data submission,
 * and user interaction flows.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UpdateCaregiverProfileModal from '../UpdateCaregiverProfileModal';

// Mock i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
    validateName: jest.fn((value: string) => {
        if (!value || value.trim().length === 0) {
            return 'register.errors.Name cannot be empty';
        }
        if (value.length > 100) {
            return 'register.errors.Name must be at most 100 characters';
        }
        return '';
    }),
    validateEmail: jest.fn((value: string) => {
        if (!value || value.length < 5) {
            return 'register.errors.Email must be between 5 and 255 characters';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'register.errors.Invalid email';
        }
        return '';
    }),
}));

describe('UpdateCaregiverProfileModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();

    const defaultInitialData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render modal when visible is true', () => {
            const { getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByText('UserProfileDetail.modals.update.title')).toBeTruthy();
        });

        it('should not render modal content when visible is false', () => {
            const { queryByText } = render(
                <UpdateCaregiverProfileModal
                    visible={false}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(queryByText('UserProfileDetail.modals.update.title')).toBeNull();
        });

        it('should pre-fill form with initial data', () => {
            const { getByDisplayValue } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByDisplayValue('John')).toBeTruthy();
            expect(getByDisplayValue('Doe')).toBeTruthy();
            expect(getByDisplayValue('john.doe@example.com')).toBeTruthy();
        });

        it('should render all form fields', () => {
            const { getByText, getByPlaceholderText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByText('CreateProfile.fields.First Name')).toBeTruthy();
            expect(getByText('CreateProfile.fields.Last Name')).toBeTruthy();
            expect(getByText('register.fields.Email')).toBeTruthy();
            expect(
                getByPlaceholderText('CreateProfile.placeholders.Enter the profile First Name')
            ).toBeTruthy();
        });
    });

    describe('form validation', () => {
        it('should show error when first name is empty', async () => {
            const {
                getByDisplayValue,
                getByText,
                getByPlaceholderText: _getByPlaceholderText,
            } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('John');
            fireEvent.changeText(firstNameInput, '');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(getByText('register.errors.Name cannot be empty')).toBeTruthy();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should show error when email is invalid', async () => {
            const { getByDisplayValue, getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const emailInput = getByDisplayValue('john.doe@example.com');
            fireEvent.changeText(emailInput, 'invalid-email');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(getByText('register.errors.Invalid email')).toBeTruthy();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should validate all fields before submission', async () => {
            const { getByDisplayValue, getByText, getAllByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('John');
            const lastNameInput = getByDisplayValue('Doe');
            const emailInput = getByDisplayValue('john.doe@example.com');

            fireEvent.changeText(firstNameInput, '');
            fireEvent.changeText(lastNameInput, '');
            fireEvent.changeText(emailInput, 'bad');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                // Both name fields should show error
                const nameErrors = getAllByText('register.errors.Name cannot be empty');
                expect(nameErrors).toHaveLength(2);
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });
    });

    describe('form submission', () => {
        it('should call onSave with updated data when form is valid', async () => {
            mockOnSave.mockResolvedValue(undefined);

            const { getByDisplayValue, getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('John');
            const lastNameInput = getByDisplayValue('Doe');
            const emailInput = getByDisplayValue('john.doe@example.com');

            fireEvent.changeText(firstNameInput, 'Jane');
            fireEvent.changeText(lastNameInput, 'Smith');
            fireEvent.changeText(emailInput, 'jane.smith@example.com');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith({
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@example.com',
                });
            });

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should show loading state during submission', async () => {
            mockOnSave.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
            );

            const { getByText, getByTestId } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            // Should show loading indicator
            await waitFor(() => {
                expect(getByTestId('activity-indicator')).toBeTruthy();
            });
        });

        it('should handle save error gracefully', async () => {
            const mockError = new Error('Save failed');
            mockOnSave.mockRejectedValue(mockError);

            const { getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalled();
            });

            // Modal should remain open on error
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('should not submit while already updating', async () => {
            mockOnSave.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
            );

            const { getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const saveButton = getByText('UserProfileDetail.buttons.Save');

            // Press save multiple times rapidly
            fireEvent.press(saveButton);
            fireEvent.press(saveButton);
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('user interactions', () => {
        it('should call onClose when close button is pressed', () => {
            const { getByTestId } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const closeButton = getByTestId('close-button');
            fireEvent.press(closeButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should call onClose when cancel button is pressed', () => {
            const { getByText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const cancelButton = getByText('common.buttons.Cancel');
            fireEvent.press(cancelButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should update input values when user types', () => {
            const { getByDisplayValue } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('John');
            fireEvent.changeText(firstNameInput, 'Jane');

            expect(getByDisplayValue('Jane')).toBeTruthy();
        });
    });

    describe('edge cases', () => {
        it('should handle null initialData gracefully', () => {
            const { getByPlaceholderText } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={null}
                />
            );

            // Should render with empty fields
            expect(
                getByPlaceholderText('CreateProfile.placeholders.Enter the profile First Name')
            ).toBeTruthy();
        });

        it('should reset form when initialData changes', () => {
            const { getByDisplayValue, rerender } = render(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByDisplayValue('John')).toBeTruthy();

            const newData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            };

            rerender(
                <UpdateCaregiverProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={newData}
                />
            );

            expect(getByDisplayValue('Jane')).toBeTruthy();
            expect(getByDisplayValue('Smith')).toBeTruthy();
        });
    });
});
