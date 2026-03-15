import { Stack, router } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import { PostsProvider, usePosts } from "../context/PostsContext";
import { TimeProvider } from "../context/TimeContext";
import { CommunityProvider } from "../context/CommunityContext";
import { ProgressProvider } from "../context/ProgressContext";
import { Image, Animated, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";

function AppShell() {
  const { isLoading } = usePosts();
  const { profile, isLoaded } = useProfile();
  const { isAuthLoaded, user } = useAuth();
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const [showSplash, setShowSplash] = useState(true);
  const redirected = useRef(false);

  // Wait for Firebase auth state + Firestore profile load
  const allReady = isAuthLoaded && isLoaded && !isLoading;

  useEffect(() => {
    if (!allReady) return;
    Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
      setShowSplash(false);
      if (!redirected.current) {
        redirected.current = true;
        if (!user || !profile.hasOnboarded) {
          router.replace("/onboarding" as any);
        }
      }
    });
  }, [allReady]);

  // Redirect to onboarding when user signs out or deletes their account after initial load
  useEffect(() => {
    if (!redirected.current) return; // splash not done yet — initial effect handles this
    if (!user) {
      router.replace("/onboarding" as any);
    }
  }, [user]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {showSplash && (
        <Animated.View
          style={[styles.splash, { backgroundColor: colors.background, opacity }]}
          pointerEvents="none"
        >
          <Image source={require("../assets/images/Hobbily_Logo.png")} style={styles.splashLogo} />
        </Animated.View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProfileProvider>
          <PostsProvider>
            <TimeProvider>
              <CommunityProvider>
                <ProgressProvider>
                  <AppShell />
                </ProgressProvider>
              </CommunityProvider>
            </TimeProvider>
          </PostsProvider>
        </ProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  splashLogo: { width: 200, height: 200, resizeMode: "contain" },
});
