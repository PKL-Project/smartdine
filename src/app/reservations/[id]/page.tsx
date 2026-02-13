"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/use-polling";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  startTime: string;
  partySize: number;
  restaurant: { name: string; slug: string };
  preorderItems: { id: string; quantity: number; menuItem: { name: string } }[];
};

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
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
  const { isRefreshing, refresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Rezerwacja
          </h1>
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} />
        </div>

        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {loading || !data ? (
              <p className="text-gray-600">Ładowanie…</p>
            ) : (
              <>
                <p className="text-sm">
                  Restauracja:{" "}
                  <span className="font-medium">{data.restaurant.name}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <ReservationStatusBadge status={data.status} />
                </div>
                <p className="text-sm text-gray-700">
                  Termin: {new Date(data.startTime).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700">Liczba osób: {data.partySize}</p>
                {data.preorderItems?.length ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Przed-zamówienie:</div>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {data.preorderItems.map((p) => (
                        <li key={p.id}>
                          {p.menuItem.name} × {p.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="pt-2 flex gap-3">
                  <Button
                    onClick={() => router.push(`/reservations/${id}/edit`)}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                    disabled={data.status === "CANCELLED"}
                  >
                    Edytuj rezerwację
                  </Button>
                  <Button
                    onClick={() => router.push("/client")}
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
