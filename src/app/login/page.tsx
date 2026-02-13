"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("email", { email, callbackUrl: "/" });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            SmartDine
          </h1>
          <p className="text-gray-600">Zaloguj się, aby kontynuować</p>
        </div>

        <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Zaloguj się</h2>
            {sent ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Jeśli konto dla adresu{" "}
                  <span className="font-medium text-orange-600">{email}</span> istnieje, wysłaliśmy
                  link do logowania. Sprawdź swoją skrzynkę!
                </p>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-gray-700">
                  💡 W trybie deweloperskim sprawdź konsolę, aby znaleźć magiczny link!
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="twoj@email.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {loading ? "Wysyłanie..." : "Wyślij link logowania"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
