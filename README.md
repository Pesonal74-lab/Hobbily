# Hobbily

A community-driven mobile app for teenagers to share posts, explore hobbies, and connect locally — built with Expo and React Native.

---

## Features

### Posts
- Full feed of community posts, newest first
- Create posts with a title, body, and optional tags — Cancel button discards changes
- Edit your own posts — shows a `✎ edited` badge on the card and detail view
- Delete posts with a custom confirmation modal (no accidental deletions)
- Tap any post to open the full detail view

### Comments
- View all comments on a post with author and date
- Add a comment — persists across app restarts; "Replying as @username" label for context
- Edit your own comments inline — `✎ edited` badge appears after saving
- Delete your own comments — soft-deleted (shows "This comment was deleted." placeholder to preserve thread structure)
- Confirmation modal before deleting

### Likes & Sharing
- Like any post with a heart icon — one like per account (tap again to unlike)
- Like count displayed on both the feed card and the full post view
- Share any post via the native system share sheet

### Profile
- Edit username, age (validated 13–150), and bio
- Manage hobby tags with a two-press delete system:
  - First tap turns a tag red
  - Second tap removes it; tapping elsewhere cancels the pending delete
- All changes confirmed with a modal before saving to on-device storage

### Weather
- Current conditions with temperature and description
- 3-day forecast
- City search with autocomplete
- Last selected city remembered across sessions

### UI / UX
- Swipe left/right between Feed and Profile tabs with a smooth slide animation
- Custom `ConfirmModal` component — themed, animated, replaces all system alerts
- Light and dark mode (follows system preference; toggle in Profile)
- Safe area handling — no content hidden behind notches or status bars
- Keyboard-avoiding reply box on the comments screen

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 / React Native 0.81 |
| Language | TypeScript ~5.9 |
| Routing | [Expo Router](https://expo.github.io/router/) v6 (file-based) |
| State | React Context API + `useState` / `useEffect` |
| Persistence | [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) |
| Animation | React Native `Animated` API + `PanResponder` (no extra packages) |
| Weather API | [OpenWeatherMap](https://openweathermap.org/api) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Future backend | [Appwrite](https://appwrite.io) (planned for Phase 2) |

---

## Project Structure

```
app/
├── _layout.tsx              # Root layout — mounts ThemeProvider, ProfileProvider, PostsProvider
├── create-post.tsx          # Create post screen (Cancel + Create buttons)
├── edit-post/
│   └── [id].tsx             # Edit post screen (pre-filled; Cancel + Save buttons)
├── post/
│   └── [id].tsx             # Post detail + comments screen (likes, share, edit/delete comments)
└── (tabs)/
    ├── _layout.tsx          # Bottom tab bar configuration
    ├── index.tsx            # Home feed + weather widget (swipe left → Profile)
    └── profile.tsx          # Profile editor + dark mode toggle (swipe right → Feed)

components/
├── PostCard.tsx             # Feed card — edit/delete, like count, share button
├── TagChip.tsx              # Tag pill (supports two-press delete)
├── ConfirmModal.tsx         # Themed confirmation/error modal (replaces Alert)
├── WeatherBox.tsx           # Weather widget with forecast and city search
├── InputField.tsx           # Labelled text input
├── PrimaryButton.tsx        # Primary action button
└── InfoBox.tsx              # Generic key/value display

context/
├── ThemeContext.tsx          # Light/dark color tokens + toggle
├── ProfileContext.tsx        # User profile state (loaded from storage)
└── PostsContext.tsx          # Posts state + CRUD (create, edit, delete, like, comments)

services/
├── postsService.ts          # AsyncStorage CRUD — posts, comments (edit/soft-delete), likes
├── profileService.ts        # AsyncStorage load/save for profile
└── weatherService.ts        # OpenWeatherMap API calls

types/
├── Post.ts                  # Post type (includes likes[]) and Comment type (editedAt, deletedAt)
└── Profile.ts               # Profile type definition
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
> The app includes a fallback key for local development so it works without `.env`.

### Running the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Architecture Notes

**Data flow:**
`AsyncStorage` ← `services/` ← `context/` ← screens & components

- Services handle all storage I/O in one place — swapping to Appwrite later only requires changing service files.
- Contexts provide optimistic in-memory state so the UI responds instantly without waiting for storage.
- Provider nesting order: `ThemeProvider` → `ProfileProvider` → `PostsProvider` (posts need the current username from profile).
- Comments are soft-deleted (a `deletedAt` timestamp is set) rather than removed, so thread structure is preserved.
- Likes are stored as `string[]` (array of usernames) on each post — one like per user, enforced in the service layer.

---

## Roadmap

### Phase 2 — Backend & Auth (Planned)
- [ ] Appwrite integration (replace AsyncStorage services)
- [ ] User authentication (sign up / log in)
- [ ] Cloud-synced posts, comments, and profiles
- [ ] HuggingFace AI — auto-tagging, content moderation

### Phase 3 — Social Features (Future)
- [ ] Post search and filtering
- [ ] Direct messaging
- [ ] Region-based communities
- [ ] Push notifications
- [ ] Moderation tools

### Completed
- [x] Like / reaction system (heart icon, per-user, persisted)
- [x] Comment editing and soft-deletion
- [x] Native share sheet integration
- [x] Swipe navigation between tabs with slide animation
- [x] Custom themed confirmation modals

---

## Credits

**Developer:** [ChuffenMarble](https://github.com/ChuffenMarble)
**Architecture guidance:** Claude (Anthropic)

---

## License

For educational and developmental purposes. Licensing TBD in a future release.
