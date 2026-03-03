/**
 * Styles shared across multiple screens.
 *
 * @module commonStyles
 */
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
    // ============ CONTAINER STYLES ============
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#FFFFFF',
        padding: 20,
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
        marginLeft: -20,
    },
    headerSpacer: {
        width: 30,
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 5,
        paddingLeft: 0,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    ArrowIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 44,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    // ============ LOADING AND ERROR STATES ============
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },

    // ============ MODAL STYLES ============
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ============ FORM STYLES ============
    inputError: {
        borderWidth: 2,
        borderColor: '#FF0000',
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

    // ============ REMINDER CARD STYLES ============
    reminderCard: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 10,
        paddingHorizontal: 15,
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
        fontSize: 16,
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
    statusMissed: {
        color: '#E53935',
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
        fontSize: 16,
        color: '#666666',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginTop: 50,
        fontStyle: 'italic',
    },
});
