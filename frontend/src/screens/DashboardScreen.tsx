/**
 * Main screen for caregivers, showing the list of user profiles.
 *
 * @module DashboardScreen
 */
import React, { useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, CaregiverTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { useUserProfiles, useActivityLog } from '../hooks';
import { ActivityLogModal } from '../components';
import { calculateAge } from '../utils/dateUtils';

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Home'>,
    NativeStackScreenProps<RootStackParamList>
>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    // Load user profiles from API
    const { userData, loading, error, reload } = useUserProfiles();
    const isInitialLoading = loading && userData === null;
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Activity log
    const [showActivityLog, setShowActivityLog] = useState(false);
    const {
        entries: activityEntries,
        loading: activityLoading,
        error: activityError,
        reload: reloadActivity,
    } = useActivityLog();

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await reload();
        setIsRefreshing(false);
    }, [reload]);

    /** Controls the bottom fade indicator — hidden when scrolled to the end. */
    const [showScrollFade, setShowScrollFade] = useState(true);
    const [isScrollable, setIsScrollable] = useState(false);
    const scrollContainerHeight = useRef(0);

    const handleContentSizeChange = (_: number, contentHeight: number) => {
        setIsScrollable(contentHeight > scrollContainerHeight.current);
    };

    const handleScroll = (event: {
        nativeEvent: {
            contentOffset: { y: number };
            layoutMeasurement: { height: number };
            contentSize: { height: number };
        };
    }) => {
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 10;
        setShowScrollFade(!isAtBottom);
    };

    // Reload profiles when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    return (
        <View style={commonStyles.container}>
            {/* Header with app logo and name */}
            <View style={commonStyles.header}>
                <View style={commonStyles.headerSpacer} />
                <View style={commonStyles.headerCenter}>
                    <Image
                        source={require('../../assets/mnesya-logo.png')}
                        style={commonStyles.logo}
                    />
                    <Text style={commonStyles.appName}>Mnesya</Text>
                </View>
                <TouchableOpacity
                    style={styles.bellButton}
                    onPress={() => {
                        reloadActivity();
                        setShowActivityLog(true);
                    }}
                    accessibilityLabel={t('dashboard.activityLog.title')}
                >
                    <Ionicons name="notifications-outline" size={26} color="#333333" />
                </TouchableOpacity>
            </View>

            {/* Page title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('dashboard.title')}</Text>
            </View>

            <View style={styles.scrollContainer}>
                {/* Action buttons */}
                <TouchableOpacity
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateProfile');
                    }}
                >
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>
                        {t('dashboard.buttons.New profile')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateReminder', {});
                    }}
                >
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>
                        {t('common.buttons.New reminder')}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>{t('dashboard.profilesListTitle')}</Text>

                {/*
                 * Scrollable list of profile cards
                 * Each card displays user name, age, and a view button to access profile details
                 * listWrapper is always in the layout to avoid position jumps
                 */}
                <View style={styles.listWrapper}>
                    {/* Initial loading state — hidden during pull-to-refresh */}
                    {isInitialLoading ? (
                        <View style={commonStyles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={commonStyles.loadingText}>
                                {t('common.messages.loading')}
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={commonStyles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                            <Text style={commonStyles.errorText}>{t(error)}</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={styles.profilesList}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={handleRefresh}
                                />
                            }
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onLayout={(e) => {
                                scrollContainerHeight.current = e.nativeEvent.layout.height;
                            }}
                            onContentSizeChange={handleContentSizeChange}
                        >
                            {!userData || userData.length === 0 ? (
                                <Text style={styles.emptyMessage}>
                                    {t('dashboard.messages.No profiles yet')}
                                </Text>
                            ) : (
                                userData.map((profile) => (
                                    <View key={profile.id} style={styles.profileCard}>
                                        <View style={styles.profileInfo}>
                                            <View>
                                                <Text style={styles.textUser}>
                                                    {profile.first_name + ' ' + profile.last_name}
                                                </Text>
                                                <Text style={styles.textUserInfo}>
                                                    {calculateAge(profile.birthday)}{' '}
                                                    {t('common.units.years old')}
                                                </Text>
                                            </View>

                                            {/* View button with arrow icon */}
                                            <TouchableOpacity
                                                style={styles.viewButton}
                                                onPress={() => {
                                                    Haptics.impactAsync(
                                                        Haptics.ImpactFeedbackStyle.Light
                                                    );
                                                    navigation.navigate('UserProfileDetails', {
                                                        profileId: String(profile.id),
                                                    });
                                                }}
                                            >
                                                <Text style={styles.viewButtonText}>
                                                    {t('dashboard.buttons.View')}
                                                </Text>
                                                <Ionicons
                                                    name="arrow-forward"
                                                    size={20}
                                                    color="#4A90E2"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    )}
                    {/* Bottom fade — signals more content below */}
                    {!isInitialLoading && !error && showScrollFade && isScrollable && (
                        <View style={styles.scrollFade} pointerEvents="none">
                            <Ionicons name="chevron-down" size={24} color="#4A90E2" />
                        </View>
                    )}
                </View>
            </View>

            {/* Activity log modal */}
            <ActivityLogModal
                visible={showActivityLog}
                onClose={() => setShowActivityLog(false)}
                entries={activityEntries}
                loading={activityLoading}
                error={activityError}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    scrollContainer: {
        flex: 1,
        marginTop: 0,
        paddingBottom: 10,
    },

    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        marginTop: 20,
        fontWeight: 'bold',
    },

    // PROFILE CARDS
    textUser: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    textUserInfo: {
        fontSize: 16,
        color: '#666666',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginTop: 200,
        fontStyle: 'italic',
    },
    profileCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 1,
        marginTop: 10,
    },
    profileInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
        minHeight: 44,
        minWidth: 44,
    },
    viewButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        marginRight: 5,
    },
    profilesList: {
        flex: 1,
    },
    listWrapper: {
        flex: 1,
        position: 'relative',
    },
    scrollFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    bellButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DashboardScreen;
