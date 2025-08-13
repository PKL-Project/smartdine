"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch(`/api/reservations/${id}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed");
        if (mounted) setData(j);
      } catch (e: any) {
        if (mounted) setError(e.message);
      }
    }

    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [id]);

  return (
    <main className="max-w-xl mx-auto p-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Rezerwacja</h1>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!data ? (
            <p>Ładowanie…</p>
          ) : (
            <>
              <p className="text-sm">
                Restauracja:{" "}
                <span className="font-medium">{data.restaurant.name}</span>
              </p>
              <p className="text-sm">
                Status: <span className="font-medium">{data.status}</span>
              </p>
              <p className="text-sm">
                Termin: {new Date(data.startTime).toLocaleString()}
              </p>
              <p className="text-sm">Liczba osób: {data.partySize}</p>
              {data.preorderItems?.length ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Przed-zamówienie:</div>
                  <ul className="list-disc list-inside text-sm">
                    {data.preorderItems.map((p) => (
                      <li key={p.id}>
                        {p.menuItem.name} × {p.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="pt-2">
                <Button
                  onClick={() =>
                    router.push(`/restaurants/${data.restaurant.slug}`)
                  }
                >
                  Wróć do restauracji
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
