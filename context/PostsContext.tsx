/**
 * PostsContext
 * Provides shared posts state to the entire app.
 *
 * On mount it loads all posts from AsyncStorage via postsService.
 * Each mutation function persists the change via the service, then applies
 * an optimistic update to the in-memory state so the UI responds instantly.
 *
 * Provider hierarchy:  ThemeProvider → ProfileProvider → PostsProvider
 * (PostsProvider sits inside ProfileProvider so it can read the current username)
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Post } from "../types/Post";
import {
  loadPosts,
  createPost as persistCreate,
  editPost as persistEdit,
  deletePost as persistDelete,
  addComment as persistAddComment,
  editComment as persistEditComment,
  deleteComment as persistDeleteComment,
  likePost as persistLike,
} from "../services/postsService";
import { useProfile } from "./ProfileContext";

/** Shape of everything exposed by this context */
type PostsContextType = {
  posts: Post[];
  /** True while the initial AsyncStorage load is in flight */
  isLoading: boolean;
  createPost: (title: string, body: string, tags: string[]) => Promise<void>;
  editPost: (id: string, title: string, body: string, tags: string[]) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  /** Edits an existing comment's content and stamps editedAt */
  editComment: (postId: string, commentId: string, content: string) => Promise<void>;
  /** Soft-deletes a comment — UI shows a "deleted" placeholder */
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  /** Toggles the current user's like on a post (one like per user) */
  likePost: (postId: string) => Promise<void>;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all persisted posts when the app first mounts
  useEffect(() => {
    loadPosts().then((loaded) => {
      setPosts(loaded);
      setIsLoading(false);
    });
  }, []);

  /** Creates a new post, prepends it to state (newest first), and persists */
  async function createPost(title: string, body: string, tags: string[]) {
    const newPost = await persistCreate(title, body, profile.username, tags);
    setPosts((prev) => [newPost, ...prev]);
  }

  /** Updates an existing post's title/body/tags and sets its editedAt timestamp */
  async function editPost(id: string, title: string, body: string, tags: string[]) {
    const updated = await persistEdit(id, title, body, tags);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  /** Removes a post (and all its comments) from state and storage */
  async function deletePost(id: string) {
    await persistDelete(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  /** Appends a new comment to the post's comments array in state and storage */
  async function addComment(postId: string, content: string) {
    const comment = await persistAddComment(postId, profile.username, content);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }

  /** Edits an existing comment's content and stamps editedAt */
  async function editComment(postId: string, commentId: string, content: string) {
    const updated = await persistEditComment(postId, commentId, content);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? updated : c)) }
          : p
      )
    );
  }

  /** Soft-deletes a comment by stamping deletedAt */
  async function deleteComment(postId: string, commentId: string) {
    const updated = await persistDeleteComment(postId, commentId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? updated : c)) }
          : p
      )
    );
  }

  /** Toggles the current user's like on a post */
  async function likePost(postId: string) {
    const updated = await persistLike(postId, profile.username);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  }

  return (
    <PostsContext.Provider
      value={{ posts, isLoading, createPost, editPost, deletePost, addComment, editComment, deleteComment, likePost }}
    >
      {children}
    </PostsContext.Provider>
  );
}

/** Hook to consume PostsContext — must be used inside PostsProvider */
export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used inside PostsProvider");
  return ctx;
}
