import React, { useState, useEffect, useRef } from "react";

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
}

interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface ChatProps {
  currentUserId: number;
  token: string;
  onClose: () => void;
}

const API_BASE = "https://techni-zlecenia-4wdh.shuttle.app/";
const WS_BASE = "ws://techni-zlecenia-4wdh.shuttle.app/";

export function Chat({ currentUserId, token, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();
    fetchUsers();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_BASE}/messages/listen?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.message_id === message.message_id)) {
              return prev;
            }
            return [...prev, message].sort(
              (a, b) =>
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
            );
          });
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        // Try to reconnect after 3 seconds
        setTimeout(() => connectWebSocket(), 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/search?query=`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((user: User) => user.user_id !== currentUserId));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !wsRef.current) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: selectedUser.user_id,
      content: newMessage.trim(),
    };

    try {
      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getMessagesWithUser = (userId: number) => {
    return messages.filter(
      (msg) =>
        (msg.sender_id === currentUserId && msg.receiver_id === userId) ||
        (msg.sender_id === userId && msg.receiver_id === currentUserId),
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Dzisiaj";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Wczoraj";
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const userMessages = selectedUser
    ? getMessagesWithUser(selectedUser.user_id)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-96 flex">
        {/* Users List */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Wiadomości</h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
                title={isConnected ? "Połączono" : "Rozłączono"}
              />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Brak użytkowników
              </div>
            ) : (
              users.map((user) => {
                const userMsgs = getMessagesWithUser(user.user_id);
                const lastMessage = userMsgs[userMsgs.length - 1];

                return (
                  <div
                    key={user.user_id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedUser?.user_id === user.user_id
                        ? "bg-indigo-50 border-indigo-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {lastMessage.sender_id === currentUserId
                              ? "Ty: "
                              : ""}
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedUser.username}
                  </h4>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {userMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    Brak wiadomości. Napisz pierwszą wiadomość!
                  </div>
                ) : (
                  userMessages.reduce((acc, message, index) => {
                    const currentDate = formatDate(message.sent_at);
                    const previousDate =
                      index > 0
                        ? formatDate(userMessages[index - 1].sent_at)
                        : null;

                    if (currentDate !== previousDate) {
                      acc.push(
                        <div
                          key={`date-${currentDate}`}
                          className="text-center"
                        >
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {currentDate}
                          </span>
                        </div>,
                      );
                    }

                    acc.push(
                      <div
                        key={message.message_id}
                        className={`flex ${
                          message.sender_id === currentUserId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`message-bubble ${
                            message.sender_id === currentUserId
                              ? "message-sent"
                              : "message-received"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === currentUserId
                                ? "text-indigo-200"
                                : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.sent_at)}
                          </p>
                        </div>
                      </div>,
                    );

                    return acc;
                  }, [] as React.ReactNode[])
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-gray-200 bg-gray-50"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Napisz wiadomość..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-1">
                    Połączenie przerwane. Próba ponownego połączenia...
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>Wybierz użytkownika, aby rozpocząć konwersację</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
