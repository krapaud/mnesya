# Bug Reports & Technical Issues

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

## Backend Issues

No issues reported yet

---

## Database Issues

No issues reported yet

---

## Integration Issues

No issues reported yet
