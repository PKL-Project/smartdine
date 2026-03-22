"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const router = useRouter();
  const slug = params.slug as string;
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("next");

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
  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  // Split reservations into next and past
  const { nextReservations, pastReservations } = useMemo(() => {
    if (!data) return { nextReservations: [], pastReservations: [] };

    const now = new Date();
    const next: Reservation[] = [];
    const past: Reservation[] = [];

    data.reservations.forEach((reservation) => {
      const reservationDate = new Date(reservation.startTime);
      if (reservationDate >= now) {
        next.push(reservation);
      } else {
        past.push(reservation);
      }
    });

    return { nextReservations: next, pastReservations: past };
  }, [data]);

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
        toast.success("Status rezerwacji został zaktualizowany");
      } else {
        // Handle error response
        const errorData = await res.json();
        toast.error(errorData.error || "Nie można zaktualizować statusu rezerwacji");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Wystąpił błąd podczas aktualizacji statusu");
    }
  };

  const renderReservationList = (reservations: Reservation[], isPast = false) => {
    if (reservations.length === 0) {
      return (
        <p className="text-gray-600 text-center py-8">
          Brak rezerwacji
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {reservations.map((res) => (
          <li
            key={res.id}
            className={`backdrop-blur-sm border rounded-lg p-4 flex items-center justify-between shadow-lg transition-shadow ${
              isPast
                ? "bg-gray-100/80 border-gray-300 opacity-70"
                : "bg-white/80 border-gray-200 hover:shadow-xl"
            }`}
          >
            <div className="text-sm">
              <div>
                <span className={`font-medium ${isPast ? "text-gray-600" : "text-gray-900"}`}>
                  {new Date(res.startTime).toLocaleString()}
                </span> •{" "}
                {res.partySize} os.
              </div>
              <div className={isPast ? "text-gray-500" : "text-gray-600"}>Gość: {res.user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={isPast ? "text-gray-500" : "text-gray-600"}>Status:</span>
                <ReservationStatusBadge status={res.status} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/owner/${slug}/reservations/${res.id}`)}
                variant="outline"
                size="sm"
                className="hover:shadow-md transition-shadow"
              >
                Szczegóły
              </Button>
              {!isPast && res.status !== "CONFIRMED" && (
                <Button
                  onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white hover:shadow-md transition-shadow"
                >
                  Akceptuj
                </Button>
              )}
              {!isPast && res.status !== "CANCELLED" && (
                <Button
                  onClick={() => handleStatusChange(res.id, "CANCELLED")}
                  size="sm"
                  variant="destructive"
                  className="hover:shadow-md transition-shadow"
                >
                  Odrzuć
                </Button>
              )}
              {isPast && (
                <span className="text-sm text-gray-500 italic">
                  Zakończone
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
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
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} lastRefresh={lastRefresh} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="next">
              Nadchodzące ({nextReservations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Przeszłe ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="next" className="mt-4">
            {renderReservationList(nextReservations, false)}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {renderReservationList(pastReservations, true)}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
