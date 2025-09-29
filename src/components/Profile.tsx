import React, { useState, useEffect } from "react";

interface Review {
  review_id: number;
  user_reviewed: number;
  user_reviewing: number;
  rating: number;
  content: string;
  created_at: string;
}

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

interface ProfileProps {
  userId: number;
  currentUserId: number;
  token: string;
  onClose: () => void;
}

const API_BASE = "https://techni-zlecenia-4wdh.shuttle.app";

export function Profile({
  userId,
  currentUserId,
  token,
  onClose,
}: ProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [reviewers, setReviewers] = useState<{ [key: number]: User }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, content: "" });
  const [activeTab, setActiveTab] = useState<"info" | "reviews" | "orders">(
    "info",
  );

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchUser(), fetchReviews(), fetchUserOrders()]);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setIsLoading(false);
  };

  const fetchUser = async () => {
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

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE}/reviews/for/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);

        // Fetch reviewer details for each review
        for (const review of reviewsData) {
          if (review.user_reviewing) {
            await fetchReviewer(review.user_reviewing);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchReviewer = async (reviewerId: number) => {
    if (reviewers[reviewerId]) return;

    try {
      const response = await fetch(`${API_BASE}/user/${reviewerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const reviewer = await response.json();
        setReviewers((prev) => ({ ...prev, [reviewerId]: reviewer }));
      }
    } catch (error) {
      console.error("Error fetching reviewer:", error);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const ordersData = await response.json();
        setUserOrders(ordersData);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.content.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          rating: newReview.rating,
          content: newReview.content.trim(),
        }),
      });

      if (response.ok) {
        setNewReview({ rating: 5, content: "" });
        setShowReviewForm(false);
        await fetchReviews(); // Refresh reviews
        alert("Opinia została dodana!");
      } else {
        alert("Błąd podczas dodawania opinii");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Błąd podczas dodawania opinii");
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const stars = [];
    const sizeClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`${sizeClass} ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
          <div className="text-center">
            <p className="text-gray-500">
              Nie można załadować profilu użytkownika
            </p>
            <button onClick={onClose} className="btn-primary mt-4">
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-primary text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-indigo-100">
                  Użytkownik od {formatDate(user.created_at)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex">
                    {renderStars(Math.round(Number(getAverageRating())), "sm")}
                  </div>
                  <span className="text-indigo-100">
                    {getAverageRating()} ({reviews.length}{" "}
                    {reviews.length === 1 ? "opinia" : "opinii"})
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "info"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Informacje
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Opinie ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Zlecenia ({userOrders.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Statystyki
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Łącznie zleceń:</span>
                        <span className="font-semibold">
                          {userOrders.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Średnia ocena:</span>
                        <span className="font-semibold">
                          {getAverageRating()}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Liczba opinii:</span>
                        <span className="font-semibold">{reviews.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Kontakt
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-600">Email:</label>
                        <p className="font-semibold">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">
                          Nazwa użytkownika:
                        </label>
                        <p className="font-semibold">{user.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {currentUserId !== userId && (
                <div className="text-center">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn-primary"
                  >
                    Dodaj opinię
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Brak opinii
                  </h3>
                  <p className="text-gray-500">
                    Ten użytkownik nie ma jeszcze żadnych opinii.
                  </p>
                </div>
              ) : (
                reviews.map((review) => {
                  const reviewer = reviewers[review.user_reviewing];
                  return (
                    <div key={review.review_id} className="card">
                      <div className="card-body">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {reviewer
                              ? reviewer.username.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {reviewer ? reviewer.username : "Ładowanie..."}
                              </h4>
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700">{review.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userOrders.length === 0 ? (
                <div className="col-span-2 text-center py-12">
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
                    Ten użytkownik nie ma jeszcze żadnych zleceń.
                  </p>
                </div>
              ) : (
                userOrders.map((order) => (
                  <div key={order.order_id} className="card hover-lift">
                    <div className="card-body">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {order.order_name}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {order.order_desc}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-indigo-600">
                          {order.price} zł
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      {order.image_urls.length > 0 && (
                        <div className="mt-3">
                          <img
                            src={order.image_urls[0]}
                            alt="Order"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dodaj opinię dla {user.username}
              </h3>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ocena
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setNewReview((prev) => ({ ...prev, rating }))
                        }
                        className={`w-8 h-8 ${
                          rating <= newReview.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Komentarz
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Napisz swoją opinię..."
                    value={newReview.content}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-secondary"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary">
                    Dodaj opinię
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
