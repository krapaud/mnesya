# Cours Frontend — Projet Mnesya (Q&R)

> Format questions/réponses pour révision orale.

---

## Table des matières

- [Cours Frontend — Projet Mnesya (Q\&R)](#cours-frontend--projet-mnesya-qr)
  - [Table des matières](#table-des-matières)
  - [1. Architecture frontend](#1-architecture-frontend)
  - [2. TypeScript](#2-typescript)
  - [3. React Native](#3-react-native)
  - [4. Expo](#4-expo)
  - [5. React Navigation](#5-react-navigation)
  - [6. Axios (client HTTP)](#6-axios-client-http)
  - [7. Internationalisation — i18next](#7-internationalisation--i18next)
  - [8. Stockage sécurisé — SecureStore \& AsyncStorage](#8-stockage-sécurisé--securestore--asyncstorage)
  - [9. Notifications push — côté mobile](#9-notifications-push--côté-mobile)
  - [10. Tests — Jest \& Testing Library](#10-tests--jest--testing-library)
  - [11. ESLint \& Prettier](#11-eslint--prettier)
  - [Récapitulatif — technologies et rôles](#récapitulatif--technologies-et-rôles)

---

## 1. Architecture frontend

**Quel est le rôle de chaque dossier dans `src/` ?**

- `screens/` : un fichier = un écran affiché à l'utilisateur
- `components/` : composants réutilisables (boutons, cartes…)
- `navigation/` : configuration de React Navigation (piles, onglets)
- `services/` : appels HTTP via Axios vers le backend
- `contexts/` : état global partagé entre composants (ex. token auth)
- `hooks/` : hooks personnalisés réutilisables
- `types/` : interfaces TypeScript des entités métier
- `locales/` : fichiers de traduction `fr.json` / `en.json`
- `config/` : constantes et URL de l'API
- `utils/` : fonctions utilitaires (ex. gestion des notifications locales)

**Quel est le flux d'une action utilisateur ?**
L'écran appelle un hook ou service → le service fait un appel HTTP via Axios → le backend répond → l'état React est mis à jour (`useState` ou Context) → l'écran se re-rend.

---

## 2. TypeScript

**Qu'est-ce que TypeScript ?**
Un sur-ensemble typé de JavaScript qui se compile en JS natif. Il détecte les erreurs **à la compilation** plutôt qu'à l'exécution, ce qui rend le code plus fiable et plus maintenable.

**Quelle est la différence entre `interface` et `type` ?**
Les deux permettent de décrire la forme d'un objet. `interface` est préférable pour les entités métier (extensible via `extends`). `type` est utile pour les unions, les alias et les types utilitaires.

**Qu'est-ce qu'un type union ? Donnez un exemple du projet.**
Un type qui accepte plusieurs valeurs possibles. Exemple : `type ReminderStatus = "pending" | "taken" | "missed"` — le statut d'un rappel ne peut prendre que ces trois valeurs.

**Qu'est-ce que le champ optionnel `?` dans une interface ?**
Un champ marqué `?` peut être absent (`undefined`). Exemple : `avatar?: string` signifie que l'avatar n'est pas obligatoire.

**Qu'est-ce qu'un générique (`<T>`) ?**
Un paramètre de type qui rend une fonction ou interface réutilisable pour n'importe quel type. Exemple : `ApiResponse<T>` peut être `ApiResponse<Reminder[]>` — TypeScript sait exactement ce que contient `data` dans chaque cas.

**Citez 4 types utilitaires TypeScript utilisés dans le projet.**

- `Partial<T>` : tous les champs deviennent optionnels (mise à jour partielle)
- `Pick<T, K>` : sélectionne certains champs
- `Omit<T, K>` : exclut certains champs (ex. exclure `id` pour la création)
- `Record<K, V>` : dictionnaire typé clé/valeur

**Que contient `tsconfig.json` ?**
Les options du compilateur TypeScript : `strict: true` (tous les checks stricts), `noImplicitAny` (interdit `any` implicite), `strictNullChecks` (distingue `null` et `undefined`), `jsx: "react-native"` (transpile le JSX).

---

## 3. React Native

**Qu'est-ce que React Native ?**
Un framework qui permet de construire des applications **iOS et Android** natives en TypeScript. Les composants ne génèrent pas du HTML mais des vues natives de l'OS.

**Citez les composants de base les plus courants.**
`View` (conteneur), `Text` (texte), `TextInput` (saisie), `TouchableOpacity` / `Pressable` (boutons), `ScrollView` (vue scrollable), `FlatList` (liste virtualisée), `Image`, `ActivityIndicator` (spinner).

**Quelle est la différence entre `FlatList` et `ScrollView` ?**
`FlatList` **virtualise** la liste : elle ne rend que les éléments visibles à l'écran, ce qui la rend performante pour de longues listes. `ScrollView` charge tout le contenu en mémoire dès le départ — adapté aux petites listes uniquement.

**Comment fonctionne le système de style en React Native ?**
Via `StyleSheet.create()` qui produit des objets de styles optimisés. React Native utilise **Flexbox** pour les layouts. La direction par défaut est `column` (vertical), contrairement au CSS web qui est `row` par défaut.

**À quoi sert `useState` ?**
À gérer un état local dans un composant. Quand la valeur change, React re-rend le composant. Exemple : `const [loading, setLoading] = useState(true)`.

**À quoi sert `useEffect` ?**
À exécuter du code à des moments précis du cycle de vie du composant : au montage (tableau de dépendances vide `[]`), quand une dépendance change, ou au démontage (via la fonction de nettoyage retournée). Utilisé pour charger des données, s'abonner à des événements, etc.

**Quelle est la différence entre `useCallback` et `useMemo` ?**
`useCallback` mémorise une **fonction** pour éviter de la recréer à chaque render. `useMemo` mémorise une **valeur calculée** pour éviter de refaire le calcul. Les deux prennent un tableau de dépendances : le recalcul n'a lieu que si une dépendance change.

**Qu'est-ce qu'un Contexte React ? Pourquoi l'utiliser ?**
Un mécanisme de partage d'état global sans passer les données de composant en composant via les props (le _props drilling_). Dans le projet, `AuthContext` partage le token JWT et les fonctions `login`/`logout` à toute l'application. On le consomme via un hook personnalisé (`useAuth()`).

---

## 4. Expo

**Qu'est-ce qu'Expo ?**
Un ensemble d'outils et de bibliothèques qui simplifient le développement React Native. Il fournit une interface unifiée pour accéder aux APIs natives (notifications, stockage, haptics, caméra…) sans écrire de code natif iOS/Android.

**Quelles bibliothèques Expo sont utilisées dans le projet et pour quoi ?**

| Bibliothèque         | Rôle                                               |
| -------------------- | -------------------------------------------------- |
| `expo-notifications` | Enregistrement et réception des notifications push |
| `expo-secure-store`  | Stockage chiffré du token JWT                      |
| `expo-haptics`       | Retour haptique (vibrations)                       |
| `expo-clipboard`     | Copier/coller le code de pairing                   |
| `expo-device`        | Vérifier si l'app tourne sur un vrai appareil      |
| `expo-constants`     | Accès aux métadonnées de l'app (hostUri, version…) |

**Comment démarre-t-on l'application ?**
Avec `npx expo start`, qui lance le bundler Metro. On peut ouvrir sur un simulateur (`--ios`, `--android`) ou scanner le QR code avec Expo Go pour tester sur un appareil physique.

**À quoi sert `app.json` ?**
C'est le fichier de configuration Expo : nom de l'app, version, icône, écran de démarrage (splash), identifiants des stores iOS (`bundleIdentifier`) et Android (`package`).

**Qu'est-ce que le retour haptique et comment est-il utilisé ?**
Une vibration physique du téléphone pour donner un retour à l'utilisateur. Le projet utilise `expo-haptics` pour signaler les succès (`NotificationFeedbackType.Success`) et les erreurs (`NotificationFeedbackType.Error`).

---

## 5. React Navigation

**Qu'est-ce que React Navigation ?**
La bibliothèque standard de navigation pour React Native. Elle gère la pile d'écrans, les onglets du bas, et les transitions entre écrans.

**Comment fonctionne le Stack Navigator ?**
Il empile les écrans comme une pile de cartes : `navigate()` pose un écran sur la pile, `goBack()` le retire. `replace()` remplace l'écran courant sans empiler, et `reset()` vide totalement la pile (utile après une déconnexion).

**Comment type-t-on les paramètres de navigation ?**
Via un type `RootStackParamList` qui associe chaque nom de route à ses paramètres (ou `undefined` si aucun). Cela permet à TypeScript de vérifier que les bons paramètres sont passés lors d'un `navigate()`.

**Comment protège-t-on les routes selon l'authentification ?**
Dans le navigateur, on affiche conditionnellement des écrans selon la présence du token : si `token` existe, on affiche les écrans de l'app ; sinon, on affiche les écrans d'authentification (Login, Register). React Navigation gère automatiquement la redirection.

**Quelle est la différence entre Stack Navigator et Bottom Tabs Navigator ?**
Le Stack Navigator gère la navigation en profondeur (aller vers un détail, revenir en arrière). Le Bottom Tabs Navigator affiche des onglets persistants en bas de l'écran pour naviguer entre les sections principales de l'app.

**À quoi sert `useFocusEffect` et pourquoi n'utilise-t-on pas `useEffect` à la place ?**
`useFocusEffect` s'exécute **à chaque fois que l'écran reprend le focus** (premier affichage + chaque retour depuis un écran enfant). `useEffect` avec `[]` ne s'exécute qu'au montage initial — il ne se re-déclenche pas quand on revient à l'écran. Dans le projet, `useFocusEffect` est utilisé dans le `DashboardScreen` pour rafraîchir les rappels et l'historique d'activité à chaque retour sur l'écran. Le callback doit être encapsulé dans `useCallback` pour éviter une boucle infinie.

---

## 6. Axios (client HTTP)

**Pourquoi créer une instance Axios configurée plutôt qu'utiliser Axios directement ?**
Pour centraliser la configuration commune : URL de base, headers par défaut, timeout, et surtout les **intercepteurs** d'authentification. Tous les appels partagent alors automatiquement ces réglages.

**Comment le token JWT est-il attaché à chaque requête ?**
Via un intercepteur de requête (`interceptors.request.use`). Avant l'envoi, il lit le token depuis `tokenService`, et si celui-ci existe, l'ajoute au header `Authorization: Bearer <token>`.

**Que se passe-t-il si le backend renvoie une erreur 401 ?**
L'intercepteur de réponse détecte le code 401 et appelle `deleteToken()` pour supprimer le token stocké. Cela force la déconnexion de l'utilisateur (session expirée).

**Comment l'URL du backend est-elle détectée automatiquement en développement ?**
Via `expo-constants` qui expose `Constants.expoConfig.hostUri` — l'adresse IP de la machine de développement vue par Expo Go. L'IP est extraite de cette valeur, ce qui évite de changer manuellement l'URL quand on change de réseau.

**Comment gère-t-on les erreurs Axios ?**
En distinguant les erreurs Axios (réponse HTTP reçue du serveur, ex. 404) des erreurs réseau (timeout, pas de connexion) via `axios.isAxiosError(error)`. Le message affiché vient de `error.response.data.detail` (champ renvoyé par FastAPI).

**Comment gère-t-on l'erreur `429 Too Many Requests` (rate limiting) dans l'app ?**
L'intercepteur de réponse Axios détecte le code `429`. Le hook `useAuth` expose un état `isTooManyRequests` ou déclenche un callback spécifique. Dans l'UI, un composant dédié `RateLimitModal` affiche un message explicatif invitant l'utilisateur à patienter avant de réessayer. Cela permet de différencier clairement une erreur d'identifiants (401) d'un blocage temporaire (429).

---

## 7. Internationalisation — i18next

**Qu'est-ce qu'i18next et pourquoi l'utiliser ?**
Une bibliothèque d'internationalisation (i18n) pour JavaScript. Elle permet d'afficher les textes de l'app dans plusieurs langues en séparant les chaînes du code. Le projet supporte le **français** et l'**anglais**.

**Comment la langue est-elle choisie dans le projet ?**
Elle est **fixée à `fr`** dans la configuration — il n'y a pas de détection automatique de la langue du téléphone. Elle peut être changée dynamiquement via `i18n.changeLanguage("en")`.

**Comment sont organisées les traductions ?**
Dans des fichiers JSON (`locales/fr.json`, `locales/en.json`) organisés par domaine : `common`, `auth`, `reminders`, etc. Chaque clé est accédée via `t("reminders.title")`.

**Comment utilise-t-on une traduction avec une variable dynamique ?**
Via l'interpolation : `t("reminders.delete_confirm", { name: reminder.title })` insère la valeur de `name` là où la traduction contient `{{name}}`.

**Comment consomme-t-on i18next dans un composant React Native ?**
Via le hook `useTranslation()` qui retourne la fonction `t`. On appelle `t("cle.de.traduction")` pour obtenir la chaîne traduite dans la langue courante.

**Comment récupère-t-on un tableau depuis les fichiers de traduction ?**
En passant l'option `{ returnObjects: true }` à la fonction `t`. Sans cette option, `t()` retourne une chaîne et ne peut pas retourner un tableau. Dans le projet, cette technique est utilisée dans `PlatformDatePicker` pour obtenir les listes de mois et de jours de la semaine : `t('common.pickersText.months', { returnObjects: true }) as string[]`. L'assertion `as string[]` est nécessaire car TypeScript pense que le retour est toujours un `string`.

---

## 8. Stockage sécurisé — SecureStore & AsyncStorage

**Quelle est la différence entre SecureStore et AsyncStorage ?**
`SecureStore` chiffre les données en utilisant le Keychain (iOS) ou le Keystore (Android) — adapté aux données sensibles comme les tokens. `AsyncStorage` est un stockage clé/valeur simple, **non chiffré**, persistant entre les sessions — adapté aux données non sensibles.

**Pourquoi ne pas utiliser SecureStore directement dans les composants ?**
Le projet encapsule SecureStore dans `tokenService.ts` qui expose des fonctions (`saveToken`, `getToken`, `deleteToken`…). Cela cache les noms des clés internes, centralise la logique, et facilite les mocks dans les tests.

**Qu'est-ce qui est stocké dans SecureStore dans le projet ?**
Le token JWT (`auth_token`) et les informations de l'utilisateur connecté (`user_info`).

**Qu'est-ce qui est stocké dans AsyncStorage dans le projet ?**
Les identifiants des notifications locales programmées (`notification_ids_<reminderId>`), pour pouvoir les annuler si le rappel est supprimé ou modifié.

| Donnée               | Stockage              | Raison                              |
| -------------------- | --------------------- | ----------------------------------- |
| Token JWT            | `SecureStore`         | Sensible — chiffré dans le keychain |
| Infos utilisateur    | `SecureStore`         | Sensible                            |
| IDs de notifications | `AsyncStorage`        | Non sensible, persistence légère    |
| Données de session   | `useState` / Contexte | En mémoire seulement                |

---

## 9. Notifications push — côté mobile

**Quel est le flux complet d'une notification push ?**

1. L'app demande la permission à l'OS
2. Elle obtient un token Expo push unique à l'appareil
3. Elle envoie ce token au backend (`POST /api/push-tokens`) qui le stocke en DB
4. Le worker (APScheduler) détecte un rappel à envoyer
5. Il envoie la notification via l'API Expo Push
6. L'appareil reçoit la notification

**Pourquoi le `projectId` Expo est-il obligatoire lors de l'enregistrement ?**
Sans `projectId`, l'API Expo Push ne peut pas identifier à quelle application appartient le token. Une erreur est levée à l'exécution si ce paramètre est absent.

**Pourquoi vérifier `Device.isDevice` avant d'enregistrer ?**
Les simulateurs ne peuvent pas recevoir de notifications push. Sans cette vérification, l'appel à l'API Expo échouerait sur simulateur.

**Qu'est-ce que `scheduleReminderWithRepetitions` fait concrètement ?**
Elle programme **5 notifications locales** par rappel : 4 pour l'utilisateur (à T+0, T+2min, T+5min, T+10min) et 1 alerte pour l'aidant (à T+10min). Les IDs de ces notifications sont persistés dans AsyncStorage pour permettre leur annulation ultérieure.

**Quelle est la différence entre notification push et notification locale ?**
Une notification push vient du serveur via un service externe (Expo Push API → APNs/FCM → appareil). Une notification locale est programmée directement sur l'appareil par l'application, sans passer par un serveur — elle fonctionne même hors ligne.

---

## 10. Tests — Jest & Testing Library

**Quelle est la différence entre Jest et React Native Testing Library ?**
Jest est le **runner** de tests : il exécute les fichiers de test, gère les mocks, mesure la couverture. React Native Testing Library (RNTL) est une **bibliothèque de rendu** qui permet de monter des composants dans les tests et de les interroger comme un utilisateur le ferait.

**Quel est le principe de React Native Testing Library ?**
Tester les composants du point de vue de l'utilisateur, pas des détails d'implémentation. On cible les éléments par leur texte visible, leur rôle d'accessibilité, ou leur `testID` en dernier recours — pas par des noms de classes ou leur état interne.

**Citez les méthodes de requête principales de RNTL dans l'ordre de préférence.**

1. `getByText()` — cherche par texte visible
2. `getByRole()` — cherche par rôle d'accessibilité (button, heading…)
3. `getByTestId()` — cherche par `testID` (en dernier recours)

**Comment teste-t-on un appel API asynchrone dans un composant ?**
On mock le service avec `jest.spyOn(...).mockResolvedValue(...)`, on rend le composant, puis on utilise `waitFor()` pour attendre que l'affichage soit mis à jour après la résolution de la promesse.

**Comment mock-t-on un module natif Expo dans les tests ?**
Avec `jest.mock("expo-secure-store", () => ({ ... }))` qui remplace le module par un objet avec des fonctions factices (`jest.fn()`). Cela permet de tester sans dépendre des APIs natives indisponibles dans l'environnement Node.js de Jest.

**Pourquoi y a-t-il une configuration `transformIgnorePatterns` complexe dans Jest ?**
Parce que les modules Expo et React Navigation sont distribués en ESM (modules ES non transpilés). Jest utilise CommonJS par défaut, donc il faut lui dire explicitement de transpiler ces packages via Babel, en les excluant de la liste des dossiers ignorés.

---

## 11. ESLint & Prettier

**Quelle est la différence entre ESLint et Prettier ?**
ESLint est un **linter** : il analyse le code pour trouver des erreurs logiques, des mauvaises pratiques, et des violations de conventions. Prettier est un **formateur** : il réécrit automatiquement le code pour qu'il soit toujours cohérent visuellement (indentation, guillemets, virgules…). Ils sont complémentaires.

**Quelles sont les deux règles fondamentales des hooks React (enforced par ESLint) ?**

1. **Appeler les hooks uniquement au niveau supérieur** — jamais dans un `if`, une boucle ou une fonction imbriquée. Cela garantit que l'ordre des appels est toujours identique entre les renders.
2. **Appeler les hooks uniquement dans des composants React ou des hooks personnalisés** — jamais dans une fonction utilitaire classique.

**Que vérifie la règle `react-hooks/exhaustive-deps` ?**
Elle avertit quand le tableau de dépendances d'un `useEffect` est incomplet : si une variable externe est utilisée dans le callback mais absente du tableau, le comportement peut être périmé (_stale closure_).

**Que fait `@typescript-eslint/no-explicit-any` ?**
Avertit lorsqu'on utilise le type `any` explicitement. `any` désactive le typage TypeScript — l'utiliser revient à perdre tous les bénéfices du typage statique.

---

## Récapitulatif — technologies et rôles

| Technologie                  | Rôle                                    |
| ---------------------------- | --------------------------------------- |
| TypeScript                   | Langage (typage statique de JavaScript) |
| React Native                 | Framework mobile iOS/Android            |
| Expo                         | SDK natif + outils de dev               |
| React Navigation             | Navigation (Stack + BottomTabs)         |
| Axios                        | Client HTTP vers le backend             |
| i18next                      | Internationalisation (fr/en)            |
| AsyncStorage                 | Stockage local non chiffré              |
| expo-secure-store            | Stockage chiffré (JWT)                  |
| expo-notifications           | Notifications push + locales            |
| expo-haptics                 | Retour haptique                         |
| Jest                         | Runner de tests                         |
| React Native Testing Library | Tests de composants                     |
| ESLint                       | Analyse statique du code                |
| Prettier                     | Formatage automatique du code           |
