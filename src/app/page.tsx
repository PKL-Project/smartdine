"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <main className="p-6 max-w-xl mx-auto">
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Restaurant Reserve</h1>
          <p className="text-sm text-muted-foreground">
            Scaffold is ready: Next.js + Tailwind + shadcn/ui + Prisma + Auth
            (magic links).
          </p>

          {status === "loading" && <p>Loading session…</p>}

          {status !== "loading" && (
            <>
              {session ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    Signed in as{" "}
                    <span className="font-medium">{session.user?.email}</span>
                  </p>
                  <Button variant="secondary" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">You are not signed in.</p>
                  <Button onClick={() => signIn()}>Sign in</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Button asChild>
        <a href="/restaurants">Przejdź do restauracji</a>
      </Button>
    </main>
  );
}
