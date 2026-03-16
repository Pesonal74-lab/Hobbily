# Hobbily

A community-driven mobile app for Palestinian and Israeli teenagers (13–18) to explore hobbies, manage their time, connect with peers who share the same interests, and discover local programs and clubs — built with Expo and React Native.

---

## The Problem

High schoolers from Palestinian and Israeli communities lack time and resources to explore their interests outside school. With few opportunities for personal growth, their creativity and well-being often suffer, limiting their potential.

## Our Solution

An app that helps teens manage their time, communicate with others about shared hobbies, share equipment and knowledge locally, and find geographical guidance to facilities where they can learn or improve their hobby.

---

## Features

### Authentication & Onboarding (OOBE)
- Sign up or sign in with email and password (Firebase Auth)
- Full Windows-style OOBE flow: create account → pick hobbies → set free time → enter name/bio → done
- Returning users are automatically skipped past account creation
- Age validation (13–150) with inline error and red border
- **Custom hobbies** — type any hobby not in the predefined grid; added as removable chips

### Feed
- Scrollable community post feed, newest first (real-time via Firestore)
- Accessible via the **Feed** quick action on Home, or the **Posts** tab on Profile
- Create posts with a title, body, and optional tags (pencil button in feed header)
- Edit your own posts — shows a `✎ edited` badge
- Delete posts with a custom confirmation modal
- Tap any post to open the full detail view with comments

### Comments
- View all comments with author and date
- Add, edit, and soft-delete your own comments
- Soft-deleted comments show a placeholder to preserve thread structure

### Likes & Sharing
- Like / unlike any post (one like per account)
- Share any post via the native system share sheet

### Schedule (Time Management)
- 7-day scrollable calendar strip with dot indicators for days that have items
- Add tasks or hobby sessions with title, type, time, and duration
- Quick-add a 30-min session directly from your profile hobbies
- Mark items complete with a per-day progress bar
- **Daily hobby reminder** — a banner shown once per day encouraging 5–10 min of hobby practice
- Toggle the daily reminder on/off with a switch
- Add/edit modal dismisses by tapping the backdrop or swiping down

### Community
- 10 predefined hobby channels: Photography, Music, Sports, Coding, Drawing & Art, Cooking, Gaming, Reading, Dance, Film & Video
- Real-time messages synced via Firestore (`onSnapshot`)
- Search channels and filter between "All" and "My Channels"
- Channel suggestions based on your profile hobbies
- Join / leave channels; send and delete messages
- Realistic seed messages pre-populate channels for a better first-run experience
- Keyboard-avoiding input bar — the chat input stays above the keyboard on both iOS and Android

### Opportunities (Explore)
- Browse 12 real programs and clubs for teens in Israel and Palestine
- Search by hobby, location, organisation name, or category
- Filter by category (Sports, Music, Art, Coding, Cooking, etc.)
- Tap any card for full details: highlights, location, age range, cost, and direct contact / registration links

### Profile
- Hero card with initials avatar, name, city, and bio
- Stats row: current streak 🔥, best streak, total sessions, total practice time
- **Edit tab** — username, age (validated 13–150), city, bio, hobby tags (blue, two-press delete)
- **Posts tab** — view and manage all posts you've written; create new ones from the pencil icon
- **Badges tab** — 7 achievements, earned ones shown in solid blue; locked ones faded
- **Settings tab** — dark mode toggle, daily reminder toggle, account info card
- **Log Out** button with confirmation modal
- **Delete Account** — 3-step confirmation: check "I understand" + type `DELETE` + enter password; removes all Firestore data and the Firebase Auth account
- **Reset dismissed tips** — restores all "don't show again" tip banners and the daily reminder banner

### Progress & Streaks
- Current streak, longest streak, total sessions, and total practice minutes — all persisted to Firestore
- 7 achievements auto-unlocked as you hit milestones
- **Streak Freeze** — one freeze per week; automatically granted on session record; prevents streak loss for one missed day

### Tips & "Don't Show Again"
- Feed tip: share your first post
- Community tip: join channels matching your hobbies
- All tips are permanently dismissible with one tap
- Reset all tips from Profile → Settings → Tips & Hints

### UI / UX
- **Mockup-aligned design:** lavender background `#B8C4E4`, dark navy `#1B2D6B`, coral accent `#E86B5E`
- **3-tab navigation:** Home, Community, Profile — Planner and Explore accessed via quick action buttons
- Swipe left/right between the 3 main tabs with smooth slide animation
- Tab bar respects Android navigation bar and iPhone home indicator (no collision with system buttons)
- Custom `ConfirmModal` — themed, replaces all system alerts
- Light and dark mode, follows system preference or toggled manually
- Safe area handling throughout — no content hidden behind notches or status bars
- Animated splash screen fades out once all data has loaded
- All screens use a consistent "Back" button header when navigated to as sub-screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | TypeScript ~5.9 |
| Routing | [Expo Router](https://expo.github.io/router/) v6 (file-based) |
| Auth | [Firebase Auth](https://firebase.google.com/products/auth) (email/password) |
| Database | [Cloud Firestore](https://firebase.google.com/products/firestore) (real-time) |
| Local storage | [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) (tips, tasks, channel prefs) |
| State | React Context API + `useState` / `useEffect` |
| Gestures | [`react-native-gesture-handler`](https://docs.swmansion.com/react-native-gesture-handler/) v2 |
| Animation | [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/) v4 |
| Weather API | [wttr.in](https://wttr.in) (free, no API key required) |
| Icons | `@expo/vector-icons` (Ionicons) |

---

## Project Structure

```
app/
├── _layout.tsx              # Root layout — AuthProvider, all providers, splash screen, auth gate
├── onboarding.tsx           # Full OOBE flow (sign up/in, hobbies, free time, profile setup)
├── feed.tsx                 # Community feed — all posts, create button in header
├── create-post.tsx          # Create post screen
├── edit-post/[id].tsx       # Edit post screen
├── post/[id].tsx            # Post detail + comments screen
└── (tabs)/
    ├── _layout.tsx          # Bottom tab bar (3 visible tabs, safe-area-aware height)
    ├── index.tsx            # Home dashboard — greeting, schedule, streak, suggested, quick actions (tab 0)
    ├── community.tsx        # Hobby channels + real-time chat (tab 1)
    ├── profile.tsx          # Profile — interests, streak badge, settings, posts, badges (tab 2)
    ├── time-manager.tsx     # Planner — weekly grid, add sessions/tasks, hobby time (hidden, stack nav)
    └── opportunities.tsx    # Explore — programs & clubs, search + map, register buttons (hidden, stack nav)

components/
├── SwipeableTab.tsx         # Reusable swipe-to-navigate wrapper for all tab screens
├── PostCard.tsx             # Feed card — edit/delete, like, share
├── TagChip.tsx              # Tag pill (supports two-press delete, custom colour)
├── ConfirmModal.tsx         # Themed confirmation/error modal
├── TipBanner.tsx            # Dismissible "don't show again" tip card + TIP_KEYS export
├── WeatherBox.tsx           # Weather widget with forecast and city search
├── InputField.tsx           # Labelled text input
└── PrimaryButton.tsx        # Primary action button

context/
├── AuthContext.tsx           # Firebase Auth — signUp, signIn, signOut, deleteAccount
├── ThemeContext.tsx          # Hobbily colour tokens + light/dark toggle
├── ProfileContext.tsx        # User profile state (Firestore-backed)
├── PostsContext.tsx          # Real-time posts feed (Firestore onSnapshot)
├── TimeContext.tsx           # Tasks, hobby sessions, daily reminder (AsyncStorage)
├── CommunityContext.tsx      # Channels, real-time messages (Firestore), joined channels (AsyncStorage)
└── ProgressContext.tsx       # Streaks, sessions, achievements (Firestore)

services/
├── postsService.ts          # Firestore CRUD — posts, comments, likes
├── profileService.ts        # Firestore load/save for profile
└── weatherService.ts        # OpenWeatherMap API calls

lib/
└── firebase.ts              # Firebase app, Auth (AsyncStorage persistence), Firestore

types/
├── Post.ts                  # Post and Comment types
├── Profile.ts               # Profile type
├── Task.ts                  # Task / hobby session type
├── CommunityMessage.ts      # Channel and CommunityMessage types
└── Progress.ts              # ProgressState and Achievement types
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) LTS
- [Expo Go](https://expo.dev/client) on your Android device, **or** an emulator

### Installation

```bash
git clone https://github.com/ChuffenMarble/Hobbily.git
cd Hobbily
npm install
npx expo install firebase @react-native-async-storage/async-storage
```

### Running the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator.

---

## Architecture Notes

**Data flow:**
`Firebase Firestore / Auth` ← `lib/firebase.ts` ← `services/` + `context/` ← screens & components

- **AuthContext** is the outermost provider — all other contexts depend on `useAuth()` for `user.uid`.
- **Firestore** stores posts, profiles, progress, and community messages; real-time `onSnapshot` listeners keep the UI in sync without manual refresh.
- **AsyncStorage** stores local-only preferences: tasks, joined channel list, and dismissed tip keys.
- Provider order: `AuthProvider → ThemeProvider → ProfileProvider → PostsProvider → TimeProvider → CommunityProvider → ProgressProvider`.
- Comments are soft-deleted (a `deletedAt` timestamp is set) to preserve thread structure.
- The `SwipeableTab` component wraps every tab screen; it uses `react-native-gesture-handler`'s `GestureDetector` with `failOffsetY` so the gesture fails immediately if the user moves vertically first — vertical `ScrollView`s inside tabs are never blocked. Snap-back uses `withTiming` (no spring bounce).
- The splash screen fades out only once `isAuthLoaded && isLoaded && !isLoading` — preventing any flash of wrong content.
- `deleteAccount()` performs a full 7-step wipe: re-authenticate → delete all user posts → delete all community messages across every channel → clear AsyncStorage → delete `users/{uid}` + `progress/{uid}` documents → delete the Firebase Auth user. The resulting auth state change redirects to onboarding automatically.

---

## Roadmap

### Phase 3 — Social Features (Future)
- [ ] Post search and filtering
- [ ] Direct messaging
- [ ] Push notifications for daily reminders and community activity
- [ ] Moderation tools
- [ ] Map view for opportunities (show nearby clubs/programs)
- [ ] HuggingFace AI — auto-tagging, content moderation

### Completed
- [x] Firebase Auth — email/password sign up & sign in
- [x] Full Firestore integration — profiles, posts, community messages, progress
- [x] Real-time community messages via Firestore `onSnapshot`
- [x] Full OOBE onboarding flow (account → hobbies → free time → profile)
- [x] Streak tracking with 7 achievements and streak freeze
- [x] Log out with confirmation modal
- [x] Delete account — 2-step confirmation (checkbox + type DELETE)
- [x] Dismissible "don't show again" tip banners with Settings reset
- [x] Like / reaction system (heart icon, per-user, persisted)
- [x] Comment editing and soft-deletion
- [x] Native share sheet integration
- [x] Swipe navigation across all 5 tabs — bounce-free, vertical scroll safe (RNGH + Reanimated)
- [x] Live weather card on Home — current conditions + tap-to-expand 3-day forecast (wttr.in, no key)
- [x] Custom themed confirmation modals
- [x] Schedule / time management with daily hobby reminder
- [x] Community hobby channels with real-time messaging
- [x] Opportunities explorer (12 real Israeli/Palestinian programs)
- [x] Hobbily brand colour palette
- [x] Android navigation bar safe-area fix for tab bar
- [x] Animated splash screen
- [x] Community Feed screen — accessible from Home quick action; full post list with create button
- [x] Profile "Posts" tab — view and manage your own posts in-profile
- [x] Full mockup integration — lavender/navy/coral palette, 3-tab nav, all screens redesigned to match wireframe

---

## Credits

**Developer:** [ChuffenMarble](https://github.com/ChuffenMarble)
**Architecture guidance:** Claude (Anthropic)

---

## License

For educational and developmental purposes. Licensing TBD in a future release.
