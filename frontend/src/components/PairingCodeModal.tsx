/**
 * Pairing Code Modal Component
 * 
 * Displays a full-screen modal showing a generated pairing code that users can share
 * to pair their devices. Includes copy functionality and expiration notice.
 * 
 * @module PairingCodeModal
 */

import React from 'react';
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
}

/**
 * Full-screen modal displaying a pairing code with copy functionality.
 * 
 * Shows a generated pairing code that can be shared with users to pair their devices.
 * Includes visual feedback, copy-to-clipboard feature, and expiration information.
 * 
 * @param props - Component properties
 * @returns Full-screen pairing code modal or null if not visible
 */
const PairingCodeModal: React.FC<PairingCodeModalProps> = ({
    visible,
    onClose,
    pairingCode
}) => {
    const { t } = useTranslation();

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

                    {/* Tip box */}
                    <View style={styles.tipBox}>
                        <Text style={styles.tipIcon}>💡</Text>
                        <Text style={styles.tipText}>
                            {t('pairingCode.tip')}
                        </Text>
                    </View>
                </View>

                {/* Done button at bottom */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.doneButton}
                        onPress={onClose}
                    >
                        <Text style={styles.doneButtonText}>{t('pairingCode.buttons.done')}</Text>
                    </TouchableOpacity>
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
        color: '#333',
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
        color: '#333',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#999',
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
        marginBottom: 30,
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
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F4FF',
        borderRadius: 12,
        padding: 15,
        width: '100%',
        gap: 10,
    },
    tipIcon: {
        fontSize: 20,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    doneButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PairingCodeModal;
