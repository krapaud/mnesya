/**
 * Modal shown when the user hits a free plan limit.
 * Presents premium benefits and an upgrade CTA.
 *
 * @module PremiumModal
 */
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { PlanFeature } from '../hooks/usePlan';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    /** The feature that triggered the limit, used to customise the message */
    feature: PlanFeature;
}

// ─── Benefits list ────────────────────────────────────────────────────────────

const BENEFITS: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; key: string }> = [
    { icon: 'people',          key: 'profiles' },
    { icon: 'repeat',          key: 'recurrence' },
    { icon: 'time-outline',    key: 'history' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose, feature }) => {
    const { t } = useTranslation();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            accessibilityViewIsModal
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.iconWrapper}>
                        <Ionicons name="star" size={36} color="#F6AD55" />
                    </View>

                    <Text style={styles.title}>{t('premium.title')}</Text>
                    <Text style={styles.subtitle}>{t(`premium.limitReached.${feature}`)}</Text>

                    {/* Benefits */}
                    <View style={styles.benefitsList}>
                        {BENEFITS.map((b) => (
                            <View key={b.key} style={styles.benefitRow}>
                                <Ionicons name={b.icon} size={20} color="#4A90E2" />
                                <Text style={styles.benefitText}>{t(`premium.benefits.${b.key}`)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel={t('premium.upgradeButton')}
                    >
                        <Ionicons name="star" size={18} color="#fff" />
                        <Text style={styles.upgradeBtnText}>{t('premium.upgradeButton')}</Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.buttons.Cancel')}
                    >
                        <Text style={styles.cancelBtnText}>{t('common.buttons.Cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    iconWrapper: {
        backgroundColor: '#FFFBEB',
        borderRadius: 40,
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 21,
    },
    benefitsList: {
        width: '100%',
        gap: 12,
        marginBottom: 28,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitText: {
        fontSize: 15,
        color: '#2D3748',
        flex: 1,
    },
    upgradeBtn: {
        backgroundColor: '#F6AD55',
        borderRadius: 12,
        paddingVertical: 14,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        color: '#999',
    },
});

export default PremiumModal;
