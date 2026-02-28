/**
 * Generic modal picker for filter selection (profile, date, etc.).
 *
 * Displays a list of options in a bottom-sheet style modal.
 * The currently selected item is highlighted in blue.
 *
 * @module FilterPickerModal
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';

export interface FilterPickerItem {
    value: string;
    label: string;
}

interface FilterPickerModalProps {
    /** Controls visibility */
    visible: boolean;
    /** Modal title */
    title: string;
    /** List of selectable options */
    items: FilterPickerItem[];
    /** Currently selected value */
    selectedValue: string;
    /** Called when an item is selected (closes modal automatically) */
    onSelect: (value: string) => void;
    /** Called when the modal is closed without selecting */
    onClose: () => void;
}

const FilterPickerModal: React.FC<FilterPickerModalProps> = ({
    visible,
    title,
    items,
    selectedValue,
    onSelect,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.pickerItem,
                                    selectedValue === item.value && styles.pickerItemSelected,
                                ]}
                                onPress={() => { onSelect(item.value); onClose(); }}
                            >
                                <Text style={[
                                    styles.pickerItemText,
                                    selectedValue === item.value && styles.pickerItemTextSelected,
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>{t('common.buttons.Cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    pickerItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pickerItemSelected: {
        backgroundColor: '#E8F0FE',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333333',
    },
    pickerItemTextSelected: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    closeButton: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FilterPickerModal;
