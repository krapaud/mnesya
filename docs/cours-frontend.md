# Cours Frontend — Projet Mnesya

> Technologies du frontend : application mobile React Native avec Expo, TypeScript, navigation, appels API, internationalisation et tests.

---

## Table des matières

1. [Architecture frontend](#1-architecture-frontend)
2. [TypeScript](#2-typescript)
3. [React Native](#3-react-native)
4. [Expo](#4-expo)
5. [React Navigation](#5-react-navigation)
6. [Axios (client HTTP)](#6-axios-client-http)
7. [Internationalisation — i18next](#7-internationalisation--i18next)
8. [Stockage sécurisé — AsyncStorage & SecureStore](#8-stockage-sécurisé--asyncstorage--securestore)
9. [Notifications push — côté mobile](#9-notifications-push--côté-mobile)
10. [Tests — Jest & Testing Library](#10-tests--jest--testing-library)
11. [ESLint & Prettier](#11-eslint--prettier)

---

## 1. Architecture frontend

### Structure des dossiers

```
frontend/
├── src/
│   ├── screens/        # Pages de l'application (un fichier = un écran)
│   ├── components/     # Composants réutilisables
│   │   ├── ActivityLogModal.tsx  # Modal historique d'activité (caregiver)
│   │   └── RateLimitModal.tsx    # Modal d'erreur 429 (trop de requêtes)
│   ├── navigation/     # Configuration React Navigation
│   ├── services/       # Appels API (Axios)
│   ├── contexts/       # Contextes React (état global)
│   ├── hooks/          # Hooks personnalisés
│   │   └── useActivityLog.ts     # Historique 48h des interactions (caregiver)
│   ├── types/          # Interfaces TypeScript
│   ├── locales/        # Fichiers de traduction (fr.json, en.json)
│   ├── styles/         # Styles partagés
│   ├── config/         # Configuration (URL API, constantes)
│   └── utils/          # Fonctions utilitaires
├── assets/             # Images, icônes, fonts
└── index.tsx           # Point d'entrée
```

### Flux d'une action utilisateur

```
Écran (Screen)
  │ appelle
Hook / Service
  │ appelle via Axios
API Backend (FastAPI)
  │ retourne
État React (useState / Context)
  │ re-render
Écran mis à jour
```

---

## 2. TypeScript

### Présentation

TypeScript est un sur-ensemble typé de JavaScript compilé en JS natif. Il détecte les erreurs **à la compilation** plutôt qu'à l'exécution.

### Types primitifs

```typescript
const name: string = "Alice";
const age: number = 30;
const active: boolean = true;
const nothing: null = null;
const missing: undefined = undefined;
```

### Interfaces

Décrivent la forme d'un objet. Correspondent aux entités métier de l'API :

```typescript
interface Reminder {
  id: string;
  title: string;
  scheduledTime: string; // ISO 8601 : "2026-03-02T08:00:00Z"
  isActive: boolean;
  userId: string;
}

interface Caregiver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}
```

### Types union et littéraux

```typescript
// Type union : une valeur parmi plusieurs
type ReminderStatus = "pending" | "taken" | "missed";

// Optionnel (peut être undefined)
interface UserProfile {
    name: string;
    avatar?: string;   // le ? signifie « peut être absent »
}

// Type union avec null
function findReminder(id: string): Reminder | null { ... }
```

### Génériques

```typescript
// Réponse API générique
interface ApiResponse<T> {
  data: T;
  message: string;
}

// Fonction générique
async function fetchData<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<T>(url);
  return data;
}

// Utilisation
const reminders = await fetchData<Reminder[]>("/reminders");
//    ^── TypeScript sait que c'est un Reminder[]
```

### Types utilitaires

```typescript
// Partial : tous les champs deviennent optionnels
type UpdateReminderDto = Partial<Reminder>;

// Pick : sélectionner certains champs
type ReminderCard = Pick<Reminder, "id" | "title" | "scheduledTime">;

// Omit : exclure certains champs
type CreateReminderDto = Omit<Reminder, "id" | "isActive">;

// Record : dictionnaire typé
type RemindersByDate = Record<string, Reminder[]>;
```

### Fonctions async typées

```typescript
async function login(email: string, password: string): Promise<string> {
  const response = await authService.login(email, password);
  return response.access_token;
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true, // Active tous les checks stricts
    "noImplicitAny": true, // Interdit le type any implicite
    "strictNullChecks": true, // null et undefined sont distincts
    "jsx": "react-native" // Transpile le JSX pour React Native
  }
}
```

---

## 3. React Native

### Présentation

React Native permet de créer des applications **iOS et Android** natives avec TypeScript. Les composants React Native se traduisent en vues natives (pas du HTML).

### Composants de base

```tsx
import {
  View, // div (conteneur)
  Text, // <p> ou <span> (texte)
  TextInput, // <input type="text">
  TouchableOpacity, // bouton cliquable avec opacité
  Pressable, // bouton cliquable plus flexible
  ScrollView, // vue scrollable (tout en mémoire)
  FlatList, // liste virtualisée (performante)
  Image, // image
  ActivityIndicator, // spinner de chargement
} from "react-native";
```

### FlatList — liste performante

```tsx
<FlatList
  data={reminders}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ReminderCard reminder={item} />}
  ListEmptyComponent={<Text>Aucun rappel</Text>}
  refreshing={loading}
  onRefresh={handleRefresh}
/>
```

`FlatList` ne rend que les éléments visibles à l'écran (virtualisation), contrairement à `ScrollView` qui charge tout en mémoire.

### StyleSheet

```typescript
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1, // Prend tout l'espace disponible
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  row: {
    flexDirection: "row", // Horizontal (par défaut : column = vertical)
    alignItems: "center",
    justifyContent: "space-between",
  },
});
```

> React Native utilise **Flexbox** pour les mises en page. La direction par défaut est `column` (vertical), contrairement au CSS web (`row`).

### Hooks React

#### `useState` — état local

```tsx
const [reminders, setReminders] = useState<Reminder[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

#### `useEffect` — effets de bord

```tsx
useEffect(() => {
  // Exécuté au montage du composant
  fetchReminders()
    .then(setReminders)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []); // [] = exécuté une seule fois

// Avec dépendance : exécuté quand `userId` change
useEffect(() => {
  loadUserReminders(userId);
}, [userId]);

// Nettoyage (cleanup)
useEffect(() => {
  const subscription = someEvent.subscribe(handler);
  return () => subscription.unsubscribe(); // appelé au démontage
}, []);
```

#### `useCallback` — mémorisation de fonctions

```tsx
const handleDelete = useCallback((id: string) => {
  setReminders((prev) => prev.filter((r) => r.id !== id));
}, []); // Se recréé seulement si les dépendances changent
```

#### `useMemo` — mémorisation de valeurs calculées

```tsx
const activeReminders = useMemo(
  () => reminders.filter((r) => r.isActive),
  [reminders], // recalculé seulement quand reminders change
);
```

### Contextes React

Les contextes partagent un état global sans props drilling :

```tsx
// AuthContext.tsx
interface AuthContextType {
  token: string | null;
  caregiver: Caregiver | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);

  const login = async (email: string, password: string) => {
    const { access_token } = await authService.login(email, password);
    await SecureStore.setItemAsync("access_token", access_token);
    setToken(access_token);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    setToken(null);
    setCaregiver(null);
  };

  return (
    <AuthContext.Provider value={{ token, caregiver, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour consommer le contexte
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Dans un composant
const { logout } = useAuth();
```

---

## 4. Expo

### Présentation

Expo est un ensemble d'outils et de bibliothèques qui simplifient le développement React Native. Il offre un accès unifié aux APIs natives (notifications, stockage, caméra, haptics...).

### SDK Expo utilisé dans le projet

| Bibliothèque         | Usage                                              |
| -------------------- | -------------------------------------------------- |
| `expo-notifications` | Enregistrement et réception des notifications push |
| `expo-secure-store`  | Stockage chiffré (tokens JWT)                      |
| `expo-haptics`       | Retour haptique (vibrations) lors des interactions |
| `expo-clipboard`     | Copier/coller (ex: code de pairing)                |
| `expo-device`        | Vérifie si l'app tourne sur un vrai appareil       |
| `expo-constants`     | Accès aux métadonnées de l'app (version, etc.)     |

### Démarrer l'application

```bash
npx expo start          # Démarre le bundler Metro
# Options :
npx expo start --ios    # Ouvre directement sur simulateur iOS
npx expo start --android
npx expo start --web

# Scanner le QR code avec l'app Expo Go sur son téléphone
# pour tester sur un appareil physique
```

### `app.json`

Fichier de configuration Expo :

```json
{
  "expo": {
    "name": "Mnesya",
    "slug": "mnesya",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png" },
    "ios": {
      "bundleIdentifier": "com.mnesya.app"
    },
    "android": {
      "package": "com.mnesya.app"
    }
  }
}
```

### Haptics (retour haptique)

```typescript
import * as Haptics from "expo-haptics";

// Lors d'une action réussie
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Lors d'une erreur
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Léger tap
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

---

## 5. React Navigation

### Présentation

React Navigation est la bibliothèque standard de navigation pour React Native. Elle gère la pile d'écrans, les onglets et les transitions.

### Installation et configuration

```tsx
// App.tsx (ou index.tsx)
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

### Stack Navigator (navigation en pile)

Chaque `navigate()` empile un écran, `goBack()` le dépile.

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Typage des paramètres de chaque route
type RootStackParamList = {
  Login: undefined; // pas de paramètres
  Home: undefined;
  ReminderDetail: { reminderId: string }; // paramètre obligatoire
  CreateReminder: { userId?: string }; // paramètre optionnel
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
    </Stack.Navigator>
  );
}
```

### Bottom Tabs Navigator (onglets en bas)

```tsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarLabel: "Rappels",
          tabBarIcon: ({ color }) => <Icon name="bell" color={color} />,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Navigation et paramètres

```tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Naviguer vers un écran
const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

navigation.navigate("ReminderDetail", { reminderId: "123" });
navigation.goBack();
navigation.replace("Login"); // remplace sans empiler
navigation.reset({ index: 0, routes: [{ name: "Home" }] }); // vide la pile

// Lire les paramètres reçus
const route = useRoute();
const { reminderId } = route.params as { reminderId: string };
```

### Protection des routes (auth guard)

```tsx
function AppNavigator() {
  const { token } = useAuth();

  return (
    <Stack.Navigator>
      {token ? (
        // Écrans accessibles uniquement après connexion
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ReminderDetail"
            component={ReminderDetailScreen}
          />
        </>
      ) : (
        // Écrans d'authentification
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
```

### `useFocusEffect` — exécuter du code au focus d'un écran

`useFocusEffect` est l'équivalent de `useEffect` pour les événements de navigation. Il s'exécute **chaque fois que l'écran devient visible** (premier affichage + retour depuis un écran enfant), pas seulement au montage initial. C'est utile pour rafraîchir des données quand l'utilisateur revient à un écran.

```tsx
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

function DashboardScreen() {
  const { reload } = useCaregiverReminders();
  const { reload: reloadActivity } = useActivityLog();

  // Rechargé à chaque fois que l'écran prend le focus
  useFocusEffect(
    useCallback(() => {
      reload();
      reloadActivity();
    }, [reload, reloadActivity])
  );

  return (...);
}
```

> **Pourquoi `useCallback` autour du callback ?** `useFocusEffect` a besoin d'une référence stable pour comparer les dépendances — sans `useCallback`, le callback serait re-créé à chaque render et déclencherait une boucle infinie.

---

## 6. Axios (client HTTP)

### Présentation

Axios est la bibliothèque HTTP pour communiquer avec le backend FastAPI. Le projet crée une **instance préconfigurée** dans `services/api.ts` avec l'URL de base et les intercepteurs d'authentification.

### Détection automatique de l'URL (`config/api.ts`)

En développement avec Expo Go, l'IP du serveur est détectée automatiquement depuis le serveur Expo via `expo-constants` — aucun changement manuel nécessaire quand on change de réseau.

```typescript
// src/config/api.ts
import Constants from "expo-constants";

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : null;

// Dev : http://192.168.x.x:8000   |   Prod : https://api.mnesya.app
export const API_BASE_URL = localIp
  ? `http://${localIp}:8000`
  : "https://api.mnesya.app";
```

### Instance Axios configurée (`services/api.ts`)

```typescript
// src/services/api.ts
import axios from "axios";
import { getToken, deleteToken } from "./tokenService";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Intercepteur de REQUÊTE — attache le JWT à chaque appel
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken(); // lit depuis SecureStore via tokenService
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de RÉPONSE — supprime le token si 401 (session expirée)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

### Utilisation dans les services

```typescript
// src/services/reminderService.ts
import apiClient from "./api";

export const getRemindersByCaregiver = async (caregiverId: number) => {
  const { data } = await apiClient.get(`/caregiver/${caregiverId}/reminders`);
  return data;
};
```

### Gestion des erreurs

```typescript
try {
  const { data } = await apiClient.get("/reminders");
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Erreur HTTP (400, 401, 404, 500...)
    const message = error.response?.data?.detail ?? "Erreur serveur";
    setError(message);
  } else {
    // Erreur réseau, timeout...
    setError("Impossible de joindre le serveur");
  }
}
```

---

## 7. Internationalisation — i18next

### Présentation

i18next est la bibliothèque d'internationalisation (i18n) standard pour JavaScript. Le projet supporte le **français** et l'**anglais**. La langue est **fixée à `fr`** dans le code — il n'y a pas de détection automatique de la langue du téléphone.

### Configuration réelle (`src/i18n.ts`)

```typescript
// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "fr",
  lng: "fr", // langue fixée — pas de détection depuis le téléphone
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

### Fichiers de traduction

```json
// locales/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "loading": "Chargement...",
    "error": "Une erreur est survenue"
  },
  "auth": {
    "login": "Se connecter",
    "logout": "Se déconnecter",
    "email": "Adresse email",
    "password": "Mot de passe"
  },
  "reminders": {
    "title": "Mes rappels",
    "add": "Ajouter un rappel",
    "empty": "Aucun rappel pour le moment",
    "delete_confirm": "Supprimer le rappel \"{{name}}\" ?"
  }
}
```

### Utilisation dans les composants

```tsx
import { useTranslation } from "react-i18next";

function RemindersScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("reminders.title")}</Text>
      <Text>{t("reminders.empty")}</Text>

      {/* Interpolation de variables */}
      <Text>{t("reminders.delete_confirm", { name: reminder.title })}</Text>

      <TouchableOpacity onPress={handleAdd}>
        <Text>{t("reminders.add")}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Changer la langue dynamiquement

```typescript
import i18n from "../i18n";

// Changer la langue au runtime
await i18n.changeLanguage("en");
```

### Traductions qui retournent des tableaux — `returnObjects: true`

Quand une clé de traduction pointe vers un **tableau JSON** (ex. liste de mois, jours de la semaine), l'option `{ returnObjects: true }` est nécessaire pour que `t()` retourne le tableau au lieu d'une chaîne.

```json
// locales/fr.json
{
  "common": {
    "pickersText": {
      "months": [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"
      ],
      "weekDays": ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      "selectYear": "Sélectionner une année",
      "selectMonth": "Sélectionner un mois"
    }
  }
}
```

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

// ✔ Retourne un string[] grâce à { returnObjects: true }
const months = t("common.pickersText.months", {
  returnObjects: true,
}) as string[];
const weekDays = t("common.pickersText.weekDays", {
  returnObjects: true,
}) as string[];

const monthName = months[new Date().getMonth()]; // ex. "Mars"
```

> **Pourquoi `as string[]` ?** Le type de retour de `t()` est `string` par défaut. Quand `returnObjects: true`, le résultat réel est un tableau, mais TypeScript n'en est pas conscient — il faut une assertion de type explicite.

---

## 8. Stockage sécurisé — SecureStore & AsyncStorage

### Expo SecureStore — via `tokenService.ts`

Le projet **n'utilise pas SecureStore directement** dans les composants. Toutes les opérations de stockage du JWT et des infos utilisateur passent par `tokenService.ts`, qui encapsule SecureStore derrière des clés privées.

```typescript
// src/services/tokenService.ts
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token"; // clé interne — non exposée
const USER_INFO_KEY = "user_info";

export const saveToken = async (token: string) =>
  SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
export const getToken = async () => SecureStore.getItemAsync(AUTH_TOKEN_KEY);
export const deleteToken = async () =>
  SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);

export const saveUserInfo = async (info: unknown) =>
  SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(info));
export const getUserInfo = async () => {
  const data = await SecureStore.getItemAsync(USER_INFO_KEY);
  return data ? JSON.parse(data) : null;
};
export const deleteUserInfo = async () =>
  SecureStore.deleteItemAsync(USER_INFO_KEY);
```

SecureStore utilise le **Keychain** sur iOS et le **Keystore** sur Android — les données sont chiffrées par l'OS.

### AsyncStorage — IDs de notifications programmées

AsyncStorage (non chiffré) est utilisé dans `utils/notifications.ts` pour stocker les identifiants des notifications locales programmées — afin de pouvoir les annuler si nécessaire.

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sauvegarde des IDs de notifications pour un rappel
const NOTIFICATION_IDS_KEY = `notification_ids_${reminder.id}`;
await AsyncStorage.setItem(
  NOTIFICATION_IDS_KEY,
  JSON.stringify(notificationIds),
);

// Lecture lors d'une annulation
const raw = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
const ids = raw ? JSON.parse(raw) : [];

// Nettoyage après annulation
await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
```

### Quand utiliser quoi ?

| Donnée                           | Stockage              | Raison                              |
| -------------------------------- | --------------------- | ----------------------------------- |
| Token JWT                        | `SecureStore`         | Sensible — chiffré dans le keychain |
| Infos utilisateur                | `SecureStore`         | Sensible                            |
| IDs de notifications programmées | `AsyncStorage`        | Non sensible, persistence légère    |
| Données temporaires de session   | `useState` / Contexte | En mémoire seulement                |

---

## 9. Notifications push — côté mobile

### Flux complet des notifications

```
Téléphone                          Backend (worker)
    │                                    │
    │ 1. Demande permission              │
    │ 2. Obtient token Expo push         │
    │ POST /api/push-tokens              │
    ├───────────────────────────────────►│
    │                                    │ 3. Stocke le token en DB
    │                                    │
    │                                    │ 4. (scheduler) Détecte un rappel dû
    │                                    │ 5. Envoie via Expo Push API
    │◄───────────────────────────────────┤
    │ 6. Notification reçue              │
```

### Enregistrement du token push (`utils/notifications.ts`)

Le token push **doit obligatoirement** inclure le `projectId` Expo, sinon une erreur est levée à l'exécution. Le token est ensuite sauvegardé dans SecureStore.

```typescript
// src/utils/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

export async function registerForPushNotifications(): Promise<
  string | undefined
> {
  if (!Device.isDevice) {
    return undefined; // ne fonctionne pas sur simulateur
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return undefined;

  // ⚠️ projectId obligatoire pour l'API Expo Push
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "9c2be3eb-ff96-4a7a-ab50-20203cdfb5a9",
  });

  // Stocker le token en local pour le renvoyer au backend si besoin
  await SecureStore.setItemAsync("expo_push_token", tokenData.data);
  return tokenData.data;
}
```

### Notifications locales programmées

Le projet utilise `scheduleNotificationAsync` avec un trigger de type `DATE` pour programmer des rappels locaux — utile quand le backend n'est pas joignable.

```typescript
import { SchedulableTriggerInputTypes } from "expo-notifications";

const notificationId = await Notifications.scheduleNotificationAsync({
  content: {
    title: "Prise de médicament",
    body: "Il est l'heure de prendre votre traitement",
    sound: true,
    data: { reminderId: 42 },
  },
  trigger: {
    type: SchedulableTriggerInputTypes.DATE,
    date: triggerDate, // objet Date JavaScript
  },
});
```

### Répétitions automatiques — `scheduleReminderWithRepetitions`

La fonction centrale du module : schedule **4 notifications** pour l'utilisateur (à 0, +2, +5, +10 min après l'heure du rappel), puis **1 alerte aidant** à +10 min. Les IDs sont persistés dans AsyncStorage pour permettre l'annulation.

```typescript
// Délais en minutes pour les rappels utilisateur
const delays = [0, 2, 5, 10];

for (let i = 0; i < delays.length; i++) {
  const notificationDate = new Date(
    triggerDate.getTime() + delays[i] * 60 * 1000,
  );

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  });
  notificationIds.push(id);
}

// Alerte aidant à +10 min (si l'utilisateur n'a pas répondu)
const caregiverDate = new Date(triggerDate.getTime() + 10 * 60 * 1000);
const caregiverId = await Notifications.scheduleNotificationAsync({
  content: {
    title: i18n.t("notifications.caregiver.alert", { profileName }),
    body: i18n.t("notifications.caregiver.message", { title }),
    sound: true,
    data: { ...data, isCaregiverAlert: true },
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: caregiverDate,
  },
});
notificationIds.push(caregiverId);

// Persister les IDs dans AsyncStorage pour pouvoir les annuler plus tard
await AsyncStorage.setItem(
  `notification_ids_${reminderId}`,
  JSON.stringify(notificationIds),
);
```

### Annuler des notifications programmées

```typescript
export async function cancelNotifications(
  notificationIds: string[],
): Promise<void> {
  for (const id of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
```

---

## 10. Tests — Jest & Testing Library

### Présentation

Le projet utilise **Jest** comme runner de tests et **React Native Testing Library** pour tester les composants.

### Configuration Jest (`jest.config.js`)

```javascript
// jest.config.js
module.exports = {
  preset: "react-native",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      { configFile: "./babel.config.js" },
    ],
  },
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/?(*.)+(spec|test).(ts|tsx|js)",
  ],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*)",
  ],
};
```

### Tester un composant

```tsx
import { render, fireEvent, waitFor } from "@testing-library/react-native";

test("affiche le titre du rappel", () => {
  const reminder = { id: "1", title: "Aspirine", isActive: true };

  const { getByText } = render(<ReminderCard reminder={reminder} />);

  expect(getByText("Aspirine")).toBeTruthy();
});

test("appelle onDelete au clic sur le bouton supprimer", () => {
  const mockDelete = jest.fn();
  const { getByTestId } = render(
    <ReminderCard reminder={mockReminder} onDelete={mockDelete} />,
  );

  fireEvent.press(getByTestId("delete-button"));

  expect(mockDelete).toHaveBeenCalledWith(mockReminder.id);
});
```

### Tester un écran avec appel API asynchrone

```tsx
test("affiche les rappels après chargement", async () => {
  // Mock du service
  jest.spyOn(reminderService, "getAll").mockResolvedValue([
    { id: "1", title: "Aspirine", isActive: true },
    { id: "2", title: "Doliprane", isActive: true },
  ]);

  const { getByText, queryByTestId } = render(<RemindersScreen />);

  // Pendant le chargement
  expect(queryByTestId("loading-spinner")).toBeTruthy();

  // Après le chargement
  await waitFor(() => {
    expect(getByText("Aspirine")).toBeTruthy();
    expect(getByText("Doliprane")).toBeTruthy();
  });

  expect(queryByTestId("loading-spinner")).toBeNull();
});
```

### Mocks des modules natifs

```typescript
// __mocks__/fileMock.js — mock des assets (images, polices)
module.exports = "test-file-stub";

// Dans un fichier de test
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("fake-jwt-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest
    .fn()
    .mockResolvedValue({ data: "ExponentPushToken[test]" }),
  setNotificationHandler: jest.fn(),
}));
```

### Requêtes par rôle accessibilité

Testing Library recommande de cibler les éléments comme un utilisateur :

```tsx
// Chercher par texte visible
getByText("Ajouter un rappel");

// Chercher par rôle d'accessibilité
getByRole("button", { name: "Supprimer" });

// Chercher par testID (en dernier recours)
getByTestId("reminder-list");
```

### Couverture de code

```bash
npm run test:coverage
# Génère un rapport dans coverage/lcov-report/index.html
```

---

## 11. ESLint & Prettier

### ESLint

Outil d'**analyse statique** qui détecte les erreurs et mauvaises pratiques avant l'exécution.

```js
// eslint.config.js
export default [
  {
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
    },
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",

      // React Hooks — règles critiques
      "react-hooks/rules-of-hooks": "error", // hooks uniquement dans des composants
      "react-hooks/exhaustive-deps": "warn", // dépendances de useEffect complètes

      // Qualité générale
      "no-console": "warn",
    },
  },
];
```

### Règles des hooks (react-hooks/rules-of-hooks)

Les hooks ont deux règles fondamentales :

1. **Appeler les hooks uniquement au niveau supérieur** — jamais dans des `if`, boucles ou fonctions imbriquées
2. **Appeler les hooks uniquement dans des composants React** ou des hooks personnalisés

```tsx
// ✅ Correct
function MyComponent() {
  const [count, setCount] = useState(0); // toujours appelé
  return <Text>{count}</Text>;
}

// ❌ Incorrect — hook dans un if
function MyComponent({ isAuth }) {
  if (isAuth) {
    const [data, setData] = useState(null); // ESLint l'interdit
  }
}
```

### Prettier

Formateur de code automatique. Garantit un style **entièrement cohérent** dans tout le projet.

```bash
# Formater tous les fichiers TypeScript
prettier --write "src/**/*.{ts,tsx}"
```

Configuration dans `package.json` :

```json
"prettier": {
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 4,
    "semi": true
}
```

### Intégration dans le workflow

```bash
# Lancer ESLint
npx eslint src/

# Formatter avec Prettier
npm run format

# Vérifier sans modifier (CI)
prettier --check "src/**/*.{ts,tsx}"
```

---

## Récapitulatif frontend

| Technologie                   | Version | Rôle                            |
| ----------------------------- | ------- | ------------------------------- |
| TypeScript                    | 5.9     | Langage (typage statique)       |
| React Native                  | 0.81    | Framework mobile iOS/Android    |
| Expo                          | 54      | SDK natif + outils de dev       |
| React Navigation              | 7       | Navigation (Stack + BottomTabs) |
| Axios                         | 1.13    | Client HTTP vers le backend     |
| i18next                       | 25      | Internationalisation (fr/en)    |
| react-i18next                 | 16      | Intégration React de i18next    |
| AsyncStorage                  | 2.2     | Stockage local non chiffré      |
| expo-secure-store             | 15      | Stockage chiffré (JWT)          |
| expo-notifications            | 0.32    | Notifications push              |
| expo-haptics                  | 15      | Retour haptique                 |
| expo-clipboard                | 8       | Copier/coller                   |
| expo-device                   | 8       | Info appareil                   |
| react-native-toast-message    | 2.3     | Toasts (messages flash)         |
| Jest                          | 30      | Runner de tests                 |
| @testing-library/react-native | 13      | Tests de composants             |
| ESLint                        | 9       | Analyse statique                |
| Prettier                      | 3       | Formatage du code               |
