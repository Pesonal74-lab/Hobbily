/**
 * CommunityContext
 * Manages hobby channels and their messages. Channels are predefined; messages
 * are stored in AsyncStorage. Users can join channels and post messages.
 */
import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Channel, CommunityMessage } from "../types/CommunityMessage";

const MESSAGES_KEY = "@hobbily_community_messages";
const JOINED_KEY = "@hobbily_joined_channels";

/** Predefined hobby channels — covers common teen interests */
export const DEFAULT_CHANNELS: Channel[] = [
  { id: "photography", name: "Photography", icon: "camera-outline", description: "Share shots, tips, and camera gear", members: 142 },
  { id: "music", name: "Music", icon: "musical-notes-outline", description: "Instruments, playlists, and gigs", members: 218 },
  { id: "drawing", name: "Drawing & Art", icon: "color-palette-outline", description: "Sketches, paintings, and digital art", members: 189 },
  { id: "coding", name: "Coding", icon: "code-slash-outline", description: "Projects, tutorials, and coding challenges", members: 97 },
  { id: "sports", name: "Sports", icon: "football-outline", description: "Football, basketball, running, and more", members: 263 },
  { id: "cooking", name: "Cooking", icon: "restaurant-outline", description: "Recipes, food hacks, and kitchen tips", members: 134 },
  { id: "gaming", name: "Gaming", icon: "game-controller-outline", description: "Reviews, strategies, and game nights", members: 301 },
  { id: "reading", name: "Reading", icon: "book-outline", description: "Book recs, reviews, and reading clubs", members: 88 },
  { id: "dance", name: "Dance", icon: "walk-outline", description: "Styles, videos, and local workshops", members: 112 },
  { id: "film", name: "Film & Video", icon: "videocam-outline", description: "Short films, reviews, and editing tips", members: 76 },
];

type CommunityContextType = {
  channels: Channel[];
  messages: Record<string, CommunityMessage[]>;
  joinedChannelIds: string[];
  isLoading: boolean;
  joinChannel: (id: string) => Promise<void>;
  leaveChannel: (id: string) => Promise<void>;
  sendMessage: (channelId: string, author: string, text: string) => Promise<void>;
  deleteMessage: (channelId: string, messageId: string) => Promise<void>;
};

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Record<string, CommunityMessage[]>>({});
  const [joinedChannelIds, setJoinedChannelIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rawMessages, rawJoined] = await Promise.all([
          AsyncStorage.getItem(MESSAGES_KEY),
          AsyncStorage.getItem(JOINED_KEY),
        ]);
        if (rawMessages) setMessages(JSON.parse(rawMessages));
        if (rawJoined) setJoinedChannelIds(JSON.parse(rawJoined));
        else setJoinedChannelIds(["photography", "sports"]); // sensible defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persistMessages(updated: Record<string, CommunityMessage[]>) {
    setMessages(updated);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  }

  async function persistJoined(updated: string[]) {
    setJoinedChannelIds(updated);
    await AsyncStorage.setItem(JOINED_KEY, JSON.stringify(updated));
  }

  async function joinChannel(id: string) {
    if (!joinedChannelIds.includes(id)) {
      await persistJoined([...joinedChannelIds, id]);
    }
  }

  async function leaveChannel(id: string) {
    await persistJoined(joinedChannelIds.filter((c) => c !== id));
  }

  async function sendMessage(channelId: string, author: string, text: string) {
    const msg: CommunityMessage = {
      id: Date.now().toString(),
      channelId,
      author,
      text,
      createdAt: new Date().toISOString(),
    };
    const existing = messages[channelId] ?? [];
    await persistMessages({ ...messages, [channelId]: [...existing, msg] });
  }

  async function deleteMessage(channelId: string, messageId: string) {
    const updated = (messages[channelId] ?? []).filter((m) => m.id !== messageId);
    await persistMessages({ ...messages, [channelId]: updated });
  }

  return (
    <CommunityContext.Provider
      value={{
        channels: DEFAULT_CHANNELS,
        messages,
        joinedChannelIds,
        isLoading,
        joinChannel,
        leaveChannel,
        sendMessage,
        deleteMessage,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used inside CommunityProvider");
  return ctx;
}
