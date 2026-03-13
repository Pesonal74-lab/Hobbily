TeenHub 📱🌍
A community-driven mobile app for teens to share ideas, hobbies, and connect locally.

📖 Project Description

TeenHub is a mobile application built with Expo (React Native) that allows teenagers to share posts, discuss ideas, showcase hobbies, and connect with others in their region in a safe and engaging way.

The app is designed with scalability in mind and follows best practices such as:

Organized project structure

Reusable components

React hooks (useState, useEffect)

Global theme management (Dark Mode)

API integration (Weather, future AI & database features)

This repository currently represents Milestone #1 & early Phase #2, focusing on a strong frontend foundation before full backend integration.

🚀 Features ✅ Core Features (Implemented)

Posts Feed

View community posts

Tap a post to view details and comments

Add comments to posts

Visual “edited” indicator for modified posts

Create Posts

Create posts with a title and body

Posts appear instantly (local state for now)

Profile Page

Edit username, age, and “About Me”

Age validation (13–150)

Hobby tags system:

Add custom hobby tags

Prevent duplicate tags

Delete tags with a confirm interaction

Save or cancel profile edits

Dark Mode

Toggle dark mode from profile page

Applies globally across:

Posts

Profile

Weather box

Comments

Navigation bar

High-contrast, accessibility-friendly colors

Weather Integration

Displays current local weather

Shows the date/time the app was opened

City search with autocomplete

Weather icons (sun, clouds, rain, etc.)

3-day forecast

Celsius units

Navigation

Bottom tab navigation with icons

Clean routing using expo-router

🛠️ Tech Stack

Frontend

Expo

React Native

TypeScript

Expo Router

State & Architecture

React Hooks (useState, useEffect)

Context API (Global Theme Context)

Reusable Components

APIs

OpenWeatherMap API (Weather & Forecast)

(Planned) HuggingFace APIs

Future Backend

Appwrite (Database, Auth, Storage)

📂 Project Structure app/ ├─ _layout.tsx # Root layout + Theme provider ├─ (tabs)/ # Bottom tab navigation │ ├─ index.tsx # Posts feed + weather │ ├─ profile.tsx # Profile editor + dark mode │ └─ _layout.tsx # Tabs configuration ├─ post/ │ └─ [id].tsx # Post detail + comments components/ ├─ PostCard.tsx # Reusable post component ├─ TagChip.tsx # Hobby tag component ├─ WeatherBox.tsx # Weather + forecast + search ├─ InfoBox.tsx # Reusable info display ├─ InputField.tsx # Reusable input └─ PrimaryButton.tsx # Reusable button context/ └─ ThemeContext.tsx # Global dark/light theme services/ └─ weatherService.ts # API communication

⚙️ Installation Guide 1️⃣ Prerequisites

Make sure you have installed:

Node.js (LTS recommended)

npm or yarn

Expo Go app on your phone

2️⃣ Clone the Repository git clone https://github.com/your-username/teenhub.git cd teenhub

3️⃣ Install Dependencies npm install

or

yarn install

4️⃣ Start the App npx expo start

Scan the QR code with Expo Go

Or run on an emulator

5️⃣ Environment Variables (Optional)

Currently, the OpenWeatherMap API key is hardcoded for development. In production, this will be moved to environment variables.

🧠 Development Goals (Milestone #1 Alignment)

This project satisfies all Milestone #1 objectives:

✔ Organized & professional folder structure

✔ Clean, commented code

✔ Usage of useState & useEffect

✔ Multiple reusable components

✔ Dynamic UI elements

✔ Ready for future backend & feature expansion

🗺️ Future Roadmap 🔜 Phase 2 (Planned / In Progress)

Persist data using Appwrite

User profiles

Posts & comments

Selected weather city

Authentication (login/signup)

HuggingFace AI:

Auto-tagging posts by topic

Content moderation / safety tools

Weather-based activity suggestions

Post search & filtering

Like / reaction system

🔮 Long-Term Ideas

Direct messaging

Region-based communities

Moderation tools

Notifications

Accessibility enhancements

👨‍💻 Developer Credits

Primary Developer:

ChuffenMarble

Built with guidance & architecture support from:

ChatGPT

📜 License

This project is currently for educational and developmental purposes. Licensing will be determined in future releases.