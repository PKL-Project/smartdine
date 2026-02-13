"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { USER_ROLES } from "@/types/roles";

// Configuration for floating food emojis
const FOOD_EMOJIS = [
  '🍔', '🍕', '🍝', '🍜', '🍱', '🍰', '🥗', '🍛', '🍣', '🌮',
  '🍗', '🥘', '🍲', '🥙', '🌯', '🥪', '🍖', '🍤', '🥟', '🍙',
  '🍢', '🍡', '🥞', '🧇', '🥐', '🍞', '🥖', '🥨', '🍩', '🎂'
];

const EMOJI_CONFIG = {
  count: 25, // Number of emojis to display
  minSize: 48, // Minimum size in pixels
  maxSize: 80, // Maximum size in pixels
  minOpacity: 0.3, // Minimum opacity
  maxOpacity: 0.7, // Maximum opacity
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Generate random positions and properties for food emojis
  const floatingEmojis = useMemo(() => {
    return Array.from({ length: EMOJI_CONFIG.count }, (_, i) => {
      const emoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      const size = Math.random() * (EMOJI_CONFIG.maxSize - EMOJI_CONFIG.minSize) + EMOJI_CONFIG.minSize;
      const opacity = Math.random() * (EMOJI_CONFIG.maxOpacity - EMOJI_CONFIG.minOpacity) + EMOJI_CONFIG.minOpacity;
      const top = Math.random() * 100; // 0-100%
      const left = Math.random() * 100; // 0-100%
      const delay = Math.random() * 6; // 0-6 seconds

      return {
        id: i,
        emoji,
        size,
        opacity,
        top,
        left,
        delay,
      };
    });
  }, []);

  useEffect(() => {
    // Only redirect when session is loaded
    if (status === "authenticated") {
      if (session?.user?.role) {
        // User has a role, redirect based on role
        if (session.user.role === USER_ROLES.OWNER) {
          router.push("/owner");
        } else if (session.user.role === USER_ROLES.CLIENT) {
          router.push("/client");
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
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 left-10 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

          {/* Floating Food Emojis */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingEmojis.map((item) => (
              <div
                key={item.id}
                className="absolute animate-float"
                style={{
                  top: `${item.top}%`,
                  left: `${item.left}%`,
                  fontSize: `${item.size}px`,
                  opacity: item.opacity,
                  animationDelay: `${item.delay}s`,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
            {/* Main content */}
            <div className="text-center space-y-8">
              <div className="space-y-4">
                {/* Big Burger Emoji */}
                <div className="text-8xl sm:text-9xl mb-4 animate-bounce-slow drop-shadow-2xl">
                  🍔
                </div>
                <h1 className="text-6xl sm:text-8xl font-bold tracking-tight drop-shadow-md">
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                    SmartDine
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)' }}>
                  Zarezerwuj stolik w swojej ulubionej restauracji w kilka
                  sekund
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => signIn()}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200 text-lg"
                >
                  Zaloguj się
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="mt-24 grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Błyskawiczne rezerwacje
                </h3>
                <p className="text-gray-600 text-sm">
                  Zarezerwuj stolik w kilka kliknięć. Żadnych telefonów, żadnego
                  czekania.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Przed-zamówienie
                </h3>
                <p className="text-gray-600 text-sm">
                  Zamów dania z wyprzedzeniem i ciesz się szybszą obsługą w
                  restauracji.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
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
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Dla restauracji
                </h3>
                <p className="text-gray-600 text-sm">
                  Zarządzaj rezerwacjami, menu i stolikami w jednym miejscu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <p className="text-center text-gray-500 text-sm">
              © 2025 SmartDine. Wszystkie prawa zastrzeżone.
            </p>
          </div>
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
