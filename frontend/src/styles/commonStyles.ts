/**
 * Common Styles - Shared styles across all screens
 * Contains reusable style definitions for headers, buttons, forms, etc.
 */
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
    // ============ CONTAINER STYLES ============
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        width: '100%',
        paddingBottom: 10,
    },
    textPrimary: {
        fontSize: 20,
        marginTop: 20,
        fontWeight: 'bold',
    },

    // ============ HEADER STYLES ============
    header: {
        width: '100%',
        justifyContent: 'space-between',
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 30,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 10,
        paddingLeft: 10,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    ArrowIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 40,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    // ============ TITLE STYLES ============
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#999',
        marginBottom: 40,
    },

    // ============ FORM STYLES ============
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 5,
    },
    formsButton: {
        backgroundColor: '#F5F5F5',
        padding: 20,
        borderRadius: 20,
        marginBottom: 10,
        alignSelf: 'flex-start',
        width: '100%',
    },

    // ============ BUTTON STYLES ============
    primaryButton: {
        backgroundColor: '#4A90E2',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '100%',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    validateButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 20,
        alignSelf: 'center',
        width: '50%',
        marginBottom: 10,
    },
    validateButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
        alignSelf: 'center',
    },

    // ============ PICKER STYLES ============
    datePickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 5,
        marginTop: 5,
        paddingHorizontal: 20,
        height: 215,
    },
    timePickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 5,
        marginBottom: 5,
        paddingHorizontal: 20,
        height: 215,
    },
    pickerContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    pickerColumn: {
        flex: 1,
        marginRight: 10,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // ============ REMINDER CARD STYLES ============
    reminderCard: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 15,
        marginTop: 10,
    },
    reminderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reminderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusDone: {
        color: '#4CAF50',
    },
    statusPending: {
        color: '#FF9800',
    },
    statusPostponed: {
        color: '#2196F3',
    },
    statusUnable: {
        color: '#F44336',
    },
    reminderDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 50,
        fontStyle: 'italic',
    },
});
