"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";
import { TimeSlotPicker, TimeSlot } from "@/components/TimeSlotPicker";

type Restaurant = {
  id: string;
  slug: string;
  slotDurationMinutes: number;
  tables: { id: string; name: string; capacity: number }[];
  categories: {
    id: string;
    name: string;
    items: { id: string; name: string; priceCents: number }[];
  }[];
};

export default function ReserveForm({
  restaurant,
  isOwnerPreview = false,
  availableSlots,
  loadingSlots,
  selectedDate,
  onDateChange,
  party,
  onPartyChange,
}: {
  restaurant: Restaurant;
  isOwnerPreview?: boolean;
  availableSlots: TimeSlot[];
  loadingSlots: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  party: number;
  onPartyChange: (party: number) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [special, setSpecial] = useState("");
  const [preorder, setPreorder] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset selected slots when available slots change
  useEffect(() => {
    setSelectedSlots([]);
  }, [availableSlots]);

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      await signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (selectedSlots.length === 0) {
      setError("Proszę wybrać przynajmniej jeden slot czasowy");
      return;
    }

    const hasPreorderItems = Object.values(preorder).some((q) => Number(q) > 0);
    if (!hasPreorderItems) {
      setError("Proszę wybrać przynajmniej jedną pozycję z menu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const preorderItems = Object.entries(preorder)
        .filter(([, q]) => Number(q) > 0)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q) }));

      // Get the start time from the first selected slot
      const firstSlotIndex = Math.min(...selectedSlots);
      const firstSlot = availableSlots[firstSlotIndex];

      // Calculate duration based on number of slots
      const totalDuration = selectedSlots.length * restaurant.slotDurationMinutes;

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          startTime: firstSlot.startTime,
          durationMinutes: totalDuration,
          partySize: Number(party),
          specialRequests: special || null,
          preorderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reservation failed");
      router.push(`/reservations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Calculate total price
  const totalPrice = restaurant.categories.reduce((total, category) => {
    return total + category.items.reduce((catTotal, item) => {
      const quantity = preorder[item.id] || 0;
      return catTotal + (item.priceCents * quantity);
    }, 0);
  }, 0);

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + " zł";
  };

  const isAuthenticated = !!session;
  const canMakeReservation = isAuthenticated && !isOwnerPreview;
  const hasPreorderItems = totalPrice > 0;

  return (
    <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
          Rezerwacja
        </h2>
        {!isAuthenticated && (
          <div className="mb-4 bg-orange-50 border-2 border-orange-400 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-900">Zaloguj się, aby dokonać rezerwacji</p>
                <p className="text-sm text-orange-700">Aby zarezerwować stolik, musisz najpierw się zalogować.</p>
              </div>
              <Button
                onClick={() => {
                  const callbackUrl = encodeURIComponent(window.location.href);
                  window.location.href = `/login?callbackUrl=${callbackUrl}`;
                }}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
              >
                Zaloguj się
              </Button>
            </div>
          </div>
        )}
        <form
          onSubmit={submitReservation}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={!canMakeReservation}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Liczba osób</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={party}
                onChange={(e) => onPartyChange(Number(e.target.value))}
                required
                disabled={!canMakeReservation}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Automatycznie dobierzemy odpowiedni stolik dla Twojej grupy
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Dostępne sloty czasowe</Label>
                {selectedSlots.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {selectedSlots.length} slot{selectedSlots.length > 1 ? 'y' : ''} ({selectedSlots.length * restaurant.slotDurationMinutes} min)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {canMakeReservation ? 'Możesz wybrać 1 lub 2 kolejne sloty dla dłuższego pobytu' : 'Zaloguj się, aby zobaczyć dostępne sloty'}
              </p>
              {!canMakeReservation ? (
                <div className="text-sm text-gray-600 p-3 border rounded-lg bg-gray-50">
                  Dostępne sloty są widoczne tylko dla zalogowanych użytkowników
                </div>
              ) : (
                <TimeSlotPicker
                  slots={availableSlots}
                  selectedSlots={selectedSlots}
                  onSelectionChange={setSelectedSlots}
                  slotDurationMinutes={restaurant.slotDurationMinutes}
                  disabled={!canMakeReservation}
                  loading={loadingSlots}
                  emptyMessage="Brak dostępnych slotów w tym dniu"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Uwagi (opcjonalnie)</Label>
              <Input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Np. urodziny, krzesełko dla dziecka…"
                disabled={!canMakeReservation}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || selectedSlots.length === 0 || !canMakeReservation || !hasPreorderItems}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow disabled:opacity-50 w-full"
              >
                {loading ? "Rezerwuję…" : "Zarezerwuj"}
              </Button>
              {isOwnerPreview && (
                <p className="text-xs text-gray-600 text-center">
                  Rezerwacje są wyłączone w trybie podglądu właściciela
                </p>
              )}
              {!isAuthenticated && (
                <p className="text-xs text-gray-600 text-center">
                  Zaloguj się, aby dokonać rezerwacji
                </p>
              )}
              {canMakeReservation && !hasPreorderItems && (
                <p className="text-xs text-orange-600 text-center">
                  Wybierz przynajmniej jedną pozycję z menu, aby dokonać rezerwacji
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-900">
              Zamówienie z wyprzedzeniem
            </h3>
            <p className="text-xs text-orange-600 font-medium">
              Wymagane jest zamówienie przynajmniej jednej pozycji
            </p>
            {!canMakeReservation && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                Zaloguj się, aby móc złożyć zamówienie z wyprzedzeniem
              </p>
            )}
            {restaurant.categories.map((c) => (
              <div key={c.id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{c.name}</div>
                {c.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{it.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatPrice(it.priceCents)})</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      disabled={!canMakeReservation}
                      className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed"
                      value={preorder[it.id] ?? ""}
                      onChange={(e) =>
                        setPreorder((prev) => ({
                          ...prev,
                          [it.id]: e.target.value ? Number(e.target.value) : 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

            {totalPrice > 0 && (
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Suma do zapłaty:</span>
                  <span className="text-lg font-bold text-orange-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600">
              Przed-zamówienie jest przekazywane do kuchni po potwierdzeniu
              rezerwacji.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
