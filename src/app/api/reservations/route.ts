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

  // Get the restaurant with tables
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

  // Get all CONFIRMED reservations that might overlap
  // Only confirmed reservations block new bookings
  const confirmedReservations = await prisma.reservation.findMany({
    where: {
      restaurantId,
      status: "CONFIRMED",
    },
    select: { tableId: true, startTime: true, durationMinutes: true },
  });

  // Count how many confirmed reservations overlap with requested time slot
  let overlappingCount = 0;

  for (const reservation of confirmedReservations) {
    const resStart = reservation.startTime;
    const resEnd = new Date(resStart.getTime() + reservation.durationMinutes * 60000);

    // Check if this reservation overlaps with our time slot
    if (start < resEnd && end > resStart) {
      overlappingCount++;
    }
  }

  // Check if we have capacity
  const totalTablesForPartySize = restaurant.tables.length;

  if (overlappingCount >= totalTablesForPartySize) {
    return ErrorResponses.conflict(
      "Brak dostępnych stolików w wybranym terminie"
    );
  }

  // If specific table requested, check if it's available
  if (tableId) {
    const tableConflict = confirmedReservations.some((reservation) => {
      if (reservation.tableId !== tableId) return false;
      const resStart = reservation.startTime;
      const resEnd = new Date(resStart.getTime() + reservation.durationMinutes * 60000);
      return start < resEnd && end > resStart;
    });

    if (tableConflict) {
      return ErrorResponses.conflict(
        "Wybrany stolik jest już zarezerwowany w tym czasie"
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
