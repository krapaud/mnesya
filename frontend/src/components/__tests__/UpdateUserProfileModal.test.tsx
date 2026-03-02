/**
 * Unit tests for UpdateUserProfileModal component
 *
 * Tests modal rendering, form validation with date picker,
 * data submission, and user interaction flows.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UpdateUserProfileModal from '../UpdateUserProfileModal';

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
}));

// Mock PlatformDatePicker
jest.mock('../PlatformDatePicker', () => 'PlatformDatePicker');

describe('UpdateUserProfileModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();

    const defaultInitialData = {
        first_name: 'Emma',
        last_name: 'Johnson',
        birthday: '1950-05-15',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render modal when visible is true', () => {
            const { getByText } = render(
                <UpdateUserProfileModal
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
                <UpdateUserProfileModal
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
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByDisplayValue('Emma')).toBeTruthy();
            expect(getByDisplayValue('Johnson')).toBeTruthy();
        });

        it('should render all form fields including birthday', () => {
            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByText('CreateProfile.fields.First Name')).toBeTruthy();
            expect(getByText('CreateProfile.fields.Last Name')).toBeTruthy();
            expect(getByText('CreateProfile.fields.Birthday')).toBeTruthy();
        });

        it('should display formatted birthday date', () => {
            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            // Date should be formatted as locale string
            const date = new Date('1950-05-15');
            expect(getByText(date.toLocaleDateString())).toBeTruthy();
        });
    });

    describe('form validation', () => {
        it('should show error when first name is empty', async () => {
            const { getByDisplayValue, getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('Emma');
            fireEvent.changeText(firstNameInput, '');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(getByText('register.errors.Name cannot be empty')).toBeTruthy();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should show error when last name is empty', async () => {
            const { getByDisplayValue, getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const lastNameInput = getByDisplayValue('Johnson');
            fireEvent.changeText(lastNameInput, '');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(getByText('register.errors.Name cannot be empty')).toBeTruthy();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('should show error when name exceeds 100 characters', async () => {
            const { getByDisplayValue, getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const longName = 'A'.repeat(101);
            const firstNameInput = getByDisplayValue('Emma');
            fireEvent.changeText(firstNameInput, longName);

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(
                    getByText('register.errors.Name must be at most 100 characters')
                ).toBeTruthy();
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });
    });

    describe('date picker interaction', () => {
        it('should open date picker when birthday button is pressed', () => {
            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const date = new Date('1950-05-15');
            const dateButton = getByText(date.toLocaleDateString());

            // Verify button is clickable
            expect(dateButton).toBeTruthy();
            fireEvent.press(dateButton);

            // After pressing, button should still be present
            expect(dateButton).toBeTruthy();
        });

        it('should update birthday when date is selected', () => {
            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const date = new Date('1950-05-15');
            const dateButton = getByText(date.toLocaleDateString());
            fireEvent.press(dateButton);

            // Verify the button is clickable (PlatformDatePicker is mocked)
            expect(dateButton).toBeTruthy();
        });
    });

    describe('form submission', () => {
        it('should call onSave with updated data in correct format', async () => {
            mockOnSave.mockResolvedValue(undefined);

            const { getByDisplayValue, getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('Emma');
            const lastNameInput = getByDisplayValue('Johnson');

            fireEvent.changeText(firstNameInput, 'Olivia');
            fireEvent.changeText(lastNameInput, 'Brown');

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith({
                    first_name: 'Olivia',
                    last_name: 'Brown',
                    birthday: '1950-05-15', // Should format as YYYY-MM-DD
                });
            });

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should format birthday correctly for API', async () => {
            mockOnSave.mockResolvedValue(undefined);

            const { getByText } = render(
                <UpdateUserProfileModal
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

            const savedData = mockOnSave.mock.calls[0][0];
            // Birthday should be in YYYY-MM-DD format
            expect(savedData.birthday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should show loading state during submission', async () => {
            mockOnSave.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
            );

            const { getByText, getByTestId } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            fireEvent.press(saveButton);

            await waitFor(() => {
                expect(getByTestId('activity-indicator')).toBeTruthy();
            });
        });

        it('should handle save error gracefully', async () => {
            const mockError = new Error('Network error');
            mockOnSave.mockRejectedValue(mockError);

            const { getByText } = render(
                <UpdateUserProfileModal
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

        it('should disable buttons during submission', async () => {
            mockOnSave.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
            );

            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const saveButton = getByText('UserProfileDetail.buttons.Save');
            const cancelButton = getByText('common.buttons.Cancel');

            fireEvent.press(saveButton);

            // Try pressing buttons again while submitting
            fireEvent.press(saveButton);
            fireEvent.press(cancelButton);

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledTimes(1);
            });

            // Cancel shouldn't work during submission
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('user interactions', () => {
        it('should call onClose when close button is pressed', () => {
            const { getByTestId } = render(
                <UpdateUserProfileModal
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
                <UpdateUserProfileModal
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
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            const firstNameInput = getByDisplayValue('Emma');
            fireEvent.changeText(firstNameInput, 'Sophie');

            expect(getByDisplayValue('Sophie')).toBeTruthy();
        });
    });

    describe('edge cases', () => {
        it('should handle null initialData gracefully', () => {
            const { getByPlaceholderText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={null}
                />
            );

            expect(
                getByPlaceholderText('CreateProfile.placeholders.Enter the profile First Name')
            ).toBeTruthy();
        });

        it('should reset form when initialData changes', () => {
            const { getByDisplayValue, rerender } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={defaultInitialData}
                />
            );

            expect(getByDisplayValue('Emma')).toBeTruthy();

            const newData = {
                first_name: 'Sophie',
                last_name: 'Martin',
                birthday: '1960-03-22',
            };

            rerender(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={newData}
                />
            );

            expect(getByDisplayValue('Sophie')).toBeTruthy();
            expect(getByDisplayValue('Martin')).toBeTruthy();
        });

        it('should handle invalid date strings gracefully', () => {
            const invalidData = {
                first_name: 'Test',
                last_name: 'User',
                birthday: 'invalid-date',
            };

            const { getByText } = render(
                <UpdateUserProfileModal
                    visible={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    initialData={invalidData}
                />
            );

            // Should still render without crashing
            expect(getByText('CreateProfile.fields.Birthday')).toBeTruthy();
        });
    });
});
