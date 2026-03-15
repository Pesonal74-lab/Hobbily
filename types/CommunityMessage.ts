/** A single message posted in a hobby channel */
export type CommunityMessage = {
  id: string;
  channelId: string;
  author: string;
  text: string;
  createdAt: string;
};

/** A hobby-based discussion channel */
export type Channel = {
  id: string;
  name: string;
  /** Ionicons icon name */
  icon: string;
  description: string;
  /** Mock member count */
  members: number;
};
