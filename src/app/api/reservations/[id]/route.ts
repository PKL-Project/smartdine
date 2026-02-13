import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withReservationAccess, ErrorResponses } from "@/lib/api-middleware";

export const GET = withReservationAccess(async (_, session, { params }) => {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      restaurant: {
        include: {
          tables: { orderBy: { capacity: "asc" } },
          categories: {
            include: {
              items: { where: { isAvailable: true }, orderBy: { name: "asc" } },
            },
            orderBy: { sort: "asc" },
          },
        },
      },
      preorderItems: { include: { menuItem: true } },
    },
  });

  if (!reservation) {
    return ErrorResponses.notFound("Reservation not found");
  }

  return NextResponse.json(reservation);
});

export const PATCH = withReservationAccess(async (req, session, { params }) => {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!reservation) {
    return ErrorResponses.notFound("Reservation not found");
  }

  // Only the reservation owner can edit
  if (reservation.userId !== session.user.id) {
    return ErrorResponses.forbidden("You cannot edit this reservation");
  }

  // Can't edit cancelled reservations
  if (reservation.status === "CANCELLED") {
    return ErrorResponses.badRequest("Cannot edit cancelled reservation");
  }

  const body = await req.json();
  const { startTime, partySize, tableId, specialRequests, preorderItems } = body;

  // Delete existing preorder items
  await prisma.preorderItem.deleteMany({
    where: { reservationId: id },
  });

  // Update reservation with EDITED status
  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      startTime: startTime ? new Date(startTime) : undefined,
      partySize: partySize ? Number(partySize) : undefined,
      tableId: tableId || null,
      specialRequests: specialRequests || null,
      status: "EDITED", // Set status to EDITED
      preorderItems: preorderItems?.length
        ? {
            create: preorderItems.map((item: { menuItemId: string; quantity: number }) => ({
              menuItemId: item.menuItemId,
              quantity: Number(item.quantity),
            })),
          }
        : undefined,
    },
    include: {
      restaurant: { select: { name: true, slug: true } },
      preorderItems: { include: { menuItem: true } },
    },
  });

  return NextResponse.json(updated);
});
