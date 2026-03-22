"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "CANCELLED_BY_CLIENT" | "EDITED";
  startTime: string;
  partySize: number;
  restaurant: { name: string; slug: string };
  preorderItems: { id: string; quantity: number; menuItem: { name: string; priceCents: number } }[];
};

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + " zł";
  };

  const handleCancelReservation = async () => {
    if (!data) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/reservations/${data.id}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        await fetchData();
        toast.success("Rezerwacja została anulowana");
        setShowCancelDialog(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Nie można anulować rezerwacji");
      }
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      toast.error("Wystąpił błąd podczas anulowania rezerwacji");
    } finally {
      setCancelling(false);
    }
  };

  // Check if reservation can be cancelled (24h before)
  const canCancel = data ? (() => {
    const reservationTime = new Date(data.startTime);
    const now = new Date();
    const hoursUntilReservation = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilReservation >= 24 &&
           data.status !== "CANCELLED" &&
           data.status !== "CANCELLED_BY_CLIENT";
  })() : false;

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
                  Restauracja: <span className="font-medium">{data.restaurant.name}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <ReservationStatusBadge status={data.status} />
                </div>
                <p className="text-sm text-gray-700">Termin: {new Date(data.startTime).toLocaleString()}</p>
                <p className="text-sm text-gray-700">Liczba osób: {data.partySize}</p>
                {data.preorderItems?.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">Przed-zamówienie:</div>
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
                        <span className="text-orange-600">
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
                ) : null}
                {/* Cancellation disclaimer */}
                {data.status !== "CANCELLED" && data.status !== "CANCELLED_BY_CLIENT" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Anulowanie rezerwacji:</strong> Możesz anulować rezerwację do 24 godzin przed zaplanowanym czasem.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    onClick={() => router.push(`/reservations/${id}/edit`)}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                    disabled={data.status === "CANCELLED" || data.status === "CANCELLED_BY_CLIENT"}
                  >
                    Edytuj rezerwację
                  </Button>
                  {canCancel ? (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="destructive"
                    >
                      Anuluj rezerwację
                    </Button>
                  ) : (
                    data.status !== "CANCELLED" && data.status !== "CANCELLED_BY_CLIENT" && (
                      <Button variant="destructive" disabled>
                        Anuluj rezerwację
                      </Button>
                    )
                  )}
                  <Button onClick={() => router.push("/client")} variant="outline" className="border-gray-300">
                    Wróć do listy
                  </Button>
                </div>
                {!canCancel && data.status !== "CANCELLED" && data.status !== "CANCELLED_BY_CLIENT" && (
                  <p className="text-xs text-red-600">
                    Nie można anulować rezerwacji - pozostało mniej niż 24 godziny do zaplanowanego czasu.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anulować rezerwację?</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz anulować tę rezerwację? Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Nie, zachowaj
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelReservation}
              disabled={cancelling}
            >
              {cancelling ? "Anuluję..." : "Tak, anuluj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
