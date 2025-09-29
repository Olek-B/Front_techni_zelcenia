import React, { useState, useEffect, createContext, useContext } from "react";
import "./index.css";
import Chat from "./components/Chat";
import Offers from "./components/Offers";
import Profile from "./components/Profile";

// Types
interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface Order {
  order_id: number;
  user_id: number;
  order_name: string;
  order_desc: string;
  price: number;
  image_urls: string[];
  created_at: string;
}

interface Offer {
  offer_id: number;
  order_id: number;
  user_id: number;
  status: string;
  created_at: string;
}

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// API Base URL - adjust this to your backend URL
const API_BASE = "https://techni-zlecenia-4wdh.shuttle.app";

// Auth Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Decode JWT to get user ID
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        fetchUser(payload.sub);
      } catch (error) {
        localStorage.removeItem("token");
        setToken(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const fetchUser = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const newToken = await response.text();
        localStorage.setItem("token", newToken);
        setToken(newToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      return response.ok;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Login Component
function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(username, password);
    if (!success) {
      setError("Invalid credentials");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zaloguj się
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <input
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onToggle}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Nie masz konta? Zarejestruj się
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Register Component
function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setIsLoading(false);
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      setSuccess(true);
    } else {
      setError("Błąd podczas rejestracji");
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Konto zostało utworzone! Możesz się teraz zalogować.
            </div>
            <button
              onClick={onToggle}
              className="mt-4 text-indigo-600 hover:text-indigo-500"
            >
              Przejdź do logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zarejestruj się
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <input
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Potwierdź hasło"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onToggle}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Masz już konto? Zaloguj się
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const { user, logout, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentView, setCurrentView] = useState<
    "browse" | "my-orders" | "create" | "offers" | "chat"
  >("browse");
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/search?query=`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                TechniZlecenia
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("browse")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "browse"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Przeglądaj zlecenia
              </button>
              <button
                onClick={() => setCurrentView("my-orders")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "my-orders"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Moje zlecenia
              </button>
              <button
                onClick={() => setCurrentView("create")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "create"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Dodaj zlecenie
              </button>
              <button
                onClick={() => setCurrentView("offers")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "offers"
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Oferty
              </button>
              <button
                onClick={() => setShowChat(true)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors relative"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 hidden lg:block">
                  Witaj, {user?.username}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pb-3 pt-4">
              <div className="space-y-1 px-2">
                <button
                  onClick={() => {
                    setCurrentView("browse");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentView === "browse"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Przeglądaj zlecenia
                </button>
                <button
                  onClick={() => {
                    setCurrentView("my-orders");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentView === "my-orders"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Moje zlecenia
                </button>
                <button
                  onClick={() => {
                    setCurrentView("create");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentView === "create"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Dodaj zlecenie
                </button>
                <button
                  onClick={() => {
                    setCurrentView("offers");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentView === "offers"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Oferty
                </button>
                <button
                  onClick={() => {
                    setShowChat(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Wiadomości
                </button>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-3 pb-2">
                    <span className="text-sm text-gray-700">
                      Witaj, {user?.username}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentView === "browse" && (
          <BrowseOrders
            orders={orders}
            onProfileClick={(userId) => setShowProfile(userId)}
          />
        )}
        {currentView === "my-orders" && (
          <MyOrders onProfileClick={(userId) => setShowProfile(userId)} />
        )}
        {currentView === "create" && (
          <CreateOrder onOrderCreated={fetchOrders} />
        )}
        {currentView === "offers" && user && token && (
          <Offers currentUserId={user.user_id} token={token} />
        )}
      </div>

      {/* Chat Modal */}
      {showChat && user && token && (
        <Chat
          currentUserId={user.user_id}
          token={token}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Profile Modal */}
      {showProfile && user && token && (
        <Profile
          userId={showProfile}
          currentUserId={user.user_id}
          token={token}
          onClose={() => setShowProfile(null)}
        />
      )}
    </div>
  );
}

// Browse Orders Component
function BrowseOrders({
  orders,
  onProfileClick,
}: {
  orders: Order[];
  onProfileClick: (userId: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.order_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.order_desc.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Dostępne zlecenia</h2>
        <div className="w-full sm:w-auto sm:max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj zleceń..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak zleceń
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Nie znaleziono zleceń pasujących do wyszukiwania."
              : "Nie ma jeszcze żadnych zleceń."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  onProfileClick,
}: {
  order: Order;
  onProfileClick?: (userId: number) => void;
}) {
  const { user, token } = useAuth();
  const [orderOwner, setOrderOwner] = useState<User | null>(null);

  useEffect(() => {
    if (order.user_id && token) {
      fetchOrderOwner();
    }
  }, [order.user_id, token]);

  const fetchOrderOwner = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/${order.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const ownerData = await response.json();
        setOrderOwner(ownerData);
      }
    } catch (error) {
      console.error("Error fetching order owner:", error);
    }
  };

  const handleApply = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE}/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.order_id }),
      });

      if (response.ok) {
        alert("Aplikacja została wysłana!");
      } else {
        alert("Błąd podczas wysyłania aplikacji");
      }
    } catch (error) {
      console.error("Error applying for order:", error);
      alert("Błąd podczas wysyłania aplikacji");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card hover-lift h-full flex flex-col">
      <div className="card-body flex-1 flex flex-col">
        {/* Order owner info */}
        {orderOwner && (
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {orderOwner.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => onProfileClick?.(order.user_id)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors truncate block"
              >
                {orderOwner.username}
              </button>
              <p className="text-xs text-gray-500">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {order.order_name}
        </h3>
        <p className="text-gray-600 mb-4 flex-1 text-sm line-clamp-3">
          {order.order_desc}
        </p>

        {order.image_urls.length > 0 && (
          <div className="mb-4">
            <img
              src={order.image_urls[0]}
              alt="Order"
              className="w-full h-40 sm:h-48 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 mt-auto">
          <span className="text-xl sm:text-2xl font-bold text-indigo-600">
            {order.price} zł
          </span>
          <div className="flex space-x-2">
            {user && user.user_id !== order.user_id && (
              <button
                onClick={handleApply}
                className="btn-primary w-full sm:w-auto text-sm"
              >
                Aplikuj
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// My Orders Component
function MyOrders({
  onProfileClick,
}: {
  onProfileClick: (userId: number) => void;
}) {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchMyOrders();
    }
  }, [user, token]);

  const fetchMyOrders = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE}/orders/user/${user.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyOrders(data);
      }
    } catch (error) {
      console.error("Error fetching my orders:", error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Moje zlecenia</h2>
      {myOrders.length === 0 ? (
        <div className="text-center py-12">
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
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak zleceń
          </h3>
          <p className="text-gray-500">
            Nie utworzyłeś jeszcze żadnych zleceń.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {myOrders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Create Order Component
function CreateOrder({ onOrderCreated }: { onOrderCreated: () => void }) {
  const [orderName, setOrderName] = useState("");
  const [orderDesc, setOrderDesc] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1]; // Remove data URL prefix
        setImages((prev) => [...prev, base64Data]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_name: orderName,
          order_desc: orderDesc,
          price: parseFloat(price),
          images,
        }),
      });

      if (response.ok) {
        setOrderName("");
        setOrderDesc("");
        setPrice("");
        setImages([]);
        onOrderCreated();
        alert("Zlecenie zostało utworzone!");
      } else {
        alert("Błąd podczas tworzenia zlecenia");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Błąd podczas tworzenia zlecenia");
    }
    setIsLoading(false);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        Dodaj nowe zlecenie
      </h2>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nazwa zlecenia
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Opis
            </label>
            <textarea
              required
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={orderDesc}
              onChange={(e) => setOrderDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cena (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Zdjęcia
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Tworzenie...
              </div>
            ) : (
              "Utwórz zlecenie"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main App Component
export function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthProvider>
      <AppContent isLogin={isLogin} setIsLogin={setIsLogin} />
    </AuthProvider>
  );
}

function AppContent({
  isLogin,
  setIsLogin,
}: {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggle={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggle={() => setIsLogin(true)} />
    );
  }

  return <Dashboard />;
}

export default App;
