"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { User, X } from "lucide-react";

export function UserMenu() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);

  if (!session) {
    return null;
  }

  const sessionExpiry = session.expires ? new Date(session.expires) : null;
  const timeUntilExpiry = sessionExpiry
    ? Math.max(
        0,
        Math.floor(
          (sessionExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null }),
      });

      if (res.ok) {
        await update({ name: name || null });
        setIsEditing(false);
      } else {
        const data = await res.json();
        alert(data.error || "Błąd aktualizacji profilu");
      }
    } catch (error) {
      alert("Błąd aktualizacji profilu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Otwórz menu użytkownika"
      >
        <User className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in Panel */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom">
          <Card className="rounded-t-2xl border-t shadow-2xl max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Profil użytkownika</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground w-20">
                    Email:
                  </span>
                  <span className="text-sm font-medium">
                    {session.user.email}
                  </span>
                </div>

                {!isEditing ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground w-20">
                      Imię:
                    </span>
                    <span className="text-sm flex-1">
                      {session.user.name || (
                        <span className="text-muted-foreground italic">
                          Nie ustawiono
                        </span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setName(session.user.name || "");
                        setIsEditing(true);
                      }}
                    >
                      Edytuj
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                    <div>
                      <Label className="text-sm">Imię i nazwisko</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Wprowadź imię"
                        className="mt-1"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        Zapisz
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground w-20">
                    Rola:
                  </span>
                  <span className="text-sm font-medium">
                    {session.user.role === "OWNER" ? "Właściciel" : "Klient"}
                  </span>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Sesja wygasa za{" "}
                    {timeUntilExpiry !== null
                      ? `${timeUntilExpiry} dni`
                      : "N/A"}
                  </div>
                  {sessionExpiry && (
                    <div className="text-xs text-muted-foreground">
                      {sessionExpiry.toLocaleString("pl-PL")}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Wyloguj się
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
