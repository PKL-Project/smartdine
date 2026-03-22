import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withReservationAccess, ErrorResponses } from "@/lib/api-middleware";

export const POST = withReservationAccess(async (_, session, { params }) => {
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: {
      userId: true,
      startTime: true,
      status: true,
    },
  });

  if (!reservation) {
    return ErrorResponses.notFound("Reservation not found");
  }

  // Only the reservation owner can cancel
  if (reservation.userId !== session.user.id) {
    return ErrorResponses.forbidden("You cannot cancel this reservation");
  }

  // Can't cancel already cancelled reservations
  if (reservation.status === "CANCELLED" || reservation.status === "CANCELLED_BY_CLIENT") {
    return ErrorResponses.badRequest("Reservation is already cancelled");
  }

  // Check if reservation is at least 24 hours away
  const now = new Date();
  const reservationTime = new Date(reservation.startTime);
  const hoursUntilReservation = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilReservation < 24) {
    return ErrorResponses.badRequest(
      "Nie można anulować rezerwacji - pozostało mniej niż 24 godziny do zaplanowanego czasu"
    );
  }

  // Cancel the reservation
  await prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED_BY_CLIENT" },
  });

  return NextResponse.json({ success: true });
});
