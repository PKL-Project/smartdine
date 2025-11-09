import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withReservationAccess, ErrorResponses } from "@/lib/api-middleware";

export const GET = withReservationAccess(async (_, session, { params }) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      restaurant: { select: { name: true, slug: true } },
      preorderItems: { include: { menuItem: true } },
    },
  });

  if (!reservation) {
    return ErrorResponses.notFound("Reservation not found");
  }

  return NextResponse.json(reservation);
});
