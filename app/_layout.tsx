import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ProfileProvider } from "../context/ProfileContext";
import { PostsProvider } from "../context/PostsContext";
import { usePosts } from "../context/PostsContext";
import { View, Image, Animated, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";

/** Renders the app stack with a logo splash that fades out once posts have loaded */
function AppShell() {
  const { isLoading } = usePosts();
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }
  }, [isLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {showSplash && (
        <Animated.View
          style={[styles.splash, { backgroundColor: colors.background, opacity }]}
          pointerEvents="none"
        >
          <Image
            source={require("../assets/images/Hobbily_Logo.png")}
            style={styles.splashLogo}
          />
        </Animated.View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <PostsProvider>
          <AppShell />
        </PostsProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
});
