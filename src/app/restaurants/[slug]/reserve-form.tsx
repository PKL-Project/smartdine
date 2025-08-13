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
        .filter(([_, q]) => Number(q) > 0)
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
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <form
          onSubmit={submitReservation}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Data i godzina</Label>
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Liczba osób</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={party}
                onChange={(e) => setParty(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Stolik (opcjonalnie)</Label>
              <select
                className="border rounded-md h-9 px-2"
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
            <div className="space-y-1">
              <Label>Uwagi (opcjonalnie)</Label>
              <Input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Np. urodziny, krzesełko dla dziecka…"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Button type="submit" disabled={loading}>
                {loading ? "Rezerwuję…" : "Zarezerwuj"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">
              Zamówienie z wyprzedzeniem (opcjonalne)
            </h3>
            {restaurant.categories.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="text-sm text-muted-foreground">{c.name}</div>
                {c.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">{it.name}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-20"
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
            <p className="text-xs text-muted-foreground">
              Przed-zamówienie jest przekazywane do kuchni po potwierdzeniu
              rezerwacji.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
