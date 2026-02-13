"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";

type Restaurant = {
  id: string;
  timeSlotIntervalMinutes: number;
  tables: { id: string; name: string; capacity: number }[];
  categories: {
    id: string;
    name: string;
    items: { id: string; name: string }[];
  }[];
};

export default function ReserveForm({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [party, setParty] = useState(2);
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + restaurant.timeSlotIntervalMinutes);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16); // local datetime-local
  });
  const [tableId, setTableId] = useState<string>("");
  const [special, setSpecial] = useState("");
  const [preorder, setPreorder] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      await signIn(undefined, { callbackUrl: window.location.href });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const preorderItems = Object.entries(preorder)
        .filter(([, q]) => Number(q) > 0)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q) }));

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          startTime: new Date(start).toISOString(),
          partySize: Number(party),
          tableId: tableId || null,
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

  return (
    <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
          Rezerwacja
        </h2>
        <form
          onSubmit={submitReservation}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Data i godzina</Label>
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Liczba osób</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={party}
                onChange={(e) => setParty(Number(e.target.value))}
                required
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Stolik (opcjonalnie)</Label>
              <select
                className="border border-gray-300 rounded-md h-10 px-3 w-full focus:border-orange-500 focus:ring-orange-500 cursor-pointer"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">Dowolny</option>
                {restaurant.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} • {t.capacity} os.
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Uwagi (opcjonalnie)</Label>
              <Input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Np. urodziny, krzesełko dla dziecka…"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
              >
                {loading ? "Rezerwuję…" : "Zarezerwuj"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-900">
              Zamówienie z wyprzedzeniem (opcjonalne)
            </h3>
            {restaurant.categories.map((c) => (
              <div key={c.id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{c.name}</div>
                {c.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-gray-700">{it.name}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
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
