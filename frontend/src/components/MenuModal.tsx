/**
 * Generic context menu overlay modal.
 *
 * Displays a list of action items anchored to the top-right of the screen,
 * typically triggered by a "three-dot" menu button in the header.
 *
 * @module MenuModal
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MenuAction {
    /** Label displayed for the action */
    label: string;
    /** Ionicons icon name */
    icon: keyof typeof Ionicons.glyphMap;
    /** Icon and text color (default: '#4A90E2') */
    color?: string;
    /** Callback when the action is pressed */
    onPress: () => void;
}

interface MenuModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the menu */
    onClose: () => void;
    /** List of actions to display */
    actions: MenuAction[];
    /** Top offset for the menu position (default: 110) */
    topOffset?: number;
}

const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose, actions, topOffset = 110 }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity
                style={[styles.overlay, { paddingTop: topOffset }]}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.menuContainer}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index < actions.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={() => {
                                onClose();
                                action.onPress();
                            }}
                        >
                            <Ionicons
                                name={action.icon}
                                size={20}
                                color={action.color ?? '#4A90E2'}
                            />
                            <Text
                                style={[styles.menuItemText, { color: action.color ?? '#4A90E2' }]}
                            >
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 200,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        gap: 10,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default MenuModal;
