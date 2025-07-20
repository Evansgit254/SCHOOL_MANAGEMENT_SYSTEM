"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Image from "next/image";

interface MessagingClientProps {
  userId: string;
  partners: string[];
  userRole: string;
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface UserInfo {
  id: string;
  username: string;
  name: string;
  surname: string;
  img?: string;
  type: string;
  displayName: string;
}

interface Conversation {
  user: UserInfo;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagingClient({ userId, partners, userRole }: MessagingClientProps) {
  const [selectedPartner, setSelectedPartner] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch recent conversations based on message history
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/messages?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const messages: Message[] = data.messages || [];
          // Build a map of partnerId -> last message
          const convMap: Record<string, Conversation> = {};
          messages.forEach(msg => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!convMap[partnerId] || new Date(msg.timestamp) > new Date(convMap[partnerId].lastMessage.timestamp)) {
              convMap[partnerId] = {
                user: { id: partnerId, username: partnerId, name: "", surname: "", type: "", displayName: partnerId },
                lastMessage: msg,
                unreadCount: 0,
              };
            }
            if (msg.receiverId === userId && !msg.read) {
              convMap[partnerId].unreadCount += 1;
            }
          });
          // Fetch user info for each partner
          const partnerIds = Object.keys(convMap);
          const userInfos = await Promise.all(partnerIds.map(async pid => {
            const res = await fetch(`/api/user-info?userId=${pid}`);
            if (res.ok) return await res.json();
            return { id: pid, username: pid, name: pid, surname: "", type: "", displayName: pid };
          }));
          userInfos.forEach(info => {
            if (convMap[info.id]) convMap[info.id].user = info;
          });
          setRecentConversations(Object.values(convMap).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()));
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, [userId]);

  // Search users with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        const url = `/api/messages/search-users?q=${encodeURIComponent(searchQuery)}`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.users || []);
          }
        } catch (error) {
          console.error('Error searching users:', error);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch conversation and mark as read
  useEffect(() => {
    if (!selectedPartner) return;
    let isMounted = true;
    const fetchAndMarkRead = async () => {
      const res = await fetch(`/api/messages/conversation?user1=${userId}&user2=${selectedPartner.id}`);
      const data = await res.json();
      if (isMounted) {
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          setLastMessageId(data.messages[data.messages.length - 1].id);
        }
        // Mark all received messages as read
        const unread = (data.messages || []).filter((msg: Message) => msg.receiverId === userId && !msg.read);
        for (const msg of unread) {
          await fetch(`/api/messages/${msg.id}/read`, { method: "PATCH" });
        }
      }
    };
    fetchAndMarkRead();
    // Poll for new messages every 5 seconds
    pollingRef.current && clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchAndMarkRead, 5000);
    return () => {
      isMounted = false;
      pollingRef.current && clearInterval(pollingRef.current);
    };
  }, [selectedPartner, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show notification for new incoming messages
  useEffect(() => {
    if (!selectedPartner || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMessageId && lastMsg.id !== lastMessageId && lastMsg.senderId === selectedPartner.id) {
      toast.info(`New message from ${selectedPartner.displayName || selectedPartner.id}`);
      setLastMessageId(lastMsg.id);
    }
  }, [messages, selectedPartner, lastMessageId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner) return;
    setLoading(true);
    const payload = { senderId: userId, receiverId: selectedPartner.id, content: newMessage };
    try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (res.ok) {
      setNewMessage("");
      // Refresh conversation
        const convRes = await fetch(`/api/messages/conversation?user1=${userId}&user2=${selectedPartner.id}`);
      const data = await convRes.json();
      setMessages(data.messages || []);
        // Refresh recent conversations
        setTimeout(() => {
          // Give the backend a moment to update
          fetch(`/api/messages?userId=${userId}`).then(async (r) => {
            if (r.ok) {
              const d = await r.json();
              // ...same logic as above for recentConversations...
              const messages: Message[] = d.messages || [];
              const convMap: Record<string, Conversation> = {};
              messages.forEach(msg => {
                const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
                if (!convMap[partnerId] || new Date(msg.timestamp) > new Date(convMap[partnerId].lastMessage.timestamp)) {
                  convMap[partnerId] = {
                    user: { id: partnerId, username: partnerId, name: "", surname: "", type: "", displayName: partnerId },
                    lastMessage: msg,
                    unreadCount: 0,
                  };
                }
                if (msg.receiverId === userId && !msg.read) {
                  convMap[partnerId].unreadCount += 1;
                }
              });
              const partnerIds = Object.keys(convMap);
              const userInfos = await Promise.all(partnerIds.map(async pid => {
                const res = await fetch(`/api/user-info?userId=${pid}`);
                if (res.ok) return await res.json();
                return { id: pid, username: pid, name: pid, surname: "", type: "", displayName: pid };
              }));
              userInfos.forEach(info => {
                if (convMap[info.id]) convMap[info.id].user = info;
              });
              setRecentConversations(Object.values(convMap).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()));
            }
          });
        }, 300);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to send message");
      }
    } catch (err) {
      toast.error("Failed to send message (exception)");
    }
    setLoading(false);
  };

  const startConversation = (user: UserInfo) => {
    setSelectedPartner(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="flex border rounded-lg overflow-hidden min-h-[600px] bg-white">
      {/* Left Sidebar - Search and Recent Conversations */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b bg-white">
          <input
            type="text"
            placeholder="Search by username, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => startConversation(user)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Image
                    src={user.img || "/noAvatar.png"}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-medium text-sm">{user.displayName}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto">
          {recentConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Use the search bar to start one.
            </div>
          ) : (
            <div>
              {recentConversations.map((conv) => (
                <div
                  key={conv.user.id}
                  onClick={() => startConversation(conv.user)}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b ${
                    selectedPartner && selectedPartner.id === conv.user.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <Image
                    src={conv.user.img || "/noAvatar.png"}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{conv.user.displayName}</div>
                    <div className="text-xs text-gray-500 truncate">@{conv.user.username}</div>
                    <div className="text-xs text-gray-400 truncate">{conv.lastMessage.content}</div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Right Side - Conversation */}
      <div className="w-2/3 flex flex-col">
          {selectedPartner ? (
            <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <Image
                  src={selectedPartner.img || "/noAvatar.png"}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <div className="font-semibold">{selectedPartner.displayName}</div>
                  <div className="text-sm text-gray-500">@{selectedPartner.username}</div>
                </div>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                  <div
                    key={msg.id}
                      className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                  >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === userId
                            ? "bg-blue-500 text-white"
                            : "bg-white border"
                        }`}
                      >
                      <div className="text-sm">{msg.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            msg.senderId === userId ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
          )}
        </div>
            {/* Message Input */}
          <form
              className="flex border-t p-4 bg-white"
              onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
                className="flex-1 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button
              type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-r hover:bg-blue-600 disabled:opacity-50"
              disabled={loading || !newMessage.trim()}
            >
                {loading ? "Sending..." : "Send"}
            </button>
          </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <div className="text-lg font-medium">Select a conversation to start messaging</div>
              <div className="text-sm mt-2">Or use the search bar to find someone to message</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 