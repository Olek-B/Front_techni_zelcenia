import React, { useState, useEffect } from "react";

interface Offer {
  offer_id: number;
  order_id: number;
  user_id: number;
  status: string;
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

interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface OffersProps {
  currentUserId: number;
  token: string;
}

const API_BASE = "https://techni-zlecenia-4wdh.shuttle.app";

export function Offers({ currentUserId, token }: OffersProps) {
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<{ [key: number]: Order }>({});
  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentUserId, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchMyOffers(), fetchReceivedOffers()]);
    } catch (error) {
      console.error("Error fetching offers data:", error);
    }
    setIsLoading(false);
  };

  const fetchMyOffers = async () => {
    try {
      const response = await fetch(`${API_BASE}/offers/user/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const offers = await response.json();
        setMyOffers(offers);

        // Fetch order details for each offer
        for (const offer of offers) {
          await fetchOrderDetails(offer.order_id);
        }
      }
    } catch (error) {
      console.error("Error fetching my offers:", error);
    }
  };

  const fetchReceivedOffers = async () => {
    try {
      // First get user's orders
      const ordersResponse = await fetch(
        `${API_BASE}/orders/user/${currentUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (ordersResponse.ok) {
        const userOrders = await ordersResponse.json();
        const allReceivedOffers: Offer[] = [];

        // For each order, get its offers
        for (const order of userOrders) {
          const offersResponse = await fetch(
            `${API_BASE}/offers/order/${order.order_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (offersResponse.ok) {
            const orderOffers = await offersResponse.json();
            allReceivedOffers.push(...orderOffers);

            // Store order details
            setOrders((prev) => ({ ...prev, [order.order_id]: order }));

            // Fetch user details for each offer
            for (const offer of orderOffers) {
              await fetchUserDetails(offer.user_id);
            }
          }
        }

        setReceivedOffers(allReceivedOffers);
      }
    } catch (error) {
      console.error("Error fetching received offers:", error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    if (orders[orderId]) return; // Already fetched

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const order = await response.json();
        setOrders((prev) => ({ ...prev, [orderId]: order }));
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    if (users[userId]) return; // Already fetched

    try {
      const response = await fetch(`${API_BASE}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        setUsers((prev) => ({ ...prev, [userId]: user }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const updateOfferStatus = async (offerId: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/offers/${offerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update the offer in the state
        setReceivedOffers((prev) =>
          prev.map((offer) =>
            offer.offer_id === offerId ? { ...offer, status } : offer,
          ),
        );
        alert(
          `Oferta została ${status === "accepted" ? "zaakceptowana" : "odrzucona"}`,
        );
      } else {
        alert("Błąd podczas aktualizacji oferty");
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      alert("Błąd podczas aktualizacji oferty");
    }
  };

  const deleteOffer = async (offerId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę ofertę?")) return;

    try {
      const response = await fetch(`${API_BASE}/offers/${offerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMyOffers((prev) =>
          prev.filter((offer) => offer.offer_id !== offerId),
        );
        alert("Oferta została usunięta");
      } else {
        alert("Błąd podczas usuwania oferty");
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      alert("Błąd podczas usuwania oferty");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Oczekuje", className: "status-pending" },
      accepted: { label: "Zaakceptowana", className: "status-accepted" },
      rejected: { label: "Odrzucona", className: "status-rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "status-pending",
    };

    return (
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Zarządzanie ofertami
        </h1>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("sent")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sent"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Wysłane oferty ({myOffers.length})
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "received"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Otrzymane oferty ({receivedOffers.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Sent Offers Tab */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {myOffers.length === 0 ? (
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
                Brak wysłanych ofert
              </h3>
              <p className="text-gray-500">
                Nie wysłałeś jeszcze żadnych ofert na zlecenia.
              </p>
            </div>
          ) : (
            myOffers.map((offer) => {
              const order = orders[offer.order_id];
              return (
                <div key={offer.offer_id} className="card hover-lift">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {order ? order.order_name : "Ładowanie..."}
                        </h3>
                        {order && (
                          <p className="text-gray-600 mb-3">
                            {order.order_desc}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Wysłano: {formatDate(offer.created_at)}</span>
                          {order && (
                            <span className="font-semibold text-indigo-600">
                              {order.price} zł
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(offer.status)}
                        {offer.status === "pending" && (
                          <button
                            onClick={() => deleteOffer(offer.offer_id)}
                            className="btn-danger text-sm"
                          >
                            Usuń
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Received Offers Tab */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {receivedOffers.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Brak otrzymanych ofert
              </h3>
              <p className="text-gray-500">
                Nikt jeszcze nie złożył oferty na Twoje zlecenia.
              </p>
            </div>
          ) : (
            receivedOffers.map((offer) => {
              const order = orders[offer.order_id];
              const user = users[offer.user_id];
              return (
                <div key={offer.offer_id} className="card hover-lift">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user ? user.username.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {user ? user.username : "Ładowanie..."}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {user ? user.email : ""}
                            </p>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {order ? order.order_name : "Ładowanie..."}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Złożono: {formatDate(offer.created_at)}</span>
                          {order && (
                            <span className="font-semibold text-indigo-600">
                              {order.price} zł
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(offer.status)}
                        {offer.status === "pending" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                updateOfferStatus(offer.offer_id, "accepted")
                              }
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Zaakceptuj
                            </button>
                            <button
                              onClick={() =>
                                updateOfferStatus(offer.offer_id, "rejected")
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Odrzuć
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Offers;
