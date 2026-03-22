"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";
import { toast } from "sonner";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EDITED";
  startTime: string;
  durationMinutes: number;
  partySize: number;
  specialRequests: string | null;
  table: { id: string; name: string; capacity: number } | null;
  user: { email: string; name: string | null };
  restaurant: { name: string; slug: string };
  preorderItems: { id: string; quantity: number; menuItem: { name: string; priceCents: number } }[];
};

export default function OwnerReservationDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [data, setData] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setData(j);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup polling
  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  const handleStatusChange = async (status: string) => {
    if (!data) return;

    try {
      const formData = new FormData();
      formData.append("status", status);

      const res = await fetch(`/api/reservations/${data.id}/status`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchData();
        toast.success("Status rezerwacji został zaktualizowany");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Nie można zaktualizować statusu rezerwacji");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Wystąpił błąd podczas aktualizacji statusu");
    }
  };

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + " zł";
  };

  const isPast = data ? new Date(data.startTime) < new Date() : false;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Szczegóły rezerwacji
          </h1>
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} lastRefresh={lastRefresh} />
        </div>

        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {loading || !data ? (
              <p className="text-gray-600">Ładowanie…</p>
            ) : (
              <>
                {/* Restaurant Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{data.restaurant.name}</h2>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <ReservationStatusBadge status={data.status} />
                </div>

                {/* Guest Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Informacje o gościu</h3>
                  <div className="text-sm text-gray-700">
                    <div>Email: <span className="font-medium">{data.user.email}</span></div>
                    {data.user.name && <div>Imię: <span className="font-medium">{data.user.name}</span></div>}
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Szczegóły rezerwacji</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>Data i godzina: <span className="font-medium">{new Date(data.startTime).toLocaleString("pl-PL")}</span></div>
                    <div>Czas trwania: <span className="font-medium">{data.durationMinutes} min</span></div>
                    <div>Liczba osób: <span className="font-medium">{data.partySize}</span></div>
                    {data.table && (
                      <div>Stolik: <span className="font-medium">{data.table.name} (pojemność: {data.table.capacity} os.)</span></div>
                    )}
                    {!data.table && (
                      <div className="text-amber-600">Stolik nie został jeszcze przypisany</div>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {data.specialRequests && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">Specjalne życzenia</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{data.specialRequests}</p>
                  </div>
                )}

                {/* Preorder */}
                {data.preorderItems?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">Przed-zamówienie</h3>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      {data.preorderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.menuItem.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(item.menuItem.priceCents * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-semibold">
                        <span>Razem:</span>
                        <span>
                          {formatPrice(
                            data.preorderItems.reduce(
                              (sum, item) => sum + item.menuItem.priceCents * item.quantity,
                              0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                  {!isPast && data.status !== "CONFIRMED" && (
                    <Button
                      onClick={() => handleStatusChange("CONFIRMED")}
                      className="bg-green-600 hover:bg-green-700 text-white hover:shadow-md transition-shadow"
                    >
                      Akceptuj rezerwację
                    </Button>
                  )}
                  {!isPast && data.status !== "CANCELLED" && (
                    <Button
                      onClick={() => handleStatusChange("CANCELLED")}
                      variant="destructive"
                      className="hover:shadow-md transition-shadow"
                    >
                      Odrzuć rezerwację
                    </Button>
                  )}
                  <Button
                    onClick={() => router.push(`/owner/${slug}/reservations`)}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Wróć do listy
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
