import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";
import { ProfileProvider } from "../context/ProfileContext";
import { PostsProvider } from "../context/PostsContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <PostsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PostsProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
