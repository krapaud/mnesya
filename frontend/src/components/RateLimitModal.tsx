/**
 * Modal displayed when the user has been rate-limited by the server (HTTP 429).
 *
 * Wraps ConfirmationModal with a pre-configured orange clock icon and a single OK button.
 * Used on LoginScreen and RegisterScreen.
 *
 * @module RateLimitModal
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ConfirmationModal';

interface RateLimitModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
}

const RateLimitModal: React.FC<RateLimitModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation();

    return (
        <ConfirmationModal
            visible={visible}
            onClose={onClose}
            title={t('common.errors.rateLimitTitle')}
            message={t('common.errors.rateLimitMessage')}
            icon="time-outline"
            iconColor="#FF9800"
            confirmText="OK"
            confirmColor="#4A90E2"
            showCancelButton={false}
        />
    );
};

export default RateLimitModal;
