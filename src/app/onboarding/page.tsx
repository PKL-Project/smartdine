"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState<"OWNER" | "DINER" | null>(null);
  const router = useRouter();
  const { update } = useSession();

  async function choose(role: "OWNER" | "DINER") {
    setLoading(role);
    const res = await fetch("/api/me/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(null);
    if (!res.ok) {
      alert("Nie udało się zapisać roli");
      return;
    }

    // Refresh JWT/session so middleware and UI see the new role immediately
    await update({ role });
    router.push(role === "OWNER" ? "/owner" : "/restaurants");
  }

  return (
    <main className="max-w-3xl mx-auto p-6 grid sm:grid-cols-2 gap-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Jestem właścicielem</h2>
          <p className="text-sm text-muted-foreground">
            Utwórz restaurację, dodaj stoliki i menu, akceptuj/odrzucaj
            rezerwacje.
          </p>
          <Button onClick={() => choose("OWNER")} disabled={!!loading}>
            {loading === "OWNER" ? "Ładowanie…" : "Wybieram"}
          </Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Jestem gościem</h2>
          <p className="text-sm text-muted-foreground">
            Przeglądaj restauracje i rezerwuj stolik z ewentualnym
            przed-zamówieniem.
          </p>
          <Button onClick={() => choose("DINER")} disabled={!!loading}>
            {loading === "DINER" ? "Ładowanie…" : "Wybieram"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
