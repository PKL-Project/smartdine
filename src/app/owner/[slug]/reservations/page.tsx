import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";

export default async function OwnerReservations({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email!;

  const r = await prisma.restaurant.findFirst({
    where: { slug, owner: { email } },
    select: {
      id: true,
      name: true,
      reservations: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
        take: 50,
      },
    },
  });

  if (!r) return <main className="p-6">Nie znaleziono lub brak dostępu.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rezerwacje — {r.name}</h1>
      <ul className="space-y-2">
        {r.reservations.map((res) => (
          <li
            key={res.id}
            className="border rounded-lg p-3 flex items-center justify-between"
          >
            <div className="text-sm">
              <div>
                <span className="font-medium">
                  {new Date(res.startTime).toLocaleString()}
                </span>{" "}
                • {res.partySize} os.
              </div>
              <div className="text-muted-foreground">
                Gość: {res.user.email}
              </div>
              <div>
                Status: <span className="font-medium">{res.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <form action={`/api/reservations/${res.id}/status`} method="post">
                <input type="hidden" name="status" value="CONFIRMED" />
                <Button type="submit" variant="secondary">
                  Akceptuj
                </Button>
              </form>
              <form action={`/api/reservations/${res.id}/status`} method="post">
                <input type="hidden" name="status" value="CANCELLED" />
                <Button type="submit" variant="destructive">
                  Odrzuć
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
