# Bug Reports & Technical Issues

## Backend Issues

### 1. Caregiver Authentication - Repository Column Reference Bug

**Date:** 18 February 2026  
**Component:** `backend/app/persistence/caregiver_repository.py`  
**Severity:** Critical - Blocking

#### Problem Description

I discovered a critical bug that prevented ALL caregiver login attempts from working. Every login attempt returned a 401 "Invalid email or password" error, even with correct credentials. This completely blocked access to the application and made it impossible to test any features.

#### Initial Symptoms

When I tried to log in with my test account (test@test.com / Test1234!), I got:
- 401 Unauthorized response
- Error message: "Invalid email or password"
- Backend logs showed: "❌ CAREGIVER NOT FOUND: test@test.com"

This was confusing because I had just created the account through the registration endpoint.

#### My Investigation Process

I systematically debugged each layer of the authentication flow:

1. **Frontend Token Storage**: I added logging to `tokenService.ts` to verify expo-secure-store was working correctly - ✅ It was
2. **Frontend API Calls**: I logged the exact credentials being sent in `authService.ts` - ✅ Correct data (email: 13 chars, password: "Test1234!" 9 chars)
3. **Backend Reception**: I added print statements in `authentication.py` login endpoint - ✅ Backend received correct credentials
4. **Password Hashing**: I ran a direct Python test with bcrypt.verify() - ✅ Hash verification returned True
5. **Database Check**: I queried PostgreSQL directly - ✅ Account existed with valid bcrypt hash ($2b$12$...)

At this point I knew:
- The credentials were correct
- The password hash was valid
- The account existed in the database
- But the backend kept saying "CAREGIVER NOT FOUND"

#### Root Cause Discovery

I isolated the issue to the **repository layer**. When I examined `caregiver_repository.py`, I found an inconsistency:

```python
# Line 32 - get_caregiver_by_email() - ❌ WRONG
caregiver = self.db.query(self.model).filter(
    self.model.email == email  # Using Python property instead of SQL column!
).first()

# Line 61 - email_exists() - ✅ CORRECT
exists = self.db.query(self.model).filter(
    self.model._email == email  # Using actual database column
).count() > 0
```

The bug: `self.model.email` is the **Python property** on the Caregiver model, but SQLAlchemy needs `self.model._email` to reference the actual **database column** in the WHERE clause.

#### Why This Happened

Looking at the Caregiver model definition:
- The database column is named `_email` (with underscore)
- There's a Python property `email` that provides access without the underscore
- For SQLAlchemy ORM queries, you must use the actual column name (`_email`)
- For Python object access, you use the property (`caregiver.email`)

I mixed up which one to use in the repository query.

#### The Fix

I changed line 32 in `caregiver_repository.py`:

```python
# Before (WRONG):
self.model.email == email

# After (CORRECT):
self.model._email == email
```

One character difference (adding the underscore) fixed the entire authentication system!

#### Impact

- **Severity**: Critical - No one could log in
- **Duration**: ~2 hours of debugging
- **Affected**: Every login attempt since implementing caregiver authentication
- **Root Cause**: Misunderstanding SQLAlchemy property vs column reference

#### What I Learned

1. **ORM Column Naming**: When a SQLAlchemy model uses a private column name (like `_email`) with a public property (like `email`), always use the private name in queries
2. **Consistency Checking**: Code inconsistencies (like `email_exists()` working but `get_caregiver_by_email()` failing) are red flags pointing to the exact bug location
3. **Systematic Debugging**: Adding logs at every layer (frontend → API → service → repository → database) helped isolate the issue quickly
4. **Direct Testing**: Testing Python functions directly (like bcrypt.verify()) helps eliminate possibilities and narrow down the problem
5. **Backend Logs**: Print statements in the API endpoint showed exactly what the backend received, proving the issue wasn't with data transmission

#### Prevention

To avoid this in the future:
- When writing repository methods, always check how other methods reference columns
- Use the database schema or model definition as reference for column names
- Test authentication immediately after implementing to catch this type of bug early
- Consider consistent naming patterns (either always use underscores or never use them)

---

## Frontend Issues

### 1. User Authentication - PIN Removal Decision

**Date:** 14 January 2026  
**Components:** `UserSetPINScreen.js`, `UserEnterPINScreen.js`, `UserPairingScreen.js`  
**Severity:** Design Decision / UX

#### Problem Description

I initially implemented a PIN code system for user authentication. After building it and thinking about our target users (elderly people with memory issues), I realized this was creating a problem. Asking them to remember a PIN code goes against the whole point of the app - helping with memory!

#### What I Discovered

While testing and reflecting on the design, I identified several issues:

1. **Cognitive Load**: It doesn't make sense to require users with memory problems to remember yet another PIN
2. **User Experience**: Adding authentication barriers for vulnerable users seemed counterproductive
3. **Device Compatibility**: Not all elderly users have devices with biometric options (fingerprint, Face ID)
4. **Security vs Usability**: The security benefit didn't justify making the app harder to use for this specific audience

#### My Decision

I decided to remove PIN authentication from the user flow entirely.

**Updated User Flow:**

- Welcome Screen → User Pairing (enter code) → **User Home** (direct access)
- Removed: UserSetPINScreen and UserEnterPINScreen from active navigation

#### How I Implemented It

- I kept the PIN screens code in the project (didn't delete them) in case we need them later
- Updated navigation in `UserPairingScreen.js` to redirect to `UserHome` instead of `UserSetPin`
- Moved screens to archives for potential future use

#### Security Justification

I learned that the app still maintains adequate security without requiring an in-app PIN:

1. **Device-Level Security**: Modern smartphones already have built-in authentication (PIN, pattern, biometric)
2. **Pairing Code System**: Users need a valid pairing code from their caregiver to access the app
3. **Data Sensitivity**: The app only stores reminder notifications, not sensitive health data
4. **Backend Security** (when implemented): Caregiver authentication, API tokens, HTTPS encryption will provide additional layers

#### What I'd Do Differently

If authentication becomes necessary in the future, I would:

- Make it **optional** (let caregivers decide)
- Consider **visual patterns** (easier for elderly users than remembering numbers)
- Implement **biometric authentication** as the primary method
- Keep PIN as fallback only

---

### 2. CreateReminderScreen - Dual Picker Simultaneous Display

**Date:** January 2026  
**Component:** `CreateReminderScreen.tsx`  
**Severity:** Medium

#### Description

While implementing date and time selection, I encountered a weird UI bug where both pickers could be open at the same time, which looked messy and confusing.

#### My Initial Code

```typescript
// Problem: Both pickers could open at the same time
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>Date</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => setShowTimePicker(true)}>
  <Text>Time</Text>
</TouchableOpacity>
```

#### Root Cause Analysis

I analyzed the issue and realized:

- Each button was independently setting its own picker state to `true`
- I hadn't implemented any mutual exclusion logic between the two pickers
- Both state variables could be `true` at the same time, so both pickers would render

#### How I Fixed It

I created dedicated functions that explicitly close one picker when opening the other:

```typescript
/**
 * Opens the date picker and closes the time picker
 */
const openDatePicker = () => {
    setShowDatePicker(true);
    setShowTimePicker(false);
};

/**
 * Opens the time picker and closes the date picker
 */
const openTimePicker = () => {
    setShowTimePicker(true);
    setShowDatePicker(false);
};
```

#### Result

Now the behavior is exactly what I wanted:

- User clicks "Date" → Date picker opens, time picker closes
- User clicks "Time" → Time picker opens, date picker closes
- Only one picker visible at a time
- Clean, predictable user experience

#### Lesson Learned

I used the same pattern in `CreateProfileScreen.tsx` for birthday selection since it worked so well.

---

### 3. Profile Data Structure - firstName/lastName Migration

**Date:** 25 January 2026  
**Component:** `interfaces.ts`, `fakeData.ts`, multiple screens  
**Severity:** High

#### Description (Data Structure)

I ran into a problem with how I structured profile data. I was using a single `name` field with the full name as one string (like "Marie Dupont"). This became an issue when I needed to display just the first name for the greeting ("Hello Marie!").

#### Root Cause (Data Structure)

Looking at my original design:

- My `ProfileItem` interface had: `name: string` (e.g., "Marie Dupont")
- Screens needed to extract just the first name from the full string
- I realized there's no consistent way to split names - what about compound names, hyphens, or multiple last names?

#### How I Fixed It (Data Structure)

I migrated to separated name fields:

```typescript
// Before
export interface ProfileItem {
  id: number;
  name: string;
  age: number;
}

// After
export interface ProfileItem {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}
```

#### Files I Had to Update

1. **interfaces.ts** - Updated the ProfileItem interface
2. **fakeData.ts** - Updated all test profiles to use firstName/lastName
3. **UserHomeScreen.tsx** - Now uses `currentUser?.firstName` for the greeting
4. **UserProfileDetailScreen.tsx** - Updated to display `${profile.firstName} ${profile.lastName}`
5. **DashboardScreen.tsx** - Cleaned up imports
6. **CreateReminderScreen.tsx** - Updated to use the new structure

#### What I Learned

This refactoring taught me several benefits:

- Clean, semantic data structure is easier to work with
- Easy to display first name only when needed
- Consistent with backend conventions (better for API integration)
- Better support for internationalization

---

### 4. RemindersListScreen - Date/Time Pickers Mutual Exclusion

**Date:** 25 January 2026  
**Component:** `RemindersListScreen.tsx`  
**Severity:** Medium

#### Description (Pickers)

I encountered the same picker issue again in the filters section! Both date pickers (start date and end date) could open at the same time, causing UI overlap and confusion.

#### How I Fixed It (Pickers)

Since I had already solved this in CreateReminderScreen (Bug #2), I applied the same mutual exclusion pattern:

```typescript
const openStartDatePicker = () => {
    setShowStartDatePicker(true);
    setShowEndDatePicker(false);
};

const openEndDatePicker = () => {
    setShowEndDatePicker(true);
    setShowStartDatePicker(false);
};
```

#### Outcome

It worked perfectly - only one date picker visible at a time, clean filter UX. I'm getting better at recognizing these patterns!

---

### 5. RemindersListScreen - Reset Button Visibility

**Date:** 25 January 2026  
**Component:** `RemindersListScreen.tsx`  
**Severity:** Low

#### Description (Button)

I needed the Reset button to be always visible but only enabled when filters were actually active.

#### My Initial Approach

At first, I considered using conditional rendering based on filter state (show/hide the button).

#### What I Actually Did

But then I realized it's better UX to always show the button and just disable it visually:

```typescript
<TouchableOpacity 
    style={[
        styles.resetButton, 
        !hasActiveFilters && styles.resetButtonDisabled
    ]}
    disabled={!hasActiveFilters}
    onPress={resetFilters}
>
```

#### Why This Approach Is Better

- Button always present = consistent UI layout (no jumping elements)
- Visual feedback with opacity 0.5 when disabled (user knows it's there but inactive)
- Prevents accidental resets when no filters are active

---

### 6. CreateReminderScreen - Profile Selection Type Mismatch

**Date:** 25 January 2026  
**Component:** `CreateReminderScreen.tsx`  
**Severity:** Medium

#### Description (Type)

I ran into a TypeScript error - I had a type mismatch between my `selectedProfile` state (string) and `profile.id` (number). The comparison wasn't working correctly.

#### My Buggy Code (Type)

```typescript
const [selectedProfile, setSelectedProfile] = useState<string>('');

// Later comparison
profile.id === selectedProfile // number === string (type mismatch!)
```

#### How I Fixed It (Type)

I decided to convert profile IDs to strings for consistency:

```typescript
const [selectedProfile, setSelectedProfile] = useState<string>('');

// Comparison
profile.id.toString() === selectedProfile // string === string (works!)
```

#### Why I Chose This Solution

I learned that:

- Picker values in React Native are always strings
- Converting number → string is cleaner than string → number (and safer)
- No risk of `NaN` or `parseInt` errors
- This approach is consistent with React Native picker conventions

---

### 7. CreateReminderScreen - Profile Name Display Formatting

**Date:** 25 January 2026  
**Component:** `CreateReminderScreen.tsx`  
**Severity:** Low

#### Description (Formatting)

I noticed profile names were displaying on two lines in the picker, which looked broken. Took me a while to figure out why!

#### What I Found (Formatting)

The problem was in my template string formatting:

```typescript
// Code with newline in template string
label={`${profile.firstName} 
        ${profile.lastName}`}
// Resulted in visual break on screen
```

#### How I Fixed It (Formatting)

I created an intermediate variable to avoid the newline in my template:

```typescript
const selectedProfileData = fakeProfiles.find(p => p.id.toString() === selectedProfile);
// Later use clean template
<Text>{selectedProfileData.firstName} {selectedProfileData.lastName}</Text>
```

#### Important Lesson

I learned that template strings preserve ALL whitespace, including newlines from code formatting. So even though the newline was just for code readability, it actually appeared in the rendered text!

---

### 8. ReminderNotificationScreen - Message Text Overflow

**Date:** 25 January 2026  
**Component:** `ReminderNotificationScreen.tsx`  
**Severity:** Medium

#### Description (Text Overflow)

I had a frustrating layout bug where long reminder messages (more than 3 lines) were pushing down the action buttons. The layout kept shifting depending on message length, which looked really unprofessional. Just setting `numberOfLines={4}` wasn't enough to fix it.

#### What I Discovered (Analysis)

After debugging, I learned that:

- The `Text` component with `numberOfLines` limits visible lines but doesn't reserve vertical space
- Without a fixed height, longer messages expanded the container, pushing buttons down
- Default `lineHeight` calculation varied, making 4 lines overflow the space I thought they'd take

#### How I Solved It (Text Overflow)

I applied a fixed height and explicit line height to the message text style:

```typescript
reminderMessage: {
    fontSize: 18,
    height: 100,           // Fixed height for 4 lines
    lineHeight: 24,        // Explicit line spacing (18px * 1.33)
    numberOfLines: 4,      // Max 4 lines visible
    ellipsizeMode: 'tail', // Show "..." if text overflows
}
```

#### Constraints I Established

Through testing, I determined:

- **Maximum message length:** 120 characters
- **Display capacity:** ~125 characters before ellipsis appears
- **Visual lines:** 4 lines maximum
- **Height allocation:** 100px

#### Note for Backend Integration

I documented this for the backend team:

```typescript
// Recommended backend validation
message: {
    type: String,
    required: true,
    maxLength: 120  // Frontend display limit
}
```

#### How I Tested It

I tested with different message lengths:

- Short messages (less than 30 chars): Display correctly without shifting
- Medium messages (30-90 chars): Fill 2-3 lines, no layout shift
- Long messages (90-125 chars): Fill 4 lines, show complete text
- Extra-long messages (greater than 125 chars): Show ellipsis after 4 lines

Everything works perfectly now!

---

### 9. Internationalization (i18n) - French/English Support

**Date:** 5 February 2026  
**Components:** `i18n.ts`, `locales/fr.json`, `locales/en.json`, 21 files modified  
**Severity:** Enhancement / Feature

#### Description (i18n Implementation)

I realized the app was entirely in English, but my target users (elderly people in France) would need French as their primary language. I decided to implement internationalization (i18n) to support both French and English.

#### What I Discovered (Research)

While researching i18n solutions for React Native, I learned:

- **react-i18next** is the standard library for React/React Native projects
- It integrates well with TypeScript and provides type safety
- I needed to structure translations by feature/screen for maintainability
- The library handles language detection, fallbacks, and dynamic switching automatically

#### How I Implemented It (Step-by-Step)

**1. Installation & Setup**

I installed the necessary packages:
```bash
npm install i18next react-i18next
```

**2. Created Configuration File (i18n.ts)**

I set up the i18n configuration with French as default:

```typescript
/**
 * Internationalization (i18n) configuration using i18next
 * 
 * Supports French (default) and English languages.
 * Translation files are located in src/locales/
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: 'fr',              // Default language: French
    fallbackLng: 'en',       // Fallback if French fails
    interpolation: {
      escapeValue: false     // React already escapes values
    }
  });

export default i18n;
```

**3. Created Translation Files**

I created structured JSON files for both languages:

- `frontend/src/locales/fr.json` (173 lines)
- `frontend/src/locales/en.json` (173 lines)

I organized translations by feature:
```json
{
  "common": {
    "appName": "Mnesya",
    "yes": "Oui",
    "no": "Non"
  },
  "welcome": {
    "title": "Bienvenue sur Mnesya",
    "subtitle": "Votre assistant de mémoire personnel"
  },
  "tabs": {
    "dashboard": "Tableau de bord",
    "profiles": "Profils"
  }
}
```

**4. Integrated i18n into App.tsx**

I imported and initialized i18n at the app entry point:

```typescript
import './i18n'; // Initialize i18n before rendering

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

**5. Updated All Screens (13 files)**

I replaced hardcoded strings with translation keys in every screen:

```typescript
// Before
<Text>Bienvenue sur Mnesya</Text>

// After
import { useTranslation } from 'react-i18next';

const WelcomeScreen = () => {
  const { t } = useTranslation();
  
  return <Text>{t('welcome.title')}</Text>;
};
```

**Files I Updated:**
- WelcomeScreen.tsx
- LoginScreen.tsx
- RegisterScreen.tsx
- DashboardScreen.tsx
- CreateProfileScreen.tsx
- CreateReminderScreen.tsx
- UserPairingScreen.tsx
- UserHomeScreen.tsx
- UserProfileScreen.tsx
- UserProfileDetailScreen.tsx
- RemindersListScreen.tsx
- ReminderNotificationScreen.tsx
- Navigation files (UserTabs.tsx, CaregiverTabs.tsx)
- Components (PlatformProfilePicker.tsx)

#### Result (What Works Now)

The entire application now supports bilingual functionality:

- ✅ **13 screens** fully translated (FR/EN)
- ✅ **Navigation tabs** translated
- ✅ **Form labels** and buttons translated
- ✅ **Error messages** and placeholders translated
- ✅ **French as default** (primary user base)
- ✅ **English fallback** (for international users)
- ✅ **Type-safe translations** (TypeScript integration)
- ✅ **Consistent structure** (organized by feature)

#### Technical Decisions I Made

**1. Why French as Default:**
- Primary users are French-speaking elderly people
- Better user experience for target audience
- English remains available as fallback

**2. Translation Structure:**
- Grouped by feature (welcome, login, dashboard, etc.)
- Common keys for shared UI elements
- Hierarchical organization (easy to maintain)

**3. JSDoc Documentation:**
- Added professional documentation to i18n.ts
- Explained configuration choices
- Included usage examples

#### What I Learned (Best Practices)

This implementation taught me several important lessons:

1. **Plan Early**: i18n is easier to implement early than retrofit later
2. **Consistent Keys**: Using dot notation (e.g., `welcome.title`) keeps translations organized
3. **Avoid Hardcoding**: Never put text directly in JSX - always use translation keys
4. **Test Both Languages**: I verified every screen in both FR and EN
5. **Documentation Matters**: JSDoc helps others understand the i18n setup

#### Future Improvements

If I add more features, I'll need to:
- Add new translation keys to both fr.json and en.json
- Consider adding language switcher in Settings (currently defaults to French)
- Test with real elderly users to validate French translations are clear and simple

#### Git Integration

I committed this feature professionally:
- **Branch**: `front/feature/trads`
- **Commit**: "feat: implement i18n support (French/English)"
- **Files changed**: 21 files (3 new, 18 modified)
- **Merged to**: `dev` branch via squash merge

---

### 10. Notification System - Repetitions with Caregiver Alerts

**Date:** 9 February 2026  
**Components:** `App.tsx`, `notifications.ts`, `CreateReminderScreen.tsx`, `locales/fr.json`, `locales/en.json`  
**Severity:** Enhancement / Feature

#### Description (Notification System)

I implemented the basic notification system using `expo-notifications`, but I discovered a critical problem: elderly users might forget to click on notifications or dismiss them by accident. I needed a way to ensure they don't miss important reminders, and caregivers need to be alerted when users don't respond.

#### What I Discovered (User Behavior Research)

After thinking about the target users, I identified several risks:

- **Notification Dismissal**: Users might swipe away notifications without reading them
- **Forgetfulness**: Even after seeing a notification, users might forget to act on it
- **No Feedback Loop**: Caregivers have no way to know if users responded to reminders
- **Single Point of Failure**: One missed notification = missed medication or important task

I researched notification best practices for elderly users and learned:
- **Repetition is key**: Multiple gentle reminders work better than a single alert
- **Progressive urgency**: Starting subtle and increasing urgency helps without being annoying
- **Caregiver integration**: Family members need visibility into user responses

#### How I Implemented It (Step-by-Step)

**1. Notification Repetition System**

I created a repetition system with 4 user notifications at strategic intervals:

```typescript
// Delays in minutes for each user notification
const delays = [0, 2, 5, 10];

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
}
```

**Rationale Behind Timing:**
- **0 min**: Initial notification at scheduled time
- **+2 min**: Quick reminder if user didn't respond immediately
- **+5 min**: Second reminder (halfway to urgent threshold)
- **+10 min**: Final urgent notification with emoji escalation (🔔 URGENT)

**2. Caregiver Alert Notification**

I added a 5th notification specifically for caregivers when users don't respond:

```typescript
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
```

**Why +10 minutes:**
- Gives user enough time to respond to 4 user notifications
- Alerts caregiver before it's too late to intervene
- Same time as final urgent notification (unified escalation point)

**3. Auto-Cancellation System**

I realized sending all 5 notifications even after the user responds would be annoying spam. I implemented auto-cancellation using AsyncStorage:

```typescript
// Store IDs in AsyncStorage to be able to cancel them later
const reminderId = data.reminderId?.toString() || Date.now().toString();
await AsyncStorage.setItem(
  `notification_ids_${reminderId}`,
  JSON.stringify(notificationIds)
);
```

Then in App.tsx, I added the cancellation logic:

```typescript
// If it's a user notification, cancel all other remaining notifications
if (data.isUserNotification && data.reminderId) {
  try {
    const storageKey = `notification_ids_${reminderId}`;
    const storedIds = await AsyncStorage.getItem(storageKey);
    
    if (storedIds) {
      const notificationIds = JSON.parse(storedIds) as string[];
      await cancelNotifications(notificationIds);
      await AsyncStorage.removeItem(storageKey);
      console.log(`Cancelled ${notificationIds.length} remaining notifications`);
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}
```

**4. Smart Navigation**

I implemented conditional navigation to prevent caregivers from being sent to the reminder screen:

```typescript
// Navigate to ReminderNotificationScreen with notification data
if (navigationRef.current && data && !data.isCaregiverAlert) {
  navigationRef.current.navigate('ReminderNotification', {
    reminderId: data.reminderId,
    message: data.message,
    profileId: data.profileId,
  });
}
```

**5. Data Flags for Notification Types**

I added boolean flags to distinguish notification types:

- `isUserNotification: true` - For the 4 user notifications
- `isCaregiverAlert: true` - For the caregiver notification

This allows conditional logic for cancellation and navigation.

**6. Translation Integration**

I added notification-specific translations to maintain bilingual support:

```json
// fr.json
"notifications": {
  "repetitions": {
    "reminder": "⏰ RAPPEL: {{title}}",
    "urgent": "🔔 URGENT: {{title}}"
  },
  "caregiver": {
    "alert": "⚠️ {{profileName}} n'a pas répondu au rappel",
    "message": "Aucune action effectuée pour: {{title}}",
    "defaultUser": "L'utilisateur"
  }
}

// en.json
"notifications": {
  "repetitions": {
    "reminder": "⏰ REMINDER: {{title}}",
    "urgent": "🔔 URGENT: {{title}}"
  },
  "caregiver": {
    "alert": "⚠️ {{profileName}} did not respond to the reminder",
    "message": "No action taken for: {{title}}",
    "defaultUser": "User"
  }
}
```

**7. Alert Messages Translation**

I updated all Alert.alert() calls in CreateReminderScreen.tsx to use i18n:

```typescript
// Before
Alert.alert('Erreur', 'Veuillez sélectionner un profil');

// After
Alert.alert(t('CreateReminder.errors.title'), t('CreateReminder.errors.Please select a profile'));
```

#### Result (What Works Now)

The notification system now provides comprehensive reminder management:

- ✅ **4 user notifications** with progressive urgency (0, +2, +5, +10 min)
- ✅ **1 caregiver alert** when user doesn't respond (+10 min)
- ✅ **Auto-cancellation** when user clicks any notification
- ✅ **Smart navigation** (only user notifications navigate to screen)
- ✅ **Persistent storage** (AsyncStorage for notification IDs)
- ✅ **Bilingual support** (FR/EN translations with interpolation)
- ✅ **Professional UI messages** (all alerts use i18n)
- ✅ **Clean codebase** (all comments in English)

#### Technical Decisions I Made

**1. Why 4 Repetitions:**
- Research shows elderly users respond better to gentle persistence
- 10-minute window is long enough without being excessive
- Progressive urgency (calm → reminder → urgent) respects user's attention

**2. Why AsyncStorage for IDs:**
- Notifications are scheduled asynchronously by the OS
- IDs must persist across app sessions
- AsyncStorage provides reliable key-value storage for retrieval

**3. Why Separate Caregiver Notification:**
- Caregivers don't need to see the reminder content screen
- Alert should be non-intrusive but informative
- Allows different handling logic than user notifications

**4. Why Auto-Cancel All Notifications:**
- Prevents spam after user responds
- Shows respect for user's attention
- Improves overall app experience

#### What I Learned (Best Practices)

This implementation taught me several important lessons:

1. **User-Centered Design**: Always think about actual user behavior, not ideal scenarios
2. **Data Persistence**: Notification IDs need storage for later cancellation
3. **Conditional Logic**: Use data flags (isUserNotification) for different notification types
4. **Progressive Urgency**: Start gentle, increase urgency gradually
5. **Feedback Loops**: Caregivers need visibility into user actions
6. **Clean Code**: All internal messages (console.log, errors) should be in English
7. **Professional UI**: User-facing messages should use i18n for consistency

#### Testing Results

I tested the complete flow on a physical device:

**Test 1: Auto-Cancellation**
- Created reminder for 2 minutes from now
- Clicked on 1st notification
- ✅ Result: All 5 remaining notifications were cancelled

**Test 2: Full Notification Flow**
- Created reminder
- Did NOT click any notification
- ✅ Result: Received all 5 notifications (4 user + 1 caregiver)
- ✅ Caregiver notification showed profile name correctly
- ✅ Clicking caregiver notification did NOT navigate to reminder screen

**Test 3: Translation Verification**
- Tested in French (default language)
- ✅ All notification titles displayed correctly
- ✅ Interpolation worked ({{title}}, {{profileName}})

#### Known Limitations

I discovered Expo Go has some notification limitations:

```
`expo-notifications` functionality is not fully supported in Expo Go
We recommend you instead use a development build
```

**What This Means:**
- Basic scheduling, cancellation, and navigation work fine in Expo Go
- Advanced features may have limitations
- Production builds (APK/IPA) will have full functionality

**My Decision:**
- Keep using Expo Go for development (works well enough)
- Plan to create production build with `eas build` before deployment

#### Future Improvements

If I continue developing this feature, I would add:

**Option 2: Manual Cancellation**
- When caregiver deletes a reminder, cancel its scheduled notifications
- Already have `cancelNotifications()` function, just need UI integration

**Option 3: Badge Count**
- Show number of unread notifications on app icon
- Set `shouldSetBadge: true` in notification handler

**Option 4: Notification History**
- Track which notifications user responded to
- Analytics for caregivers to see response patterns

#### Git Integration

I committed this feature professionally:
- **Branch**: `front/feature/notifs`
- **Commit**: "feat: implement notification repetitions with caregiver alerts and auto-cancellation"
- **Files changed**: 5 files modified
- **TODO**: Merge to `dev` branch after documentation complete

---

### 10. Bottom Tab Navigation - Android System Buttons Overlap

**Date:** 10 February 2026  
**Components:** `CaregiverTabs.tsx`, `UserTabs.tsx`  
**Severity:** High (Android-specific UX issue)

#### Problem Description

I discovered that on Android devices, the bottom tab navigation was overlapping with the system navigation buttons (back, home, recent apps). This made the tabs partially inaccessible and created a poor user experience on Android.

#### What I Discovered

When I tested the app on an Android device, I noticed:

1. **Visual Overlap**: The bottom tabs were positioned behind the Android system navigation bar
2. **Fixed Height Issue**: My tabs had a fixed height of 70px with fixed padding (10px bottom, 5px top)
3. **No Safe Area Handling**: I wasn't accounting for the device's safe area insets on Android
4. **iOS vs Android Difference**: The issue was specific to Android because iOS handles safe areas differently

#### Root Cause Analysis

In both navigation files, I had:

```tsx
tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
},
```

This fixed-height approach didn't adapt to different Android devices with varying system UI heights.

#### How I Fixed It

I implemented dynamic safe area handling using `useSafeAreaInsets` from `react-native-safe-area-context`:

**Step 1: Import the hook**
```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

**Step 2: Use insets in the component**
```tsx
const CaregiverTabs: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            screenOptions={{
                // ... other options
                tabBarStyle: {
                    height: 70 + insets.bottom,
                    paddingBottom: insets.bottom + 10,
                    paddingTop: 5,
                },
                // ... other styles
            }}
        >
```

**What This Does:**
- `insets.bottom` provides the height of the Android system UI at the bottom
- Height dynamically adjusts: `70 + insets.bottom`
- Padding adjusts: `insets.bottom + 10` (keeps 10px visual padding above system UI)
- On devices without system UI, `insets.bottom` is 0, so it works normally

#### Files Modified

1. `/frontend/src/navigation/CaregiverTabs.tsx`
2. `/frontend/src/navigation/UserTabs.tsx`

Both files received the same fix since they both use bottom tab navigation.

#### What I Learned

This bug taught me several important lessons:

1. **Platform Differences**: iOS and Android handle safe areas differently - always test on both
2. **Safe Area Context**: The `react-native-safe-area-context` library is essential for cross-platform apps
3. **Dynamic Layouts**: Never use fixed heights for UI elements that interact with system UI
4. **Accessibility**: System navigation buttons are critical for Android users - blocking them breaks the entire UX

#### Testing Approach

To verify the fix worked:

1. ✅ Tested on Android device with gesture navigation (newer style)
2. ✅ Tested on Android device with button navigation (3-button style)
3. ✅ Verified tabs remain accessible and don't overlap
4. ✅ Checked that iOS behavior wasn't negatively affected

#### Future Considerations

If I encounter similar layout issues in the future, I should:

- Always consider safe areas from the start of development
- Use `SafeAreaView` or `useSafeAreaInsets` for edge-positioned UI elements
- Test early on physical devices, not just simulators
- Remember that Android has more device variety than iOS

---

### 11. PlatformTimePicker - Duplicate React Keys in Infinite Scroll

**Date:** 11 February 2026  
**Component:** `PlatformTimePicker.tsx`  
**Severity:** High (Console Errors / Performance)

#### Problem Description

After implementing the infinite scroll feature for the time picker (iOS-style looping), I encountered hundreds of React warnings about duplicate keys. The console was flooded with errors like:

```
ERROR  Encountered two children with the same key, `%s`. Keys should be unique 
so that components maintain their identity across updates. Non-unique keys may 
cause children to be duplicated and/or omitted — the behavior is unsupported 
and could change in a future version.
```

The errors showed keys like `.1:$0`, `.1:$5`, `.1:$10` repeating many times.

#### Root Cause Analysis

I discovered the issue was in how I implemented infinite scrolling:

**My Initial Broken Implementation:**
```typescript
const baseHours = Array.from({ length: 24 }, (_, i) => i);
const baseMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// These created duplicate values 100 times
const hours = Array(100).fill(baseHours).flat();     // [0,1,2...23, 0,1,2...23, ...]
const minutes = Array(100).fill(baseMinutes).flat(); // [0,5,10...55, 0,5,10...55, ...]

// Then in JSX:
{hours.map((hour, index) => (
    <View key={`hour-${index}`}>  // Keys were index-based
        <Text>{hour}</Text>
    </View>
))}
```

**Why This Failed:**

1. I was repeating the same arrays 100 times to create the infinite scroll effect
2. Each repetition had the same values (0-23 for hours, 0-55 for minutes)
3. React was seeing the same numeric values rendered multiple times
4. Even though I used `index` in the key, React's reconciliation was still detecting issues
5. The pattern `.1:$0`, `.1:$5` suggests React was grouping by value, not just by key

#### How I Fixed It

I restructured the data to use objects with truly unique identifiers:

```typescript
/**
 * Creates looped arrays for infinite scrolling with unique identifiers.
 */
const hours = Array(LOOP_COUNT)
    .fill(null)
    .flatMap((_, loopIndex) => 
        baseHours.map((h) => ({ 
            value: h,           // The actual hour value (0-23)
            id: `${loopIndex}-${h}`  // Unique ID like "0-5", "1-5", "2-5"
        }))
    );

const minutes = Array(LOOP_COUNT)
    .fill(null)
    .flatMap((_, loopIndex) => 
        baseMinutes.map((m) => ({ 
            value: m,           // The actual minute value
            id: `${loopIndex}-${m}`  // Unique ID
        }))
    );

// In JSX:
{hours.map((hour) => (
    <View key={hour.id}>  // Now using truly unique IDs
        <Text>{hour.value}</Text>
    </View>
))}
```

**Additional Updates Required:**

I also had to update all related functions to work with objects instead of primitive values:

```typescript
// Before: selectedHour === hour
// After:  selectedHour === hour.value

// Before: const hourValue = hours[index] % 24;
// After:  const hourValue = hours[index].value;

// Before: selectedMinute === minute
// After:  selectedMinute === minute.value
```

#### Files Modified

1. `/frontend/src/components/PlatformTimePicker.tsx`
   - Changed data structure from arrays of primitives to arrays of objects
   - Updated all map operations to use `hour.id` and `minute.id` as keys
   - Modified scroll handlers to access `.value` property
   - Updated all conditional rendering to compare with `.value`

#### What I Learned

This bug taught me several critical lessons about React:

1. **React Keys Must Be Truly Unique**: Using array indices isn't always sufficient, especially with complex data structures
2. **Value-Based Reconciliation**: React considers both keys AND values when reconciling components
3. **Data Structure Design**: Sometimes adding extra structure (objects vs primitives) improves code clarity and prevents bugs
4. **Infinite Scroll Challenges**: Creating seamless infinite scrolling requires careful consideration of uniqueness across repetitions
5. **Performance Impact**: Duplicate keys can cause unexpected re-renders and poor performance

#### Testing Verification

After applying the fix:

✅ **Console is clean** - No more duplicate key warnings  
✅ **Scroll performance is smooth** - No lag or stuttering  
✅ **Selection works correctly** - Hour and minute selection updates properly  
✅ **Infinite scrolling works** - Can scroll indefinitely in both directions  
✅ **Recentering functions properly** - Scroll position resets smoothly after each interaction

#### Alternative Solutions I Considered

1. **Using index + value as key**: `key={`${index}-${hour}`}` 
   - ❌ Would still have duplicates since values repeat
   
2. **UUID library**: Generate random UUIDs for each item
   - ❌ Overkill and unnecessary dependency
   
3. **Using Map instead of Array**: Store items in a Map with unique keys
   - ❌ More complex to work with in React rendering
   
4. **Object with unique IDs** ✅ **CHOSEN**
   - Simple, performant, and guarantees uniqueness

#### Future Considerations

When implementing infinite scroll or repeating data patterns:

- Always ensure keys are unique across ALL rendered elements, not just within one iteration
- Consider using objects with ID properties instead of primitive values
- Test with React DevTools to catch key-related warnings early
- Remember that React's reconciliation algorithm looks beyond just the key prop
- Profile performance to ensure the data structure doesn't cause unnecessary re-renders

---

### 12. PlatformTimePicker - Slow Opening Performance

**Date:** 11 February 2026  
**Component:** `PlatformTimePicker.tsx`  
**Severity:** Medium - UX Performance Issue

#### Problem Description

I noticed that the time picker was opening significantly slower than the date picker. The delay was noticeable and made the user experience feel sluggish, especially compared to the smooth, instant opening of the date picker modal.

#### What I Discovered

After investigating the component, I identified several performance bottlenecks:

1. **Massive Array Generation**: The component was generating 2400 hour elements and 1200 minute elements (LOOP_COUNT = 100)
2. **Slow Initialization**: A 100ms setTimeout delay was adding unnecessary lag before positioning the scroll
3. **Repeated Calculations**: Arrays were being recreated on every render without memoization
4. **Heavy Initial Render**: Processing thousands of elements before displaying the modal

#### Root Cause Analysis

The performance issues stemmed from trying to create too extensive an infinite scroll effect:

```typescript
// BEFORE - Performance killer
const LOOP_COUNT = 100; // Way too many repetitions!

const hours = Array(LOOP_COUNT)
    .fill(null)
    .flatMap((_, loopIndex) => baseHours.map((h) => ({ value: h, id: `${loopIndex}-${h}` })));
// Result: 100 * 24 = 2400 elements

const minutes = Array(LOOP_COUNT)
    .fill(null)
    .flatMap((_, loopIndex) => baseMinutes.map((m) => ({ value: m, id: `${loopIndex}-${m}` })));
// Result: 100 * 12 = 1200 elements

setTimeout(() => {
    // Position scroll
}, 100); // Unnecessary delay
```

Total elements rendered: **3600 items** just for a simple time picker!

#### How I Fixed It

I implemented three key optimizations:

**1. Reduced Loop Count (95% reduction)**
```typescript
// AFTER - Much more reasonable
const LOOP_COUNT = 5; // Still plenty for infinite scroll effect

// New totals:
// Hours: 5 * 24 = 120 elements
// Minutes: 5 * 12 = 60 elements
// Total: 180 elements (down from 3600!)
```

**2. Faster Initialization (90% faster)**
```typescript
// BEFORE
setTimeout(() => {
    // Position scroll
}, 100);

// AFTER
setTimeout(() => {
    // Position scroll
}, 10); // 10x faster response
```

**3. Added Performance Memoization**
```typescript
import React, { useState, useRef, useEffect, useMemo } from 'react';

const baseHours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
const baseMinutes = useMemo(() => [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], []);

const hours = useMemo(() => 
    Array(LOOP_COUNT)
        .fill(null)
        .flatMap((_, loopIndex) => baseHours.map((h) => ({ value: h, id: `${loopIndex}-${h}` }))),
    [LOOP_COUNT, baseHours]
);

const minutes = useMemo(() => 
    Array(LOOP_COUNT)
        .fill(null)
        .flatMap((_, loopIndex) => baseMinutes.map((m) => ({ value: m, id: `${loopIndex}-${m}` }))),
    [LOOP_COUNT, baseMinutes]
);
```

#### Impact Assessment

**Before Optimizations:**
- 🐌 Slow, noticeable delay when opening
- 😕 Poor user experience compared to date picker
- ⚡ High memory usage (3600 elements)
- 🔄 Recalculating arrays on every render

**After Optimizations:**
- ⚡ Opens instantly, matching date picker speed
- 😊 Smooth user experience
- 💚 95% reduction in rendered elements (180 vs 3600)
- 🎯 Arrays cached with useMemo, no unnecessary recalculations

#### Why These Numbers Work

I validated that `LOOP_COUNT = 5` is more than sufficient:

- **5 loops of 24 hours = 120 total hours displayed**
- Users would need to scroll through **120 hours** (5 complete days) to reach the edge
- In practice, users scroll 1-3 positions max to select their time
- The infinite scroll still works perfectly, users never notice it's not truly infinite
- Even power users couldn't realistically scroll fast enough to hit the limit

#### What I Learned

This bug taught me important lessons about performance optimization:

1. **Question Initial Assumptions**: Just because you CAN loop 100 times doesn't mean you SHOULD
2. **Profile Before Optimizing**: Understanding what's slow helps target fixes effectively
3. **useMemo for Expensive Calculations**: Arrays, objects, and complex computations benefit greatly from memoization
4. **User Perception**: Even small delays (100ms) are noticeable when comparing similar features
5. **Reasonable Defaults**: 5 loops of an infinite scroll is just as good as 100 for real-world usage

#### Testing Verification

After applying all optimizations:

✅ **Opening speed matches date picker** - No perceptible delay  
✅ **Smooth scrolling** - No lag or stuttering  
✅ **Infinite scroll still works** - Can scroll in both directions seamlessly  
✅ **Memory usage reduced** - 95% fewer DOM elements  
✅ **No visual difference** - Users can't tell it's not 100 loops  

#### Future Considerations

For similar components in the future:

- Start with the minimum viable loop count (3-5)
- Always use `useMemo` for data transformations
- Keep initialization delays as short as possible (10-50ms max)
- Compare performance with similar components to maintain consistency
- Profile with React DevTools to identify bottlenecks

---

## Testing Issues

### 1. Form Validation Logic Bug in useFormValidation Hook

**Date:** 18 February 2026  
**Component:** `frontend/src/hooks/useFormValidation.ts`  
**Severity:** High - Custom validation functions not executing correctly  
**Discovered By:** Unit tests for UpdateCaregiverProfileModal and UpdateUserProfileModal

#### Problem Description

I discovered a critical logic bug in the `useFormValidation` hook while writing unit tests for the profile update modals. The bug prevented custom validation functions from running on empty fields, causing incorrect error messages to be displayed to users.

#### How Tests Revealed The Bug

When I ran the modal tests, they failed with:
```
Unable to find an element with text: register.errors.Name cannot be empty
```

The tests were expecting the specific error message from `validateName()` function, but the component was showing a generic "This field is required" message instead. This immediately told me something was wrong with the validation logic.

#### Initial Symptoms

- **User Impact**: When users left name fields empty and clicked save, they saw generic "This field is required" instead of the specific "Name cannot be empty" message
- **Test Failure**: 4 modal tests failing because expected error messages weren't appearing  
- **Inconsistent UX**: Different error messages for the same validation across different forms

#### My Investigation Process

1. **Verified Test Setup**: Checked that the `validateName()` mock was correct - ✅ It was returning the right message
2. **Checked Component Integration**: Verified the modal was calling `validateAll()` - ✅ It was
3. **Added Debug Logging**: Put console.log in the validation function - ❌ It was never being called for empty fields!
4. **Read Hook Implementation**: Found the bug in the `validateAll()` method

#### Root Cause Discovery

The `validateAll()` function in `useFormValidation.ts` had incorrect conditional logic:

```typescript
// BEFORE (❌ WRONG):
const validateAll = useCallback((): boolean => {
    Object.keys(config).forEach(fieldName => {
        const fieldConfig = config[fieldName];
        const value = values[fieldName];
        let error: string | null = null;

        // Check if required field is empty FIRST
        if (fieldConfig.required !== false && !value.trim()) {
            error = fieldConfig.requiredMessage || 'register.errors.This field is required';
        } 
        // Only run custom validation if field is NOT empty
        else if (fieldConfig.validate) {  // ❌ This 'else if' is the bug!
            error = fieldConfig.validate(value);
        }
    });
}, [config, values]);
```

**The Problem**: The `else if` creates **mutual exclusivity**:
- If field is empty → Show generic message
- **Else** if custom validation exists → Run it

This means custom validation **never runs** for empty fields! But `validateName()` specifically checks for empty fields with its own message: "Name cannot be empty".

#### Real-World Impact

**Before Fix:**
- User empties a name field and clicks save
- Sees: "This field is required" (generic, unclear)
- Expected: "Name cannot be empty" (specific, helpful)

**Why This Matters:**
- Generic messages are less helpful for users
- Different error messages for same validation creates confusion
- Custom validation functions couldn't control their full behavior

#### The Fix

I changed the validation order to **always prioritize custom validation**:

```typescript
// AFTER (✅ CORRECT):
const validateAll = useCallback((): boolean => {
    Object.keys(config).forEach(fieldName => {
        const fieldConfig = config[fieldName];
        const value = values[fieldName];
        let error: string | null = null;

        // Run custom validation FIRST if provided
        if (fieldConfig.validate) {
            error = fieldConfig.validate(value);  // ✅ Handles all cases including empty!
        }
        // Fallback: check required only for fields WITHOUT custom validation
        else if (fieldConfig.required !== false && !value.trim()) {
            error = fieldConfig.requiredMessage || 'register.errors.This field is required';
        }
    });
}, [config, values]);
```

**New Logic:**
1. If you provided a custom validation function → Use it (it owns ALL validation including empty checks)
2. Otherwise, if field is required → Use generic required message  
3. Otherwise → No error

#### Test Results

**Before Fix:**
- ❌ 4 modal validation tests failing
- ❌ Generic "This field is required" showing for empty names
- ❌ Custom validation bypassed for empty inputs

**After Fix:**
- ✅ All 98 tests passing
- ✅ Specific "Name cannot be empty" message showing correctly
- ✅ Custom validation controls full field behavior

#### What I Learned

1. **Tests Catch Design Flaws**: Unit tests immediately exposed this logic error that could have gone unnoticed in manual testing
2. **Validation Ownership**: Custom validation functions should own ALL validation logic for their field, including empty state
3. **Conditional Logic Order**: The order of if/else statements drastically changes behavior - always prioritize explicit overrides before defaults
4. **User Experience**: Specific, contextual error messages are much more helpful than generic ones
5. **Test-Driven Development**: Writing tests forces you to think through all edge cases (empty inputs, invalid inputs, valid inputs)

#### Why The Original Logic Seemed Reasonable

When I first wrote the hook, the logic seemed helpful:
- "Check if required fields are empty first"
- "Then run other validations"

But this breaks down when custom validations **also** want to handle empty fields with specific messages. The "helpful" default was actually limiting flexibility.

#### Prevention Strategies

For future hooks and utilities:

- **Explicit Overrides**: Always let user-provided customization override defaults
- **Fallback Pattern**: Only apply defaults when no custom behavior is specified
- **Test All Branches**: Write tests for each conditional path (empty, invalid, valid)
- **Document Expectations**: Clearly document whether custom functions should handle empty inputs
- **Think Like The User**: Consider all the ways a user might configure your hook

#### Files Changed

- `frontend/src/hooks/useFormValidation.ts` (lines 95-127)

#### Related Components

This bug affected all components using the hook:
- `UpdateCaregiverProfileModal` - Name fields showing wrong error messages
- `UpdateUserProfileModal` - Name fields showing wrong error messages
- Any future forms using `useFormValidation` with custom validation

---

### 2. Authentication Error Detection Bug in useCaregiverProfile Hook

**Date:** 18 February 2026  
**Component:** `frontend/src/hooks/useCaregiverProfile.ts`  
**Severity:** Critical - Logout not triggered on 401/403 errors  
**Discovered By:** Unit tests for useCaregiverProfile hook

#### Problem Description

I discovered a critical bug while writing tests for the `useCaregiverProfile` hook. The hook was supposed to trigger logout when receiving 401 (Unauthorized) or 403 (Forbidden) errors from the API, but the error detection logic was completely wrong, so users would never be logged out even when their session expired.

#### How Tests Revealed The Bug

When I ran the authentication error tests, they failed:
```
expect(mockOnLogout).toHaveBeenCalledTimes(1)
Expected: 1
Received: 0
```

The test was mocking a 401 error response, and the hook should have called `onAuthError()` (which triggers logout), but it never did. This immediately showed me the error detection wasn't working.

#### Initial Symptoms

- **User Impact**: Users with expired tokens stayed "logged in" with broken functionality instead of being redirected to login screen
- **Test Failure**: 2 authentication error tests failing (401 and 403 scenarios)
- **Silent Failure**: No logout triggered, just error message shown

#### My Investigation Process

1. **Checked Test Mock**: Verified the mock was structured correctly with `{ response: { status: 401 } }` - ✅ Correct Axios error structure
2. **Read Hook Code**: Found the bug in the error handling logic
3. **Understood Axios Errors**: Researched how Axios structures error objects

#### Root Cause Discovery

The hook was checking for authentication errors incorrectly:

```typescript
// BEFORE (❌ WRONG):
catch (err) {
    console.error('Failed to load caregiver profile:', err);
    setError('common.errors.failedToLoadProfile');
    
    // Handle authentication errors (401 Unauthorized)
    if (err instanceof Error && err.message.includes('401')) {  // ❌ This never matches!
        onAuthError?.();
    }
}
```

**The Problem**: 
- Axios errors have the structure: `{ response: { status: 401, data: {...} } }`
- The code was checking `err.message.includes('401')` 
- But `err.message` is something like "Request failed with status code 401", not guaranteed to contain "401"
- Even worse, 403 errors were completely ignored

#### Real-World Impact

**Before Fix:**
1. User's JWT token expires
2. API returns 401 Unauthorized
3. Hook catches error but doesn't trigger logout
4. User stays on screen seeing "Failed to load profile" error
5. User can't do anything, app appears broken
6. User has to manually refresh or navigate away

**After Fix:**
1. User's JWT token expires
2. API returns 401 Unauthorized  
3. Hook detects auth error and triggers logout
4. User automatically redirected to login screen
5. Clear state, user can log in again

#### The Fix

I changed the error detection to properly check the Axios error structure:

```typescript
// AFTER (✅ CORRECT):
catch (err: any) {
    console.error('Failed to load caregiver profile:', err);
    setError('common.errors.failedToLoadProfile');
    
    // Handle authentication errors (401 Unauthorized, 403 Forbidden)
    if (err?.response?.status === 401 || err?.response?.status === 403) {  // ✅ Correct!
        onAuthError?.();
    }
}
```

**What Changed:**
- Use optional chaining to safely access `err?.response?.status`
- Check the actual HTTP status code (401, 403)
- Handle both 401 (Unauthorized) and 403 (Forbidden) properly

#### Test Results

**Before Fix:**
- ❌ Test "should call onLogout when receiving 401 error" - FAILED
- ❌ Test "should trigger logout on 403 forbidden error" - FAILED
- ❌ Logout never triggered on auth errors

**After Fix:**
- ✅ All 9 useCaregiverProfile tests passing
- ✅ Logout correctly triggered on 401 errors
- ✅ Logout correctly triggered on 403 errors
- ✅ Non-auth errors (500, network) don't trigger logout

#### What I Learned

1. **Test Different Error Types**: Don't just test success cases - test all error scenarios (401, 403, 500, network errors)
2. **Understand Library Structures**: Learn how your HTTP client (Axios) structures error objects
3. **String Matching is Fragile**: Checking `message.includes('401')` is unreliable - use structured data (status codes)
4. **Optional Chaining**: Use `?.` to safely access nested properties that might not exist
5. **Comprehensive Error Handling**: Handle all relevant error types (401 AND 403 for auth, not just 401)

#### Why The Original Logic Was Wrong

I think I assumed Axios errors would be simple Error objects with messages. But Axios wraps HTTP errors in a structured object with `response`, `request`, and `message` properties. 

Checking `err.message` is unreliable because:
- Message format can vary between Axios versions
- Messages are meant for debugging, not programmatic checks
- HTTP status codes are the proper way to identify error types

#### Prevention Strategies

For future error handling:

- **Check Library Documentation**: Look up how libraries structure their error objects
- **Use Structured Data**: Check status codes, error codes, not string messages
- **Test Error Scenarios**: Write tests for each error type you want to handle
- **TypeScript Types**: Use proper typing for error objects to get autocomplete
- **Log Error Structure**: console.log errors during development to see their actual shape

#### Files Changed

- `frontend/src/hooks/useCaregiverProfile.ts` (lines 36-42)

#### Related Security Impact

This bug had **security implications**:
- Users with expired/invalid tokens could appear "logged in" 
- Broken functionality instead of clean logout
- Potential access to cached data after token expiration
- Poor user experience with auth failures

After the fix, the app properly handles session expiration and maintains security by forcing re-authentication.

---

## Backend Issues

### 1. Push Notification API Tests - Multiple Critical Bugs

**Date:** 26 February 2026  
**Components:** `backend/app/persistence/push_token_repository.py`, `backend/app/api/push_notification.py`, `backend/app/test/test_push_notification_api.py`  
**Severity:** Critical - All push notification tests failing

#### Problem Description

I discovered that ALL 20 push notification API tests were failing when I tried to run them. The test suite showed 14 failed tests with various errors including HTTP 500 errors, TypeError exceptions, and foreign key constraint violations. This completely blocked testing of the push notification feature.

#### Initial Symptoms

When running the tests, I encountered multiple error patterns:

1. **HTTP 500 Internal Server Error** - Registration endpoints returning server errors
2. **TypeError: TestClient.delete() got an unexpected keyword argument 'json'** - DELETE requests failing
3. **ForeignKeyViolation: Key (caregiver_id)=(...) is not present in table "caregiver"** - Database constraint errors
4. **Empty token lists** - GET /my-tokens returning [] when it should return tokens

#### My Investigation Process

I systematically analyzed the test output and traced each error:

1. **Checked Test Output**: Ran tests with `-v --tb=short` to see detailed failures
2. **Examined Repository Layer**: Found parameter order mismatch in PushTokenRepository
3. **Reviewed API Endpoints**: Discovered DELETE endpoint design issues
4. **Analyzed Test Code**: Identified tests using incorrect HTTP methods
5. **Traced Data Flow**: Found missing caregiver_id assignment logic

#### Root Cause Discovery

I identified **4 distinct bugs** causing test failures:

**Bug #1: Repository Constructor Parameter Order**

In `push_token_repository.py` line 16:
```python
# WRONG - Parameters reversed
super().__init__(db, PushTokenModel)

# Should be (following BaseRepository pattern):
super().__init__(PushTokenModel, db)
```

The `BaseRepository.__init__` expects `(model, db)` but I passed `(db, model)`. This caused all database operations to fail because the repository couldn't properly initialize.

**Bug #2: DELETE Endpoint Using Request Body Instead of Query Parameter**

The unregister endpoint was designed to accept JSON body:
```python
@router.delete("/unregister")
async def unregister_push_token(
    token_data: PushTokenDelete,  # ❌ Request body
    ...
)
```

But FastAPI's TestClient.delete() **doesn't support the `json=` parameter**. Only GET, POST, PUT, and PATCH support request bodies. DELETE requests should use query parameters or path parameters.

**Bug #3: Tests Using json= Parameter with DELETE**

Multiple tests were trying to use JSON bodies with DELETE:
```python
# ❌ This doesn't work with TestClient
response = client.delete(
    "/api/push-tokens/unregister",
    json={"token": sample_push_token}
)
```

**Bug #4: Missing Automatic caregiver_id Assignment**

When registering a token without specifying `caregiver_id`:
```python
client.post("/api/push-tokens/register", json={
    "token": token1,
    "device_name": "iPhone"
    # No caregiver_id provided
})
```

The token was created with `caregiver_id = None`, then `/my-tokens` couldn't retrieve it because it queries by caregiver_id or user_id.

#### The Fixes

I applied 4 corrections to resolve all issues:

**Fix #1: Corrected Repository Constructor**
```python
# backend/app/persistence/push_token_repository.py, line 16
super().__init__(PushTokenModel, db)  # ✅ Correct order
```

**Fix #2: Changed DELETE Endpoint to Use Query Parameter**
```python
# backend/app/api/push_notification.py
@router.delete("/unregister")
async def unregister_push_token(
    token: str,  # ✅ Query parameter instead of request body
    user_id: str = Depends(lambda token=Depends(verify_token): token.get("sub")),
    db: Session = Depends(get_db)
):
    # ...
    deleted = repo.delete_by_token(token)  # Use token directly
```

**Fix #3: Updated All DELETE Test Calls**
```python
# backend/app/test/test_push_notification_api.py
# Changed from json= to query parameters in 5 places:

# Line 233 - test_unregister_nonexistent_token
response = client.delete(
    f"/api/push-tokens/unregister?token={fake_token}"
)

# Line 243 - test_unregister_token_unauthenticated  
response = client.delete(
    f"/api/push-tokens/unregister?token={sample_push_token}"
)

# Line 254 - test_unregister_token_missing_token_field
response = client.delete("/api/push-tokens/unregister")

# Line 399 - test_complete_token_lifecycle
unregister_response = client.delete(
    f"/api/push-tokens/unregister?token={sample_push_token}"
)
```

**Fix #4: Auto-Assign caregiver_id from JWT**
```python
# backend/app/api/push_notification.py, line 59
# Create new token
push_token = PushTokenModel()
push_token.token = token_data.token
push_token.user_id = token_data.user_id
push_token.caregiver_id = token_data.caregiver_id or UUID(user_id)  # ✅ Auto-assign if not provided
push_token.device_name = token_data.device_name
```

**Fix #5: Removed Invalid Foreign Key Test Data**
```python
# backend/app/test/test_push_notification_api.py, lines 281-285
# Removed creation of token with non-existent caregiver_id
# Before: create_test_push_token(caregiver_id=uuid4(), ...)
# After: Removed this block entirely
```

#### Test Results

**Before Fixes:**
- ❌ 14 failed, 6 passed
- ❌ HTTP 500 errors on registration
- ❌ TypeError on DELETE requests
- ❌ Foreign key violations
- ❌ Empty token retrieval

**After Fixes:**
- ✅ 20 passed, 0 failed
- ✅ All registration endpoints work correctly
- ✅ DELETE requests use proper HTTP methods
- ✅ No database constraint violations
- ✅ Token retrieval works with auto-assigned caregiver_id

#### What I Learned

1. **Constructor Consistency**: When inheriting from base classes, always check the parent's parameter order - don't assume it matches your mental model

2. **HTTP Method Semantics**: DELETE requests traditionally don't have request bodies. Use query parameters or path parameters instead. TestClient enforces this correctly.

3. **FastAPI TestClient Limitations**: Not all HTTP client methods support the same parameters. `delete()` doesn't accept `json=`, only `post()`, `put()`, `patch()` do.

4. **Smart Defaults**: When an API receives authentication context (JWT), use it to provide sensible defaults for optional fields. This reduces client complexity.

5. **Foreign Key Awareness**: Test data must respect database constraints. Creating test objects with non-existent foreign keys causes failures that are hard to debug.

6. **Systematic Debugging**: Running tests with verbose output (`-v --tb=short`) provides critical context for understanding failures.

#### Why These Bugs Happened

**Repository Bug**: I likely copy-pasted from another repository that had a different constructor pattern, or I mixed up the order when refactoring.

**DELETE Endpoint Bug**: I probably carried over REST API patterns from other frameworks that allow DELETE with request bodies (like some JavaScript frameworks), not realizing TestClient enforces stricter HTTP semantics.

**Test Bug**: Copy-pasting test patterns without verifying they work with DELETE specifically.

**caregiver_id Bug**: I didn't consider the full lifecycle - registration works without caregiver_id, but retrieval fails because queries filter by it.

#### Prevention Strategies

For future API development:

- **Follow Base Class Patterns**: When calling `super().__init__()`, check other subclasses for the correct parameter order
- **REST Best Practices**: Use query/path parameters for DELETE, not request bodies
- **Test Early**: Run tests immediately after implementing endpoints, not after building multiple features
- **Think Full Lifecycle**: Consider create, read, update, delete flows together, not in isolation
- **Respect Constraints**: Ensure test data fixtures create valid foreign key relationships

#### Files Modified

1. `backend/app/persistence/push_token_repository.py` (1 line changed)
2. `backend/app/api/push_notification.py` (2 lines changed)
3. `backend/app/test/test_push_notification_api.py` (10 lines changed across 5 test methods)

#### Security & UX Implications

These bugs had important implications:

- **Security**: The broken auth token assignment could have allowed orphaned tokens (no owner)
- **User Experience**: Users couldn't unregister tokens, leading to unnecessary notifications
- **Testing**: No test coverage meant potential production bugs
- **API Design**: Incorrect HTTP method usage violates REST principles

After the fixes, the push notification system has full test coverage and follows proper REST conventions.

---

---

## Database Issues

No issues reported yet

---

## Integration Issues

No issues reported yet


