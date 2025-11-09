import NextAuth from "next-auth";
import { UserRole } from "@/types/roles";

declare module "next-auth" {
  interface User {
    role?: UserRole | null;
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: UserRole | null;
    };
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    role?: UserRole | null;
  }
}
