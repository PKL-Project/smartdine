import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, getUserByEmail, ErrorResponses } from "@/lib/api-middleware";

interface PreorderItem {
  menuItemId: string;
  quantity?: number;
  note?: string;
}

interface CreateReservationBody {
  restaurantId?: string;
  startTime?: string;
  durationMinutes?: number;
  partySize?: number;
  tableId?: string;
  specialRequests?: string;
  preorderItems?: PreorderItem[];
}

export const POST = withAuth(async (req, session) => {
  const body: CreateReservationBody = await req.json();
  const {
    restaurantId,
    startTime,
    durationMinutes = 90,
    partySize,
    tableId,
    specialRequests,
    preorderItems,
  } = body;

  if (!restaurantId || !startTime || !partySize) {
    return ErrorResponses.badRequest(
      "Missing required fields: restaurantId, startTime, partySize"
    );
  }

  // Check table availability - only CONFIRMED reservations block slots
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  if (tableId) {
    // Specific table requested - check if it's available
    const conflicts = await prisma.reservation.findMany({
      where: {
        tableId,
        status: "CONFIRMED", // Only confirmed reservations count
      },
      select: { startTime: true, durationMinutes: true },
    });

    // Check for any overlapping reservations
    const hasConflict = conflicts.some((reservation) => {
      const resStart = reservation.startTime;
      const resEnd = new Date(resStart.getTime() + reservation.durationMinutes * 60000);
      return start < resEnd && end > resStart;
    });

    if (hasConflict) {
      return ErrorResponses.conflict(
        "Time slot not available for selected table"
      );
    }
  } else {
    // No specific table - check if any table with sufficient capacity is available
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        tables: {
          where: { capacity: { gte: partySize } },
          orderBy: { capacity: 'asc' },
        },
      },
    });

    if (!restaurant || restaurant.tables.length === 0) {
      return ErrorResponses.badRequest(
        "No tables available for the requested party size"
      );
    }

    // Get all confirmed reservations that might overlap
    const confirmedReservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        status: "CONFIRMED",
        OR: [
          // Reservation starts before our slot ends
          {
            AND: [
              { startTime: { lt: end } },
              // ... and extends into our slot
              {
                startTime: {
                  gte: new Date(start.getTime()),
                },
              },
            ],
          },
          // Reservation starts during our slot
          {
            AND: [
              { startTime: { gte: start } },
              { startTime: { lt: end } },
            ],
          },
        ],
      },
      select: { tableId: true, startTime: true, durationMinutes: true },
    });

    // Check which tables are truly available (accounting for reservation durations)
    const bookedTableIds = new Set<string>();
    for (const reservation of confirmedReservations) {
      if (!reservation.tableId) continue;

      const resStart = reservation.startTime;
      const resEnd = new Date(resStart.getTime() + reservation.durationMinutes * 60000);

      // Check if this reservation actually overlaps with our time slot
      if (start < resEnd && end > resStart) {
        bookedTableIds.add(reservation.tableId);
      }
    }

    const availableTable = restaurant.tables.find((t) => !bookedTableIds.has(t.id));

    if (!availableTable) {
      return ErrorResponses.conflict(
        "No tables available for the requested time slot and party size"
      );
    }
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return ErrorResponses.unauthorized();
  }

  const reservation = await prisma.reservation.create({
    data: {
      restaurantId,
      userId: user.id,
      tableId: tableId ?? null,
      startTime: new Date(startTime),
      durationMinutes,
      partySize,
      specialRequests: specialRequests ?? null,
      status: "PENDING",
      preorderItems: preorderItems?.length
        ? {
            create: preorderItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: Math.max(1, Number(item.quantity || 1)),
              note: item.note ?? null,
            })),
          }
        : undefined,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(reservation);
});
