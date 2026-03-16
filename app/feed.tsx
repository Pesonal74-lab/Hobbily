/**
 * Community Feed screen
 * Full scrollable list of all posts, newest first.
 * Navigated to from the Home quick actions button.
 */
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { usePosts } from "../context/PostsContext";
import PostCard from "../components/PostCard";

export default function FeedScreen() {
  const { colors } = useTheme();
  const { posts, isLoading, deletePost } = usePosts();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>FEED</Text>
        <TouchableOpacity onPress={() => router.push("/create-post")} style={[styles.createIconBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="newspaper-outline" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No posts yet — be the first!
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/create-post")}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.createBtnText}>Create a Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              colors={colors}
              onEdit={() => router.push(`/edit-post/${post.id}` as any)}
              onDelete={() => deletePost(post.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  createIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 16, textAlign: "center" },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { padding: 16 },
});
