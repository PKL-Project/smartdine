import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, getUserByEmail, ErrorResponses } from "@/lib/api-middleware";

interface TableConfig {
  capacity: number;
  quantity: number;
}

interface TimeSlotConfig {
  startMinutes: number;
  durationMinutes: number;
}

interface OpeningHourConfig {
  weekday: number;
  openMinutes: number;
  closeMinutes: number;
}

export const POST = withOwner(async (req, session) => {
  const {
    name,
    slug,
    description,
    tables = [],
    openingHours = [],
    timeSlots = [],
    slotDurationMinutes = 90
  }: {
    name: string;
    slug: string;
    description?: string;
    tables?: TableConfig[];
    openingHours?: OpeningHourConfig[];
    timeSlots?: TimeSlotConfig[];
    slotDurationMinutes?: number;
  } = await req.json();

  if (!name || !slug) {
    return ErrorResponses.badRequest("Missing required fields: name and slug");
  }

  // Validate time slots fit within opening hours
  if (timeSlots.length > 0 && openingHours.length > 0) {
    const totalSlotTime = timeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);

    let fitsInAnyDay = false;
    for (const hour of openingHours) {
      const availableMinutes = hour.closeMinutes - hour.openMinutes;
      if (totalSlotTime <= availableMinutes) {
        fitsInAnyDay = true;
        break;
      }
    }

    if (!fitsInAnyDay) {
      return ErrorResponses.badRequest(
        "Time slots do not fit within the specified opening hours"
      );
    }
  }

  const owner = await getUserByEmail(session.user.email);
  if (!owner) {
    return ErrorResponses.unauthorized();
  }

  // Check if owner already has a restaurant (limit: 1 per owner)
  const existingRestaurant = await prisma.restaurant.findFirst({
    where: { ownerId: owner.id },
  });

  if (existingRestaurant) {
    return ErrorResponses.conflict("You already have a restaurant. Only one restaurant per owner is allowed.");
  }

  // Create table records based on quantity
  const tableRecords = tables.flatMap((config) =>
    Array.from({ length: config.quantity }, (_, i) => ({
      name: `Table ${config.capacity}p #${i + 1}`,
      capacity: config.capacity,
    }))
  );

  const created = await prisma.restaurant.create({
    data: {
      name,
      slug,
      description,
      slotDurationMinutes,
      ownerId: owner.id,
      tables: tableRecords.length > 0 ? { create: tableRecords } : undefined,
      hours: openingHours.length > 0 ? { create: openingHours } : undefined,
      timeSlots: timeSlots.length > 0 ? { create: timeSlots } : undefined,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(created);
});
