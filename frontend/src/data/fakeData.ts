import { ProfileItem, ReminderItem } from '../types/interfaces';

// Mock profiles data
export const fakeProfiles: ProfileItem[] = [
    { id: 1, firstName: 'Marie', lastName: 'Dupont', age: 76 },
    { id: 2, firstName: 'Jean', lastName: 'Valjean', age: 82 },
    { id: 3, firstName: 'Pierre', lastName: 'Vichie', age: 79 },
];

// Mock reminders data
export const fakeReminders: ReminderItem[] = [
   { 
        id: 1, 
        title: 'Take Medication', 
        message: 'Take your blood pressure medication with a glass of water',
        date: '26/01/2026', 
        time: '08:00', 
        status: 'Pending',
        profileName: 'Marie Dupont'
    },
    { 
        id: 2, 
        title: 'Doctor Appointment', 
        message: 'Annual checkup with Dr. Smith',
        date: '24/01/2026', 
        time: '14:30', 
        status: 'Done',
        profileName: 'Jean Valjean'
    },
    { 
        id: 3, 
        title: 'Physical Therapy', 
        message: 'Knee rehabilitation session',
        date: '24/01/2026', 
        time: '10:00', 
        status: 'Postponed',
        profileName: 'Marie Dupont'
    },
    { 
        id: 4, 
        title: 'Lunch Reminder', 
        message: 'Remember to eat lunch',
        date: '24/01/2026', 
        time: '12:00', 
        status: 'Unable',
        profileName: 'Jean Valjean'
    },
    { 
        id: 5, 
        title: 'Lunch Reminder', 
        message: 'Remember to eat lunch',
        date: '25/01/2026', 
        time: '14:00', 
        status: 'Done',
        profileName: 'Pierre Vichie'
    },
];
