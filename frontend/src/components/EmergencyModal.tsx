/**
 * Modal displaying emergency phone numbers for the user's country.
 *
 * @module EmergencyModal
 */
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { getEmergencyNumbers, type ServiceCategory } from '../data/emergencyNumbers';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmergencyModalProps {
    visible: boolean;
    onClose: () => void;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
    medical: '#E53E3E',
    police:  '#2B6CB0',
    fire:    '#DD6B20',
    other:   '#6B46C1',
};

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentProps<typeof Ionicons>['name']> = {
    medical: 'medkit',
    police:  'shield',
    fire:    'flame',
    other:   'call',
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
    const { t, i18n } = useTranslation();
    const isFrench = i18n.language === 'fr';

    const regionCode = getLocales()[0]?.regionCode ?? null;
    const emergency = getEmergencyNumbers(regionCode);

    const countryName = isFrench ? emergency.countryNameFr : emergency.countryName;

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            accessibilityViewIsModal
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons
                            name="alert-circle"
                            size={28}
                            color="#E53E3E"
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                        />
                        <Text style={styles.title}>{t('emergency.title')}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel={t('common.buttons.Close')}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Country */}
                    <Text style={styles.countryLabel}>
                        {t('emergency.country')}:{' '}
                        <Text style={styles.countryName}>{countryName}</Text>
                    </Text>

                    {/* Numbers list */}
                    <ScrollView
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {emergency.services.map((service, index) => {
                            const color = CATEGORY_COLORS[service.category];
                            const icon = CATEGORY_ICONS[service.category];
                            const label = isFrench ? service.labelFr : service.label;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.serviceRow, { borderLeftColor: color, borderLeftWidth: 4 }]}
                                    onPress={() => handleCall(service.number)}
                                    activeOpacity={0.75}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${label} — ${service.number}`}
                                    accessibilityHint={t('emergency.callHint', { number: service.number })}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: color }]}>
                                        <Ionicons name={icon} size={18} color="#fff" accessibilityElementsHidden importantForAccessibility="no" />
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceLabel}>{label}</Text>
                                        <Text style={[styles.serviceNumber, { color }]}>{service.number}</Text>
                                    </View>
                                    <View style={[styles.callIconWrapper, { backgroundColor: color }]}>
                                        <Ionicons name="call" size={20} color="#fff" accessibilityElementsHidden importantForAccessibility="no" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.buttons.Close')}
                    >
                        <Text style={styles.closeBtnText}>{t('common.buttons.Close')}</Text>
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
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 32,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    title: {
        flex: 1,
        fontSize: 22,
        fontWeight: '700',
        color: '#1A202C',
    },
    closeButton: {
        padding: 6,
    },
    countryLabel: {
        fontSize: 15,
        color: '#666',
        marginBottom: 16,
    },
    countryName: {
        fontWeight: '700',
        color: '#1A202C',
    },
    list: {
        flexGrow: 0,
    },
    listContent: {
        gap: 10,
        paddingBottom: 8,
    },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    categoryIcon: {
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceLabel: {
        fontSize: 15,
        color: '#444',
        marginBottom: 2,
    },
    serviceNumber: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 1,
    },
    callIconWrapper: {
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        marginTop: 16,
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});

export default EmergencyModal;
