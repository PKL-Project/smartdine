import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Types for our middleware
export type AuthenticatedSession = Session & {
  user: {
    email: string;
    role?: UserRole | null;
  };
};

export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context: { params: Promise<T> }
) => Promise<NextResponse>;

export type AuthenticatedApiHandler<T = unknown> = (
  req: NextRequest,
  session: AuthenticatedSession,
  context: { params: Promise<T> }
) => Promise<NextResponse>;

// Error response helpers
export const ErrorResponses = {
  unauthorized: (message = "Unauthorized") =>
    NextResponse.json({ error: message }, { status: 401 }),
  forbidden: (message = "Forbidden") =>
    NextResponse.json({ error: message }, { status: 403 }),
  notFound: (message = "Not found") =>
    NextResponse.json({ error: message }, { status: 404 }),
  badRequest: (message = "Bad request") =>
    NextResponse.json({ error: message }, { status: 400 }),
  conflict: (message = "Conflict") =>
    NextResponse.json({ error: message }, { status: 409 }),
};

/**
 * Get authenticated session or throw error
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return session as AuthenticatedSession;
}

/**
 * Higher-order function that ensures the user is authenticated
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return async (req, context) => {
    const session = await getAuthenticatedSession();

    if (!session) {
      return ErrorResponses.unauthorized();
    }

    return handler(req, session, context);
  };
}

/**
 * Higher-order function that ensures the user has a specific role
 */
export function withRole<T = unknown>(
  role: UserRole,
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return withAuth<T>(async (req, session, context) => {
    if (session.user.role !== role) {
      return ErrorResponses.forbidden();
    }

    return handler(req, session, context);
  });
}

/**
 * Higher-order function that ensures the user is a restaurant owner
 */
export function withOwner<T = unknown>(
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return withRole<T>("OWNER", handler);
}

/**
 * Verify that the authenticated user owns the specified restaurant
 */
export async function verifyRestaurantOwnership(
  restaurantId: string,
  userEmail: string
): Promise<boolean> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { owner: { select: { email: true } } },
  });

  return restaurant?.owner.email === userEmail;
}

/**
 * Verify that the authenticated user owns a restaurant by slug
 */
export async function verifyRestaurantOwnershipBySlug(
  slug: string,
  userEmail: string
): Promise<boolean> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { owner: { select: { email: true } } },
  });

  return restaurant?.owner.email === userEmail;
}

/**
 * Get user by email or return error
 */
export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user;
}

/**
 * Verify that the authenticated user owns/created the reservation
 */
export async function verifyReservationOwnership(
  reservationId: string,
  userEmail: string
): Promise<boolean> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { user: { select: { email: true } } },
  });

  return reservation?.user.email === userEmail;
}

/**
 * Verify that the authenticated user owns the restaurant associated with the reservation
 */
export async function verifyReservationRestaurantOwnership(
  reservationId: string,
  userEmail: string
): Promise<boolean> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: { include: { owner: { select: { email: true } } } } },
  });

  return reservation?.restaurant.owner.email === userEmail;
}

/**
 * Higher-order function for endpoints that require restaurant ownership
 */
export function withRestaurantOwnership<T extends { id: string }>(
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return withOwner<T>(async (req, session, context) => {
    const params = await context.params;
    const restaurantId = params.id;

    const isOwner = await verifyRestaurantOwnership(
      restaurantId,
      session.user.email
    );

    if (!isOwner) {
      return ErrorResponses.forbidden();
    }

    return handler(req, session, context);
  });
}

/**
 * Higher-order function for endpoints that require reservation ownership (owner can modify their restaurant's reservations)
 */
export function withReservationAccess<T extends { id: string }>(
  handler: AuthenticatedApiHandler<T>
): ApiHandler<T> {
  return withAuth<T>(async (req, session, context) => {
    const params = await context.params;
    const reservationId = params.id;

    // Check if user is the reservation owner OR the restaurant owner
    const isReservationOwner = await verifyReservationOwnership(
      reservationId,
      session.user.email
    );

    const isRestaurantOwner = session.user.role === "OWNER" &&
      await verifyReservationRestaurantOwnership(
        reservationId,
        session.user.email
      );

    if (!isReservationOwner && !isRestaurantOwner) {
      return ErrorResponses.forbidden();
    }

    return handler(req, session, context);
  });
}
