"use server";

import { PrismaClient, ReservationStatus } from "@prisma/client";

// Jeśli macie już wyeksportowaną instancję Prisma w innym pliku (np. lib/prisma.ts), 
// zaimportuj ją stamtąd zamiast tworzyć nową.
const prisma = new PrismaClient();

// ZADANIE 1: Weryfikacja stolików i czas rezerwacji
export async function createReservation(data: {
  userId: string;
  restaurantId: string;
  tableId: string;
  startTime: Date;
  durationMinutes: number;
  partySize: number;
}) {
  const newStart = new Date(data.startTime);
  const newEnd = new Date(newStart.getTime() + data.durationMinutes * 60000);

  const startOfDay = new Date(newStart);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(newStart);
  endOfDay.setHours(23, 59, 59, 999);

  // Pobieramy rezerwacje dla tego stolika z danego dnia
  const existingReservations = await prisma.reservation.findMany({
    where: {
      tableId: data.tableId,
      status: { not: "CANCELLED" },
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Weryfikacja nakładania się (Koniec A > Start B && Start A < Koniec B)
  const isOverlapping = existingReservations.some((res) => {
    const resStart = new Date(res.startTime);
    const resEnd = new Date(resStart.getTime() + res.durationMinutes * 60000);
    return newStart < resEnd && newEnd > resStart;
  });

  if (isOverlapping) {
    throw new Error("Przepraszamy, ten stolik jest już zajęty w wybranym terminie.");
  }

  // Tworzenie rezerwacji, jeśli wolne
  const reservation = await prisma.reservation.create({
    data: {
      userId: data.userId,
      restaurantId: data.restaurantId,
      tableId: data.tableId,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      partySize: data.partySize,
      status: "PENDING",
    },
  });

  return reservation;
}

// ZADANIE 2: Anulowanie rezerwacji do 1 dzień przed
export async function cancelReservation(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId }
  });

  if (!reservation) throw new Error("Nie znaleziono rezerwacji.");
  if (reservation.status === "CANCELLED") throw new Error("Rezerwacja jest już anulowana.");

  const now = new Date();
  const timeDifferenceInMs = reservation.startTime.getTime() - now.getTime();
  const hoursUntilReservation = timeDifferenceInMs / (1000 * 60 * 60);

  // Walidacja czasowa
  if (hoursUntilReservation < 24) {
    throw new Error("Rezerwację można anulować najpóźniej na 24 godziny przed jej rozpoczęciem.");
  }

  const updatedReservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" }
  });

  return updatedReservation;
}