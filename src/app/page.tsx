"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { USER_ROLES } from "@/types/roles";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when session is loaded
    if (status === "authenticated") {
      if (session?.user?.role) {
        // User has a role, redirect based on role
        if (session.user.role === USER_ROLES.OWNER) {
          router.push("/owner");
        } else if (session.user.role === USER_ROLES.CLIENT) {
          router.push("/restaurants");
        }
      } else {
        // User is authenticated but has no role, redirect to onboarding
        router.push("/onboarding");
      }
    }
  }, [status, session, router]);

  // Show loading state or sign-in prompt
  if (status === "loading") {
    return (
      <main className="p-6 max-w-xl mx-auto flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Ładowanie...</p>
      </main>
    );
  }

  // If not authenticated, show sign-in prompt
  if (status === "unauthenticated") {
    return (
      <main className="p-6 max-w-xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Restaurant Reserve</h1>
          <p className="text-muted-foreground">
            Zarezerwuj stolik w swojej ulubionej restauracji
          </p>
          <button
            onClick={() => signIn()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Zaloguj się
          </button>
        </div>
      </main>
    );
  }

  // While redirecting, show loading
  return (
    <main className="p-6 max-w-xl mx-auto flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Przekierowywanie...</p>
    </main>
  );
}
