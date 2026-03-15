/**
 * Feed screen (tab index 0)
 * Shows the weather widget at the top, then a scrollable list of all community posts.
 * Swipe left to go to Schedule, swipe right — no previous tab.
 */
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import WeatherBox from "../../components/WeatherBox";
import PostCard from "../../components/PostCard";
import SwipeableTab from "../../components/SwipeableTab";
import { fetchWeather } from "../../services/weatherService";
import { useTheme } from "../../context/ThemeContext";
import { usePosts } from "../../context/PostsContext";
import { useProfile } from "../../context/ProfileContext";
import { router } from "expo-router";

export default function FeedScreen() {
  const { colors } = useTheme();
  const { posts, deletePost, isLoading } = usePosts();
  const { profile, saveProfile } = useProfile();

  const [weather, setWeather] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    loadWeather(profile.preferredCity || "London");
  }, []);

  async function loadWeather(city: string) {
    const data = await fetchWeather(city);
    if (!data || data.cod === "404") return;
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

  return (
    <SwipeableTab tabIndex={0} backgroundColor={colors.background}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Hobbily</Text>
            <Text style={[styles.headerSub, { color: colors.secondaryText }]}>
              What's the community sharing?
            </Text>
          </View>
          <Image
            source={require("../../assets/images/Hobbily_Logo.png")}
            style={styles.headerLogo}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
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
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="newspaper-outline" size={44} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts yet</Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryText }]}>
                Be the first to share something with the community!
              </Text>
              <Pressable
                onPress={() => router.push("/create-post")}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: "#fff", fontWeight: "600" }}>Create a Post</Text>
              </Pressable>
            </View>
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
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  headerLogo: { width: 36, height: 36, resizeMode: "contain" },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  feedTitle: { fontSize: 18, fontWeight: "700" },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newPostBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  emptyBody: { textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
