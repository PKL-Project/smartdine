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

export const PUT = withOwner(async (req, session, context) => {
  const params = await context.params as { slug: string };
  const slug = params.slug;

  const {
    name,
    description,
    tables,
    openingHours,
    timeSlots,
    slotDurationMinutes,
  }: {
    name?: string;
    description?: string;
    tables?: TableConfig[];
    openingHours?: OpeningHourConfig[];
    timeSlots?: TimeSlotConfig[];
    slotDurationMinutes?: number;
  } = await req.json();

  const owner = await getUserByEmail(session.user.email);
  if (!owner) {
    return ErrorResponses.unauthorized();
  }

  // Verify restaurant ownership
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!restaurant) {
    return ErrorResponses.notFound("Restaurant not found");
  }

  if (restaurant.ownerId !== owner.id) {
    return ErrorResponses.forbidden("You don't own this restaurant");
  }

  // Validate time slots fit within opening hours (if both are being updated)
  const hoursToValidate = openingHours !== undefined ? openingHours : [];
  const slotsToValidate = timeSlots !== undefined ? timeSlots : [];

  // Only validate if we have data for both (either from update or need to fetch existing)
  if (slotsToValidate.length > 0 || hoursToValidate.length > 0) {
    // If updating only one, fetch the other from database
    let finalHours = hoursToValidate;
    let finalSlots = slotsToValidate;

    if (openingHours === undefined || timeSlots === undefined) {
      const existingData = await prisma.restaurant.findUnique({
        where: { id: restaurant.id },
        include: {
          hours: true,
          timeSlots: true,
        },
      });

      if (existingData) {
        if (openingHours === undefined) finalHours = existingData.hours;
        if (timeSlots === undefined) finalSlots = existingData.timeSlots;
      }
    }

    // Now validate
    if (finalSlots.length > 0 && finalHours.length > 0) {
      const totalSlotTime = finalSlots.reduce(
        (sum, slot) => sum + slot.durationMinutes,
        0
      );

      let fitsInAnyDay = false;
      for (const hour of finalHours) {
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
  }

  // Prepare update data
  interface UpdateData {
    name?: string;
    description?: string;
    slotDurationMinutes?: number;
    tables?: {
      deleteMany: Record<string, never>;
      create: { name: string; capacity: number }[];
    };
    hours?: {
      deleteMany: Record<string, never>;
      create: { weekday: number; openMinutes: number; closeMinutes: number }[];
    };
    timeSlots?: {
      deleteMany: Record<string, never>;
      create: { startMinutes: number; durationMinutes: number }[];
    };
  }

  const updateData: UpdateData = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (slotDurationMinutes !== undefined) updateData.slotDurationMinutes = slotDurationMinutes;

  // Handle tables replacement
  if (tables !== undefined) {
    const tableRecords = tables.flatMap((config) =>
      Array.from({ length: config.quantity }, (_, i) => ({
        name: `Table ${config.capacity}p #${i + 1}`,
        capacity: config.capacity,
      }))
    );

    updateData.tables = {
      deleteMany: {},
      create: tableRecords,
    };
  }

  // Handle opening hours replacement
  if (openingHours !== undefined) {
    updateData.hours = {
      deleteMany: {},
      create: openingHours.map(h => ({
        weekday: h.weekday,
        openMinutes: h.openMinutes,
        closeMinutes: h.closeMinutes,
      })),
    };
  }

  // Handle time slots replacement
  if (timeSlots !== undefined) {
    updateData.timeSlots = {
      deleteMany: {},
      create: timeSlots.map(s => ({
        startMinutes: s.startMinutes,
        durationMinutes: s.durationMinutes,
      })),
    };
  }

  const updated = await prisma.restaurant.update({
    where: { slug },
    data: updateData,
    select: { id: true, slug: true },
  });

  return NextResponse.json(updated);
});

export const GET = withOwner(async (req, session, context) => {
  const params = await context.params as { slug: string };
  const slug = params.slug;

  const owner = await getUserByEmail(session.user.email);
  if (!owner) {
    return ErrorResponses.unauthorized();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: {
        orderBy: { capacity: 'asc' },
      },
      hours: {
        orderBy: { weekday: 'asc' },
      },
      timeSlots: {
        orderBy: { startMinutes: 'asc' },
      },
    },
  });

  if (!restaurant) {
    return ErrorResponses.notFound("Restaurant not found");
  }

  if (restaurant.ownerId !== owner.id) {
    return ErrorResponses.forbidden("You don't own this restaurant");
  }

  // Group tables by capacity for easier editing
  const tableGroups = restaurant.tables.reduce((acc, table) => {
    const existing = acc.find(g => g.capacity === table.capacity);
    if (existing) {
      existing.quantity++;
    } else {
      acc.push({ capacity: table.capacity, quantity: 1 });
    }
    return acc;
  }, [] as TableConfig[]);

  return NextResponse.json({
    ...restaurant,
    tableGroups,
  });
});
