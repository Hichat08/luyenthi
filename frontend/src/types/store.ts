import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    classroom: string,
  ) => Promise<boolean>;
  signIn: (
    username: string,
    password: string,
    remember?: boolean,
  ) => Promise<boolean>;
  signInWithGoogle: (idToken: string, remember?: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
      hydrated: boolean;
    }
  >;
  activeConversationId: string | null;
  chatWindowOpen: boolean;
  chatUnreadCount: number;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  setChatWindowOpen: (open: boolean) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (
    conversation: Partial<Conversation> & Pick<Conversation, "_id">,
  ) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[],
  ) => Promise<void>;
  fetchCommunityConversation: () => Promise<void>;
  sendCommunityMessage: (content: string) => Promise<void>;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateProfile: (payload: {
    displayName: string;
    dateOfBirth: string;
    classroom: string;
  }) => Promise<boolean>;
  completeOnboarding: (payload: {
    schoolSchedule: {
      morning: { start: string; end: string };
      afternoon: { start: string; end: string };
    };
    studyGoals: {
      selectedSubjects: string[];
      subjects: {
        subject: string;
        currentScore: number;
        targetScore: number;
      }[];
    };
  }) => Promise<boolean>;
  updateStudyGoals: (payload: {
    studyGoals: {
      selectedSubjects: string[];
      subjects: {
        subject: string;
        currentScore: number;
        targetScore: number;
      }[];
    };
  }) => Promise<boolean>;
}
