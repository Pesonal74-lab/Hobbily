# Hobbily

A community-driven mobile app for Palestinian and Israeli teenagers (13–18) to explore hobbies, manage their time, connect with peers who share the same interests, and discover local programs and clubs — built with Expo and React Native.

---

## The Problem

High schoolers from Palestinian and Israeli communities lack time and resources to explore their interests outside school. With few opportunities for personal growth, their creativity and well-being often suffer, limiting their potential.

## Our Solution

An app that helps teens manage their time, communicate with others about shared hobbies, share equipment and knowledge locally, and find geographical guidance to facilities where they can learn or improve their hobby.

---

## Features

### Feed
- Scrollable community post feed, newest first
- Create posts with a title, body, and optional tags
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

### Community
- 10 predefined hobby channels: Photography, Music, Sports, Coding, Drawing & Art, Cooking, Gaming, Reading, Dance, Film & Video
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
- Edit username, age (validated 13–150), and bio
- Manage hobby tags with a two-press delete system
- Avatar card showing your initial, name, and bio
- Light/dark mode toggle (sun/moon icon button)
- All changes confirmed with a modal before saving

### Weather
- Current conditions with temperature and description
- 3-day forecast
- City search with autocomplete
- Last selected city persisted across sessions

### UI / UX
- **Hobbily colour palette:** coral `#fc7273`, lavender `#cacef2`, navy `#032068`, black `#000000`
- Swipe left/right between all 5 tabs with a smooth slide animation
- Tab bar respects Android navigation bar and iPhone home indicator (no collision with system buttons)
- Custom `ConfirmModal` — themed, replaces all system alerts
- Light and dark mode, follows system preference or toggled manually
- Safe area handling throughout — no content hidden behind notches or status bars

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | TypeScript ~5.9 |
| Routing | [Expo Router](https://expo.github.io/router/) v6 (file-based) |
| State | React Context API + `useState` / `useEffect` |
| Persistence | [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) |
| Animation | React Native `Animated` API + `PanResponder` |
| Weather API | [OpenWeatherMap](https://openweathermap.org/api) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Future backend | [Appwrite](https://appwrite.io) (planned for Phase 2) |

---

## Project Structure

```
app/
├── _layout.tsx              # Root layout — ThemeProvider, ProfileProvider, PostsProvider, TimeProvider, CommunityProvider
├── create-post.tsx          # Create post screen
├── edit-post/[id].tsx       # Edit post screen
├── post/[id].tsx            # Post detail + comments screen
└── (tabs)/
    ├── _layout.tsx          # Bottom tab bar (5 tabs, safe-area-aware height)
    ├── index.tsx            # Feed + weather (tab 0)
    ├── time-manager.tsx     # Schedule / time management (tab 1)
    ├── community.tsx        # Hobby channels + chat (tab 2)
    ├── opportunities.tsx    # Programs & clubs explorer (tab 3)
    └── profile.tsx          # Profile editor + dark mode toggle (tab 4)

components/
├── SwipeableTab.tsx         # Reusable swipe-to-navigate wrapper for all tab screens
├── PostCard.tsx             # Feed card — edit/delete, like, share
├── TagChip.tsx              # Tag pill (supports two-press delete)
├── ConfirmModal.tsx         # Themed confirmation/error modal
├── WeatherBox.tsx           # Weather widget with forecast and city search
├── InputField.tsx           # Labelled text input
└── PrimaryButton.tsx        # Primary action button

context/
├── ThemeContext.tsx          # Hobbily colour tokens + light/dark toggle
├── ProfileContext.tsx        # User profile state
├── PostsContext.tsx          # Posts + comments + likes state
├── TimeContext.tsx           # Tasks, hobby sessions, daily reminder state
└── CommunityContext.tsx      # Channels, messages, joined channels state

services/
├── postsService.ts          # AsyncStorage CRUD — posts, comments, likes
├── profileService.ts        # AsyncStorage load/save for profile
└── weatherService.ts        # OpenWeatherMap API calls

types/
├── Post.ts                  # Post and Comment types
├── Profile.ts               # Profile type
├── Task.ts                  # Task / hobby session type
└── CommunityMessage.ts      # Channel and CommunityMessage types
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) LTS
- [Expo Go](https://expo.dev/client) on your iOS or Android device, **or** an emulator

### Installation

```bash
git clone https://github.com/ChuffenMarble/Hobbily.git
cd Hobbily
npm install
```

### Environment Variables

Copy the example file and add your API key:

```bash
cp .env.example .env
```

```env
# .env
EXPO_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key_here
```

> A free key can be obtained at [openweathermap.org](https://openweathermap.org/api).

### Running the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Architecture Notes

**Data flow:**
`AsyncStorage` ← `services/` ← `context/` ← screens & components

- Services handle all storage I/O — swapping to a backend (Appwrite) only requires replacing service files.
- Contexts provide optimistic in-memory state so the UI responds instantly.
- Provider nesting: `ThemeProvider` → `ProfileProvider` → `PostsProvider` → `TimeProvider` → `CommunityProvider`.
- Comments are soft-deleted (a `deletedAt` timestamp is set) to preserve thread structure.
- The `SwipeableTab` component wraps every tab screen; it reads `tabIndex` to know which tabs are adjacent, captures horizontal gestures (ignoring vertical scrolls), animates a slide, then calls `router.navigate()`.

---

## Roadmap

### Phase 2 — Backend & Auth (Planned)
- [ ] Appwrite integration (replace AsyncStorage services)
- [ ] User authentication (sign up / log in)
- [ ] Cloud-synced posts, comments, profiles, and community messages
- [ ] HuggingFace AI — auto-tagging, content moderation

### Phase 3 — Social Features (Future)
- [ ] Post search and filtering
- [ ] Direct messaging
- [ ] Push notifications for daily reminders and community activity
- [ ] Moderation tools
- [ ] Map view for opportunities (show nearby clubs/programs)

### Completed
- [x] Like / reaction system (heart icon, per-user, persisted)
- [x] Comment editing and soft-deletion
- [x] Native share sheet integration
- [x] Swipe navigation across all 5 tabs with slide animation
- [x] Custom themed confirmation modals
- [x] Schedule / time management with daily hobby reminder
- [x] Community hobby channels with local messaging
- [x] Opportunities explorer (12 real Israeli/Palestinian programs)
- [x] Hobbily brand colour palette
- [x] Android navigation bar safe-area fix for tab bar

---

## Credits

**Developer:** [ChuffenMarble](https://github.com/ChuffenMarble)
**Architecture guidance:** Claude (Anthropic)

---

## License

For educational and developmental purposes. Licensing TBD in a future release.
