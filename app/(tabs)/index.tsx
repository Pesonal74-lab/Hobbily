/**
 * Home / Feed screen
 * Shows the weather widget at the top, then a scrollable list of all community posts.
 *
 * Swipe left to navigate to the Profile tab with a slide animation:
 *   - The screen slides left with the finger in real time.
 *   - Release past SWIPE_THRESHOLD → flies off-screen, then navigates.
 *   - Release short of threshold → springs back to centre.
 *
 * Animation notes:
 *   - Outer View has overflow:'hidden' so content clips cleanly at the screen edge.
 *   - Animated.View has backgroundColor so it's fully opaque while sliding.
 *   - SafeAreaView is INSIDE Animated.View so safe-area insets slide with the content.
 *   - onMoveShouldSetPanResponderCapture intercepts horizontal gestures before
 *     the ScrollView child can claim them, so the slide always works.
 *   - useFocusEffect resets translateX to 0 whenever this tab gains focus,
 *     ensuring the screen is always at the correct position when it appears.
 */
import {
  View,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
} from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import WeatherBox from "../../components/WeatherBox";
import PostCard from "../../components/PostCard";
import { fetchWeather } from "../../services/weatherService";
import { useTheme } from "../../context/ThemeContext";
import { usePosts } from "../../context/PostsContext";
import { useProfile } from "../../context/ProfileContext";
import { router } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 80;

export default function PostsScreen() {
  const { colors } = useTheme();
  const { posts, deletePost, isLoading } = usePosts();
  const { profile, saveProfile } = useProfile();

  const [weather, setWeather] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const translateX = useRef(new Animated.Value(0)).current;

  /**
   * Safety net: reset the slide position every time this tab comes into focus.
   * This guarantees the screen is at translateX=0 even if a previous navigation
   * left the native transform in a bad state.
   */
  useFocusEffect(
    useCallback(() => {
      translateX.setValue(0);
    }, [translateX])
  );

  useEffect(() => {
    loadWeather(profile.preferredCity || "London");
  }, []);

  async function loadWeather(city: string) {
    const data = await fetchWeather(city);
    setWeather({
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      condition: data.weather[0].main,
    });
    setCoords({ lat: data.coord.lat, lon: data.coord.lon });
  }

  async function handleCitySelect(city: string) {
    loadWeather(city);
    await saveProfile({ ...profile, preferredCity: city });
  }

  function snapBack() {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }

  const swipePan = useRef(
    PanResponder.create({
      // Capture phase so we get horizontal gestures before ScrollView can claim them
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < Math.abs(g.dx) * 0.5,

      // Track leftward drag only
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD && Math.abs(g.dy) < 120) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Navigate FIRST (this screen goes to background), THEN reset.
            // Resetting before navigation can leave the native transform in a
            // bad state when the tab comes back into view.
            router.navigate("/(tabs)/profile");
            translateX.setValue(0);
          });
        } else {
          snapBack();
        }
      },

      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, overflow: "hidden" }}>
      <Animated.View
        style={{ flex: 1, backgroundColor: colors.background, transform: [{ translateX }] }}
        {...swipePan.panHandlers}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          >
            {weather && (
              <WeatherBox
                weather={weather}
                coords={coords}
                onCitySelect={handleCitySelect}
                colors={colors}
              />
            )}

            <View style={styles.feedHeader}>
              <Text style={[styles.feedTitle, { color: colors.text }]}>Community Posts</Text>
              <Pressable
                onPress={() => router.push("/create-post")}
                style={[styles.newPostBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.newPostBtnText}>New Post</Text>
              </Pressable>
            </View>

            {!isLoading && posts.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No posts yet. Be the first to share something!
              </Text>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                colors={colors}
                onEdit={() => router.push(`/edit-post/${post.id}`)}
                onDelete={() => deletePost(post.id)}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  feedTitle: { fontSize: 20, fontWeight: "700" },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newPostBtnText: { color: "#fff", fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 32, fontSize: 15 },
});
