"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";

interface Reservation {
  id: string;
  startTime: string;
  partySize: number;
  status: string;
  user: {
    email: string;
  };
}

interface RestaurantData {
  id: string;
  name: string;
  reservations: Reservation[];
}

export default function OwnerReservations() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/${slug}/reservations`);
      if (!res.ok) {
        setError("Nie znaleziono lub brak dostępu.");
        return;
      }
      const restaurantData = await res.json();
      setData(restaurantData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      setError("Błąd podczas ładowania danych.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup polling
  const { isRefreshing, refresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  const handleStatusChange = async (reservationId: string, status: string) => {
    try {
      const formData = new FormData();
      formData.append("status", status);

      const res = await fetch(`/api/reservations/${reservationId}/status`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Refresh data after status change
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-3xl mx-auto p-6">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="p-6 text-gray-700">{error || "Nie znaleziono lub brak dostępu."}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Rezerwacje — {data.name}
          </h1>
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} />
        </div>

        <ul className="space-y-3">
          {data.reservations.map((res) => (
            <li
              key={res.id}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-sm">
                <div>
                  <span className="font-medium text-gray-900">
                    {new Date(res.startTime).toLocaleString()}
                  </span>{" "}
                  • {res.partySize} os.
                </div>
                <div className="text-gray-600">
                  Gość: {res.user.email}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-600">Status:</span>
                  <ReservationStatusBadge status={res.status} />
                </div>
              </div>
              <div className="flex gap-2">
                {res.status !== "CONFIRMED" && (
                  <Button
                    onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                    className="bg-green-600 hover:bg-green-700 text-white hover:shadow-md transition-shadow"
                  >
                    Akceptuj
                  </Button>
                )}
                {res.status !== "CANCELLED" && (
                  <Button
                    onClick={() => handleStatusChange(res.id, "CANCELLED")}
                    variant="destructive"
                    className="hover:shadow-md transition-shadow"
                  >
                    Odrzuć
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
