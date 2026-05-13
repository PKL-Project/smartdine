import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (req, session) => {
  const reservations = await prisma.reservation.findMany({
    where: {
      user: { email: session.user.email },
    },
    orderBy: { startTime: "desc" },
    select: {
      id: true,
      startTime: true,
      durationMinutes: true,
      partySize: true,
      status: true,
      table: {
        select: {
          id: true,
          name: true,
          capacity: true,
        },
      },
      restaurant: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    take: 50,
  });

  return NextResponse.json(reservations);
});
