"use server";

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// ZADANIE 3: Możliwość zmiany roli w trakcie
export async function changeUserRole(userId: string, newRole: UserRole) {  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  return updatedUser;
}