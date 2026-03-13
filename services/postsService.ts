/**
 * postsService
 * All AsyncStorage I/O for posts lives here.
 *
 * Keeping storage logic separate from the context means swapping to a real
 * backend (e.g. Appwrite) later only requires changes to this file — all
 * screens and context code remain untouched.
 *
 * Storage format: a single JSON array of Post objects under POSTS_KEY.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Post, Comment } from "../types/Post";

const POSTS_KEY = "hobbily_posts";

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Reads and deserialises the stored posts array, returning [] if nothing is saved */
export async function loadPosts(): Promise<Post[]> {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Post[];
}

/** Serialises and writes the full posts array to storage */
async function savePosts(posts: Post[]): Promise<void> {
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// ── Public CRUD operations ────────────────────────────────────────────────────

/**
 * Creates a new post, prepends it to the list (newest first), persists, and
 * returns the created Post so the context can optimistically update state.
 */
export async function createPost(
  title: string,
  body: string,
  username: string,
  tags: string[]
): Promise<Post> {
  const posts = await loadPosts();
  const newPost: Post = {
    id: Date.now().toString(), // simple unique ID — replaced by Appwrite $id later
    title,
    body,
    username,
    tags,
    createdAt: new Date().toISOString(),
    comments: [],
    likes: [],
  };
  await savePosts([newPost, ...posts]);
  return newPost;
}

/**
 * Updates the title, body, tags, and editedAt of an existing post.
 * Throws if the post ID is not found.
 */
export async function editPost(
  id: string,
  title: string,
  body: string,
  tags: string[]
): Promise<Post> {
  const posts = await loadPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Post not found");

  const updated: Post = {
    ...posts[index],
    title,
    body,
    tags,
    editedAt: new Date().toISOString(),
  };
  posts[index] = updated;
  await savePosts(posts);
  return updated;
}

/**
 * Removes a post (and all its comments) from storage by ID.
 * Silently no-ops if the ID doesn't exist.
 */
export async function deletePost(id: string): Promise<void> {
  const posts = await loadPosts();
  await savePosts(posts.filter((p) => p.id !== id));
}

/**
 * Appends a new comment to the specified post and persists the change.
 * Returns the created Comment so the context can optimistically update state.
 */
export async function addComment(
  postId: string,
  username: string,
  content: string
): Promise<Comment> {
  const posts = await loadPosts();
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) throw new Error("Post not found");

  const newComment: Comment = {
    id: Date.now().toString(),
    postId,
    username,
    content,
    createdAt: new Date().toISOString(),
  };
  posts[index].comments = [...posts[index].comments, newComment];
  await savePosts(posts);
  return newComment;
}

/**
 * Edits an existing comment's content and stamps editedAt.
 * Returns the updated Comment so the context can optimistically update state.
 */
export async function editComment(
  postId: string,
  commentId: string,
  content: string
): Promise<Comment> {
  const posts = await loadPosts();
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) throw new Error("Post not found");

  const commentIndex = posts[postIndex].comments.findIndex((c) => c.id === commentId);
  if (commentIndex === -1) throw new Error("Comment not found");

  const updated: Comment = {
    ...posts[postIndex].comments[commentIndex],
    content,
    editedAt: new Date().toISOString(),
  };
  posts[postIndex].comments[commentIndex] = updated;
  await savePosts(posts);
  return updated;
}

/**
 * Soft-deletes a comment by stamping deletedAt.
 * The content is preserved in storage but the UI shows a "deleted" placeholder.
 * Returns the updated Comment so the context can optimistically update state.
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<Comment> {
  const posts = await loadPosts();
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) throw new Error("Post not found");

  const commentIndex = posts[postIndex].comments.findIndex((c) => c.id === commentId);
  if (commentIndex === -1) throw new Error("Comment not found");

  const updated: Comment = {
    ...posts[postIndex].comments[commentIndex],
    deletedAt: new Date().toISOString(),
  };
  posts[postIndex].comments[commentIndex] = updated;
  await savePosts(posts);
  return updated;
}

/**
 * Toggles a like on a post for the given username (one like per user).
 * If the user already liked it, their like is removed (unlike).
 * Returns the updated Post so the context can optimistically update state.
 */
export async function likePost(postId: string, username: string): Promise<Post> {
  const posts = await loadPosts();
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) throw new Error("Post not found");

  const current = posts[index];
  const currentLikes = current.likes ?? [];
  const updatedLikes = currentLikes.includes(username)
    ? currentLikes.filter((u) => u !== username) // unlike
    : [...currentLikes, username];                // like

  const updated: Post = { ...current, likes: updatedLikes };
  posts[index] = updated;
  await savePosts(posts);
  return updated;
}
