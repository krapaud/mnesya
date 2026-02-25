/**
 * Modal showing a pairing code that the user can copy to share with a caregiver.
 * 
 * @module PairingCodeModal
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

/**
 * Props for the PairingCodeModal component.
 */
interface PairingCodeModalProps {
    /** Controls the visibility of the modal */
    visible: boolean;
    /** Callback triggered when modal closes */
    onClose: () => void;
    /** The pairing code to display (6 characters) */
    pairingCode: string;
    /** The expiration date of the pairing code */
    expiresAt: string | null;
    /** Callback triggered when code expires */
    onExpired?: () => void;
}

const PairingCodeModal: React.FC<PairingCodeModalProps> = ({
    visible,
    onClose,
    pairingCode,
    expiresAt,
    onExpired
}) => {
    const { t } = useTranslation();
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [hasExpired, setHasExpired] = useState(false);

    /**
     * Calculates and updates the time remaining until code expiration.
     * Updates every second.
     */
    useEffect(() => {
        if (!expiresAt || !visible) {
            return;
        }

        // Reset hasExpired when modal opens with new code
        setHasExpired(false);

        const updateTimeRemaining = () => {
            const now = new Date().getTime();
            const expiresTime = new Date(expiresAt).getTime();
            const difference = expiresTime - now;

            if (difference <= 0) {
                setTimeRemaining('00:00:00');
                if (!hasExpired && onExpired) {
                    setHasExpired(true);
                    onExpired();
                }
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setTimeRemaining(formattedTime);
        };

        // Initial update
        updateTimeRemaining();

        // Update every second
        const interval = setInterval(updateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, visible, hasExpired, onExpired]);

    /**
     * Copies the pairing code to clipboard and provides haptic feedback.
     */
    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(pairingCode);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header with back button and logo */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.appName}>Mnesya</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Main content */}
                <View style={styles.content}>
                    {/* Link icon */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="link-outline" size={48} color="#FFFFFF" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('pairingCode.title')}</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {t('pairingCode.description')}
                    </Text>

                    {/* Pairing code display */}
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeText}>{pairingCode}</Text>
                        
                        {/* Copy button */}
                        <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={handleCopyCode}
                        >
                            <Ionicons name="copy-outline" size={20} color="#4A90E2" />
                            <Text style={styles.copyButtonText}>{t('pairingCode.buttons.copyCode')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Expiration countdown */}
                    <View style={styles.expirationBox}>
                        <Ionicons name="time-outline" size={24} color="#FF6B6B" />
                        <Text style={styles.expirationLabel}>{t('pairingCode.expiresIn')}</Text>
                        <Text style={styles.expirationTime}>{timeRemaining || '00:00:00'}</Text>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#999999',
        textAlign: 'center',
        marginBottom: 50,
        paddingHorizontal: 20,
    },
    codeContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#D6EAFF',
    },
    codeText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4A90E2',
        letterSpacing: 8,
        marginBottom: 20,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    copyButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
    },
    expirationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        padding: 15,
        width: '100%',
        alignSelf: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    expirationLabel: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    expirationTime: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B6B',
        letterSpacing: 1,
    },
});

export default PairingCodeModal;
