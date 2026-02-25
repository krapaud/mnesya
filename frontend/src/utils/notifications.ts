/**
 * Utility functions for managing push notifications and reminders.
 * 
 * @module notifications
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

/** Requests push notification permissions and returns the token. */
export async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) {
    // Return undefined if not a physical device
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return undefined;
  }

  return 'granted';
}

/** Schedules a single notification at the given date. */
export async function scheduleReminderNotification(
  title: string,
  body: string,
  triggerDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<string> {
  if (!Device.isDevice) {
    throw new Error('Must use physical device for notifications');
  }

  // Check permissions
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Notification permissions not granted');
  }

  // Schedule the notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate
    }
  });

  return notificationId;
}

/** Cancels multiple notifications by their IDs. */
export async function cancelNotifications(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (_error) {
    }
  }
}

/**
 * Schedules 4 user notifications (0min, +2min, +5min, +10min)
 * plus a caregiver alert at +10min if no response.
 */
export async function scheduleReminderWithRepetitions(
  title: string,
  body: string,
  triggerDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<string[]> {
  if (!Device.isDevice) {
    throw new Error('Must use physical device for notifications');
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Notification permissions not granted');
  }

  // Delays in minutes for each user notification
  const delays = [0, 2, 5, 10];
  const notificationIds: string[] = [];

  // Schedule 4 notifications for the user
  for (let i = 0; i < delays.length; i++) {
    const delay = delays[i];
    const notificationDate = new Date(triggerDate.getTime() + delay * 60 * 1000);

    // Adapt title based on delay to attract attention
    let notificationTitle = title;
    if (delay === 2) {
      notificationTitle = i18n.t('notifications.repetitions.reminder', { title });
    } else if (delay === 5) {
      notificationTitle = i18n.t('notifications.repetitions.reminder', { title });
    } else if (delay === 10) {
      notificationTitle = i18n.t('notifications.repetitions.urgent', { title });
    }

    // Schedule user notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: body,
        sound: true,
        data: {
          ...data,
          repetitionIndex: i,
          isUserNotification: true
        }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate
      }
    });

    notificationIds.push(id);
  }

  // Schedule alert notification for caregiver (+10 min)
  const caregiverDate = new Date(triggerDate.getTime() + 10 * 60 * 1000);
  const profileName = data.profileName || i18n.t('notifications.caregiver.defaultUser');
  
  const caregiverId = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.caregiver.alert', { profileName }),
      body: i18n.t('notifications.caregiver.message', { title }),
      sound: true,
      data: {
        ...data,
        isCaregiverAlert: true,
        allNotificationIds: notificationIds
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: caregiverDate
    }
  });

  notificationIds.push(caregiverId);

  // Store IDs in AsyncStorage to be able to cancel them later
  const reminderId = data.reminderId?.toString() || Date.now().toString();
  await AsyncStorage.setItem(
    `notification_ids_${reminderId}`,
    JSON.stringify(notificationIds)
  );

  return notificationIds;
}
