/**
 * My Posts screen — view and manage all posts the logged-in user has written.
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { usePosts } from "../context/PostsContext";
import { useProfile } from "../context/ProfileContext";
import PostCard from "../components/PostCard";

export default function MyPostsScreen() {
  const { colors } = useTheme();
  const { posts, deletePost } = usePosts();
  const { profile } = useProfile();

  const myPosts = posts.filter((p) => p.username === profile.username);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>MY POSTS</Text>
        <TouchableOpacity
          onPress={() => router.push("/create-post")}
          style={[styles.createBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {myPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="newspaper-outline" size={56} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.primary }]}>No posts yet</Text>
          <Text style={[styles.emptyBody, { color: colors.secondaryText }]}>
            Share something with the community — a question, a tip, or a cool find.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/create-post")}
            style={[styles.createLargeBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.createLargeBtnText}>Create your first post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {myPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              colors={colors}
              onEdit={() => router.push(`/edit-post/${post.id}` as any)}
              onDelete={() => deletePost(post.id)}
            />
          ))}
          <View style={{ height: 24 }} />
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
  title: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  createLargeBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, marginTop: 8 },
  createLargeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
