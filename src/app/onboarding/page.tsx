"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { UserRole, USER_ROLES } from "@/types/roles";

export default function OnboardingPage() {
  const [loading, setLoading] = useState<UserRole | null>(null);
  const router = useRouter();
  const { data: session, update } = useSession();

  // Redirect if user already has a role
  useEffect(() => {
    if (session?.user?.role) {
      const role = session.user.role;
      if (role === USER_ROLES.OWNER) {
        router.push("/owner");
      } else if (role === USER_ROLES.CLIENT) {
        router.push("/client");
      }
    }
  }, [session?.user?.role, router]);

  async function choose(role: UserRole) {
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

    // Redirect based on role
    if (role === USER_ROLES.OWNER) {
      // Owners need to create their restaurant first
      router.push("/owner/new-restaurant");
    } else {
      // Clients see their home page
      router.push("/client");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
      <div className="max-w-3xl mx-auto p-6 space-y-8 w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Witaj w SmartDine
          </h1>
          <p className="text-gray-600">Wybierz swoją rolę, aby kontynuować</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Jestem właścicielem</h2>
              <p className="text-sm text-gray-600">
                Utwórz restaurację, dodaj stoliki i menu, akceptuj/odrzucaj
                rezerwacje.
              </p>
              <Button
                onClick={() => choose(USER_ROLES.OWNER)}
                disabled={!!loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
              >
                {loading === USER_ROLES.OWNER ? "Ładowanie…" : "Wybieram"}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Jestem gościem</h2>
              <p className="text-sm text-gray-600">
                Przeglądaj restauracje i rezerwuj stolik z ewentualnym
                przed-zamówieniem.
              </p>
              <Button
                onClick={() => choose(USER_ROLES.CLIENT)}
                disabled={!!loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
              >
                {loading === USER_ROLES.CLIENT ? "Ładowanie…" : "Wybieram"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
