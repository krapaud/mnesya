/**
 * Common styles shared across all application screens.
 * 
 * Contains ONLY truly shared components that are used identically across screens:
 * - Container and header elements
 * - Primary button (used consistently everywhere)
 * - Reminder card components (complete ecosystem)
 * - Empty message styling
 * 
 * All screen-specific styles (titles, forms, layouts) are now in local StyleSheets
 * to improve maintainability and clarity for learning purposes.
 * 
 * @module commonStyles
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
        width: 50,
        height: 50,
        marginRight: 0,
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
        color: '#666',
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
        color: '#666',
        textAlign: 'center',
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
        color: '#666',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
        fontStyle: 'italic',
    },
});
