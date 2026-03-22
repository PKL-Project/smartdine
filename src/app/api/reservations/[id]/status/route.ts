import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyReservationRestaurantOwnership, ErrorResponses } from "@/lib/api-middleware";
import { ReservationStatus } from "@prisma/client";

export const POST = withOwner<{ id: string }>(async (req, session, { params }) => {
  const { id } = await params;
  const form = await req.formData();
  const status = form.get("status");

  // Validate status
  if (status !== "CONFIRMED" && status !== "CANCELLED" && status !== "EDITED") {
    return ErrorResponses.badRequest("Invalid status value");
  }

  // Verify the reservation belongs to one of the owner's restaurants
  const isOwner = await verifyReservationRestaurantOwnership(
    id,
    session.user.email
  );

  if (!isOwner) {
    return ErrorResponses.forbidden("You cannot modify this reservation");
  }

  // If confirming, check for conflicts with other CONFIRMED reservations
  if (status === "CONFIRMED") {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: {
        tableId: true,
        startTime: true,
        durationMinutes: true,
        restaurantId: true,
        partySize: true,
      },
    });

    if (reservation) {
      const start = reservation.startTime;
      const end = new Date(start.getTime() + reservation.durationMinutes * 60000);

      if (reservation.tableId) {
        // Check if the specific table is available - get all confirmed reservations for this table
        const conflicts = await prisma.reservation.findMany({
          where: {
            tableId: reservation.tableId,
            status: "CONFIRMED",
            id: { not: id }, // Exclude current reservation
          },
          select: { startTime: true, durationMinutes: true },
        });

        // Check for any overlapping reservations
        const hasConflict = conflicts.some((conf) => {
          const confStart = conf.startTime;
          const confEnd = new Date(confStart.getTime() + conf.durationMinutes * 60000);
          // Two reservations overlap if: start < confEnd AND end > confStart
          return start < confEnd && end > confStart;
        });

        if (hasConflict) {
          // Table is already booked - return error
          return ErrorResponses.conflict("Stolik jest już zarezerwowany w tym czasie");
        }
      } else {
        // No specific table - find an available one
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: reservation.restaurantId },
          include: {
            tables: {
              where: { capacity: { gte: reservation.partySize } },
              orderBy: { capacity: 'asc' },
            },
          },
        });

        if (restaurant && restaurant.tables.length > 0) {
          const confirmedReservations = await prisma.reservation.findMany({
            where: {
              restaurantId: reservation.restaurantId,
              status: "CONFIRMED",
              id: { not: id },
            },
            select: { tableId: true, startTime: true, durationMinutes: true },
          });

          // Find tables that are actually booked (accounting for overlaps)
          const bookedTableIds = new Set<string>();
          for (const conf of confirmedReservations) {
            if (!conf.tableId) continue;

            const confStart = conf.startTime;
            const confEnd = new Date(confStart.getTime() + conf.durationMinutes * 60000);

            // Check if this reservation overlaps with our time slot
            if (start < confEnd && end > confStart) {
              bookedTableIds.add(conf.tableId);
            }
          }

          const availableTable = restaurant.tables.find((t) => !bookedTableIds.has(t.id));

          if (!availableTable) {
            return ErrorResponses.conflict("Brak dostępnych stolików w tym czasie");
          }

          // Assign the available table
          await prisma.reservation.update({
            where: { id },
            data: {
              status: status as ReservationStatus,
              tableId: availableTable.id,
            },
          });

          return NextResponse.json({ success: true });
        }
      }
    }
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: status as ReservationStatus },
  });

  return NextResponse.json({ success: true });
});
